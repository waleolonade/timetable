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
            // Fetch all general courses and aggregate assigned departments
            $query = "
                SELECT gc.*, 
                GROUP_CONCAT(d.id) as department_ids,
                GROUP_CONCAT(d.name) as department_names
                FROM general_courses gc
                LEFT JOIN general_course_departments gcd ON gc.id = gcd.general_course_id
                LEFT JOIN departments d ON gcd.department_id = d.id
                GROUP BY gc.id
                ORDER BY gc.created_at DESC
            ";
            $stmt = $conn->query($query);
            $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format arrays
            foreach ($courses as &$course) {
                $course['department_ids'] = $course['department_ids'] ? explode(',', $course['department_ids']) : [];
                $course['department_names'] = $course['department_names'] ? explode(',', $course['department_names']) : [];
            }
            
            echo json_encode(['success' => true, 'data' => $courses]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            // Bulk Create
            if (isset($data->bulk) && $data->bulk === true && !empty($data->courses)) {
                $conn->beginTransaction();
                $stmt = $conn->prepare("
                    INSERT INTO general_courses 
                    (course_code, course_name, credit_unit, semester, level, duration, student_capacity, exam_format, programmes, is_active) 
                    VALUES (:code, :name, :unit, :sem, :lvl, :dur, :cap, :fmt, :prog, 1)
                ");
                $count = 0;
                
                foreach ($data->courses as $c) {
                    if (!empty($c->course_code) && !empty($c->course_name)) {
                        // Check if exists
                        $check = $conn->prepare("SELECT id FROM general_courses WHERE course_code = :code");
                        $check->execute([':code' => $c->course_code]);
                        if ($check->rowCount() == 0) {
                            $stmt->execute([
                                ':code' => $c->course_code,
                                ':name' => $c->course_name,
                                ':unit' => $c->credit_unit ?? 2,
                                ':sem' => $c->semester ?? 1,
                                ':lvl' => $c->level ?? '',
                                ':dur' => $c->duration ?? 150,
                                ':cap' => $c->student_capacity ?? 0,
                                ':fmt' => $c->exam_format ?? 'Written',
                                ':prog' => $c->programmes ?? ''
                            ]);
                            $count++;
                        }
                    }
                }
                $conn->commit();
                echo json_encode(['success' => true, 'message' => "$count general courses imported successfully."]);
                
            } 
            // Single Create
            elseif (!empty($data->course_code) && !empty($data->course_name)) {
                $conn->beginTransaction();
                
                $stmt = $conn->prepare("
                    INSERT INTO general_courses 
                    (course_code, course_name, credit_unit, semester, level, duration, student_capacity, exam_format, programmes, is_active) 
                    VALUES (:code, :name, :unit, :sem, :lvl, :dur, :cap, :fmt, :prog, 1)
                ");
                
                $stmt->execute([
                    ':code' => $data->course_code,
                    ':name' => $data->course_name,
                    ':unit' => $data->credit_unit ?? 2,
                    ':sem' => $data->semester ?? 1,
                    ':lvl' => $data->level ?? '',
                    ':dur' => $data->duration ?? 150,
                    ':cap' => $data->student_capacity ?? 0,
                    ':fmt' => $data->exam_format ?? 'Written',
                    ':prog' => $data->programmes ?? ''
                ]);
                
                $course_id = $conn->lastInsertId();
                
                // Assign departments
                if (!empty($data->department_ids) && is_array($data->department_ids)) {
                    $depStmt = $conn->prepare("INSERT INTO general_course_departments (general_course_id, department_id) VALUES (?, ?)");
                    foreach ($data->department_ids as $dep_id) {
                        $depStmt->execute([$course_id, $dep_id]);
                    }
                }
                
                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'General course created successfully.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Course Code and Title are required.']);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $conn->beginTransaction();
                
                if (isset($data->course_name)) {
                    // Full Update
                    $stmt = $conn->prepare("
                        UPDATE general_courses 
                        SET course_code=:code, course_name=:name, credit_unit=:unit, semester=:sem, level=:lvl, 
                            duration=:dur, student_capacity=:cap, exam_format=:fmt, programmes=:prog 
                        WHERE id=:id
                    ");
                    
                    $stmt->execute([
                        ':code' => $data->course_code,
                        ':name' => $data->course_name,
                        ':unit' => $data->credit_unit ?? 2,
                        ':sem' => $data->semester ?? 1,
                        ':lvl' => $data->level ?? '',
                        ':dur' => $data->duration ?? 150,
                        ':cap' => $data->student_capacity ?? 0,
                        ':fmt' => $data->exam_format ?? 'Written',
                        ':prog' => $data->programmes ?? '',
                        ':id' => $data->id
                    ]);
                    
                    // Update departments: delete old, insert new
                    if (isset($data->department_ids) && is_array($data->department_ids)) {
                        $delStmt = $conn->prepare("DELETE FROM general_course_departments WHERE general_course_id = ?");
                        $delStmt->execute([$data->id]);
                        
                        $depStmt = $conn->prepare("INSERT INTO general_course_departments (general_course_id, department_id) VALUES (?, ?)");
                        foreach ($data->department_ids as $dep_id) {
                            $depStmt->execute([$data->id, $dep_id]);
                        }
                    }
                    
                } elseif (isset($data->is_active)) {
                    // Toggle Status
                    $stmt = $conn->prepare("UPDATE general_courses SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->execute([':is_active' => $isActive, ':id' => $data->id]);
                }
                
                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'General course updated successfully.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Course ID is required.']);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM general_courses WHERE id = :id");
                $stmt->bindParam(':id', $data->id);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Course deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete course.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Course ID is required.']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
    }
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
