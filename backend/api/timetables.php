<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Fetch timetables with joined course and classroom data
            $dept_id = isset($_GET['department_id']) ? $_GET['department_id'] : null;
            
            $query = "
                SELECT t.*, 
                       c.course_code, c.course_name, c.level, c.department_id, c.semester,
                       r.name as room_name, r.capacity as room_capacity, r.building,
                       i.name as invigilator_name
                FROM timetables t
                JOIN courses c ON t.course_id = c.id
                JOIN classrooms r ON t.classroom_id = r.id
                LEFT JOIN invigilators i ON t.invigilator_id = i.id
                WHERE 1=1
            ";
            
            $params = [];

            if ($dept_id) {
                $query .= " AND c.department_id = :dept_id";
                $params[':dept_id'] = $dept_id;
            }
            
            if (!empty($_GET['level'])) {
                $query .= " AND c.level = :level";
                $params[':level'] = $_GET['level'];
            }
            if (!empty($_GET['semester'])) {
                $query .= " AND c.semester = :semester";
                $params[':semester'] = $_GET['semester'];
            }
            if (!empty($_GET['venue_id'])) {
                $query .= " AND t.classroom_id = :venue_id";
                $params[':venue_id'] = $_GET['venue_id'];
            }
            if (!empty($_GET['session'])) {
                $query .= " AND t.session = :session";
                $params[':session'] = $_GET['session'];
            }
            if (!empty($_GET['status'])) {
                $query .= " AND t.status = :status";
                $params[':status'] = $_GET['status'];
            }
            if (!empty($_GET['course_id'])) {
                $query .= " AND t.course_id = :course_id";
                $params[':course_id'] = $_GET['course_id'];
            }
            
            $query .= " ORDER BY t.day_of_week, t.start_time";
            
            $stmt = $conn->prepare($query);
            foreach ($params as $key => $val) {
                $stmt->bindValue($key, $val);
            }
            $stmt->execute();
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            // Handle Submit for Approval
            if (isset($_GET['action']) && $_GET['action'] === 'submit') {
                $department_id = $data->department_id ?? null;
                if ($department_id) {
                    $stmt = $conn->prepare("UPDATE timetables SET status = 'Pending Approval' WHERE status = 'Draft' AND course_id IN (SELECT id FROM courses WHERE department_id = :did)");
                    $stmt->execute([':did' => $department_id]);
                    echo json_encode(['success' => true, 'message' => 'Timetable submitted for approval.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Missing department ID.']);
                }
                exit;
            }

            // Handle Auto-Generation
            if (isset($_GET['action']) && $_GET['action'] === 'auto_generate') {
                $semester = $data->semester ?? 'First Semester';
                $session = $data->session ?? '2026/2027';
                $department_id = $data->department_id ?? null;
                
                try {
                    $conn->beginTransaction();
                    
                    // Clear existing timetable for this specific department's courses
                    if ($department_id) {
                        $clearStmt = $conn->prepare("DELETE FROM timetables WHERE course_id IN (SELECT id FROM courses WHERE department_id = :did)");
                        $clearStmt->execute([':did' => $department_id]);
                    } else {
                        // Admin generating for all (fallback)
                        $conn->exec("DELETE FROM timetables");
                    }
                    
                    // Fetch courses to schedule
                    if ($department_id) {
                        $coursesStmt = $conn->prepare("SELECT id, department_id, level, exam_duration, student_population FROM courses WHERE department_id = :did");
                        $coursesStmt->execute([':did' => $department_id]);
                    } else {
                        $coursesStmt = $conn->query("SELECT id, department_id, level, exam_duration, student_population FROM courses");
                    }
                    $courses = $coursesStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Fetch Classrooms (Prioritize Department Halls, then Global Halls)
                    if ($department_id) {
                        $roomsStmt = $conn->prepare("
                            SELECT id, capacity, department_id 
                            FROM classrooms 
                            WHERE is_active = 1 AND (department_id = :did OR department_id IS NULL)
                            ORDER BY 
                                CASE WHEN department_id = :did THEN 1 ELSE 2 END, 
                                capacity DESC
                        ");
                        $roomsStmt->execute([':did' => $department_id]);
                    } else {
                        $roomsStmt = $conn->query("SELECT id, capacity, department_id FROM classrooms WHERE is_active = 1 ORDER BY capacity DESC");
                    }
                    $classrooms = $roomsStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    if (empty($classrooms)) {
                        throw new Exception("No active classrooms available for scheduling.");
                    }
                    
                    // Load ALL existing bookings across the university into memory to avoid room clashes
                    $allBookingsStmt = $conn->query("
                        SELECT t.classroom_id, t.day_of_week, t.start_time, t.end_time, c.department_id, c.level 
                        FROM timetables t
                        JOIN courses c ON t.course_id = c.id
                    ");
                    $existingSlots = $allBookingsStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    $start_hour = 8; // 8:00 AM
                    $end_hour = 18; // 6:00 PM
                    
                    $insertStmt = $conn->prepare("INSERT INTO timetables (course_id, classroom_id, day_of_week, start_time, end_time, semester, session) 
                                                  VALUES (:cid, :rid, :dow, :st, :et, :sem, :ses)");
                    
                    $assignedCount = 0;
                    
                    // Helper to check if a time slot is free in a room and for a dept/level
                    $isSlotFree = function($roomId, $day, $st, $et, $deptId, $level, &$existingSlots) {
                        $st_time = strtotime($st);
                        $et_time = strtotime($et);
                        
                        foreach ($existingSlots as $slot) {
                            if ($slot['day_of_week'] !== $day) continue;
                            
                            $slot_st = strtotime($slot['start_time']);
                            $slot_et = strtotime($slot['end_time']);
                            
                            // Check overlap condition
                            // Overlap happens if (st < slot_et) AND (et > slot_st)
                            if ($st_time < $slot_et && $et_time > $slot_st) {
                                // Overlaps in time!
                                
                                // Clash Type 1: Same Room
                                if ($slot['classroom_id'] == $roomId) {
                                    return false;
                                }
                                
                                // Clash Type 2: Same Department and Same Level (Students can't be in 2 places)
                                if ($slot['department_id'] == $deptId && $slot['level'] == $level) {
                                    return false;
                                }
                                
                                // Clash Type 3: General Course Conflict
                                // If the existing slot is a General Course (Admin scheduled, dept is null)
                                // and it targets the same level (or all levels if level is null), students can't attend both.
                                if ($slot['department_id'] === null && ($slot['level'] === null || $slot['level'] == $level)) {
                                    return false;
                                }
                            }
                        }
                        return true;
                    };
                    
                    foreach ($courses as $course) {
                        $assigned = false;
                        $durationMins = $course['exam_duration'] ? (int)$course['exam_duration'] : 150; // Default 2.5 hours
                        
                        foreach ($days as $day) {
                            if ($assigned) break;
                            
                            // Try scheduling in 30-min increments
                            for ($hour = $start_hour; $hour < $end_hour; $hour++) {
                                if ($assigned) break;
                                
                                foreach (['00', '30'] as $min) {
                                    if ($assigned) break;
                                    
                                    $st = sprintf("%02d:%s:00", $hour, $min);
                                    
                                    // Calculate end time
                                    $et_time = strtotime($st) + ($durationMins * 60);
                                    $et = date("H:i:s", $et_time);
                                    
                                    // Don't schedule past closing time
                                    if ($et_time > strtotime("18:00:00")) continue;
                                    
                                    // Find a classroom that fits capacity (with 10% margin) and is free
                                    foreach ($classrooms as $room) {
                                        $reqCapacity = (int)($course['student_population'] ?? 0);
                                        if ($reqCapacity > 0 && $room['capacity'] < ($reqCapacity * 0.9)) {
                                            continue; // Room too small
                                        }
                                        
                                        if ($isSlotFree($room['id'], $day, $st, $et, $course['department_id'], $course['level'], $existingSlots)) {
                                            // Assign!
                                            $insertStmt->execute([
                                                ':cid' => $course['id'],
                                                ':rid' => $room['id'],
                                                ':dow' => $day,
                                                ':st' => $st,
                                                ':et' => $et,
                                                ':sem' => $semester,
                                                ':ses' => $session
                                            ]);
                                            
                                            // Add to existing slots for next iteration
                                            $existingSlots[] = [
                                                'classroom_id' => $room['id'],
                                                'day_of_week' => $day,
                                                'start_time' => $st,
                                                'end_time' => $et,
                                                'department_id' => $course['department_id'],
                                                'level' => $course['level']
                                            ];
                                            
                                            $assigned = true;
                                            $assignedCount++;
                                            break; // Next course
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => "Auto-generation complete. Scheduled $assignedCount courses successfully."]);
                } catch (Exception $e) {
                    $conn->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Auto-generation failed: ' . $e->getMessage()]);
                }
                exit;
            }
            
            // Basic validation for Manual Add
            if (!empty($data->course_id) && !empty($data->classroom_id) && !empty($data->day_of_week) && !empty($data->start_time) && !empty($data->end_time)) {
                
                // Check for overlapping in the same room
                $checkQuery = "SELECT id FROM timetables 
                               WHERE classroom_id = :room_id AND day_of_week = :day 
                               AND ((start_time < :end_time AND end_time > :start_time))";
                $checkStmt = $conn->prepare($checkQuery);
                $checkStmt->execute([
                    ':room_id' => $data->classroom_id,
                    ':day' => $data->day_of_week,
                    ':start_time' => $data->start_time,
                    ':end_time' => $data->end_time
                ]);
                
                if ($checkStmt->rowCount() > 0) {
                    echo json_encode(['success' => false, 'message' => 'Room double-booking conflict detected!']);
                    exit;
                }

                $stmt = $conn->prepare("INSERT INTO timetables (course_id, classroom_id, day_of_week, start_time, end_time, semester, session, invigilator_id) 
                                        VALUES (:course_id, :classroom_id, :day_of_week, :start_time, :end_time, :semester, :session, :invigilator_id)");
                
                $stmt->bindParam(':course_id', $data->course_id, PDO::PARAM_INT);
                $stmt->bindParam(':classroom_id', $data->classroom_id, PDO::PARAM_INT);
                $stmt->bindParam(':day_of_week', $data->day_of_week);
                $stmt->bindParam(':start_time', $data->start_time);
                $stmt->bindParam(':end_time', $data->end_time);
                $stmt->bindParam(':semester', $data->semester);
                $stmt->bindParam(':session', $data->session);
                
                $invig = isset($data->invigilator_id) && $data->invigilator_id ? $data->invigilator_id : null;
                $stmt->bindParam(':invigilator_id', $invig, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Timetable slot created successfully.', 'id' => $conn->lastInsertId()]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create slot.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            
            if (!empty($data->id) && !empty($data->course_id) && !empty($data->classroom_id) && !empty($data->day_of_week) && !empty($data->start_time) && !empty($data->end_time)) {
                
                // Check for overlapping in the same room (excluding this specific slot)
                $checkQuery = "SELECT id FROM timetables 
                               WHERE classroom_id = :room_id AND day_of_week = :day AND id != :id
                               AND ((start_time < :end_time AND end_time > :start_time))";
                $checkStmt = $conn->prepare($checkQuery);
                $checkStmt->execute([
                    ':room_id' => $data->classroom_id,
                    ':day' => $data->day_of_week,
                    ':id' => $data->id,
                    ':start_time' => $data->start_time,
                    ':end_time' => $data->end_time
                ]);
                
                if ($checkStmt->rowCount() > 0) {
                    echo json_encode(['success' => false, 'message' => 'Room double-booking conflict detected for the new times!']);
                    exit;
                }

                $stmt = $conn->prepare("UPDATE timetables SET course_id = :course_id, classroom_id = :classroom_id, day_of_week = :day_of_week, start_time = :start_time, end_time = :end_time, invigilator_id = :invigilator_id WHERE id = :id");
                
                $stmt->bindParam(':course_id', $data->course_id, PDO::PARAM_INT);
                $stmt->bindParam(':classroom_id', $data->classroom_id, PDO::PARAM_INT);
                $stmt->bindParam(':day_of_week', $data->day_of_week);
                $stmt->bindParam(':start_time', $data->start_time);
                $stmt->bindParam(':end_time', $data->end_time);
                
                $invig = isset($data->invigilator_id) && $data->invigilator_id ? $data->invigilator_id : null;
                $stmt->bindParam(':invigilator_id', $invig, PDO::PARAM_INT);
                
                $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Timetable slot updated successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update slot.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Missing required fields for update.']);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM timetables WHERE id = :id");
                $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Slot deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete slot.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Slot ID is required.']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
