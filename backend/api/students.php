<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';

$db = new Database();
$conn = $db->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $department_id = isset($_GET['department_id']) ? $_GET['department_id'] : null;
            $level = isset($_GET['level']) ? $_GET['level'] : null;

            $query = "SELECT s.*, u.first_name, u.last_name, u.email, u.department_id, d.department_name 
                      FROM students s
                      JOIN users u ON s.user_id = u.id
                      LEFT JOIN departments d ON u.department_id = d.id
                      WHERE u.role = 'Student'";
            
            $params = [];
            if ($department_id) {
                $query .= " AND u.department_id = :dept_id";
                $params[':dept_id'] = $department_id;
            }
            if ($level) {
                $query .= " AND s.level = :level";
                $params[':level'] = $level;
            }
            $query .= " ORDER BY s.level ASC, u.last_name ASC";

            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $students]);
            break;

        case 'POST':
            // Can handle bulk import via JSON array or single student add
            $data = json_decode(file_get_contents("php://input"));
            
            if (isset($_GET['action']) && $_GET['action'] == 'bulk_import') {
                if (!is_array($data)) {
                    echo json_encode(['success' => false, 'message' => 'Expected an array of students.']);
                    exit;
                }
                
                $conn->beginTransaction();
                $imported = 0;
                try {
                    $uStmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password, role, department_id, is_active) VALUES (:fn, :ln, :email, :pass, 'Student', :dept_id, 1)");
                    $sStmt = $conn->prepare("INSERT INTO students (user_id, matric_no, level, programme) VALUES (:uid, :matric, :lvl, :prog)");
                    
                    $defaultPass = password_hash('password123', PASSWORD_BCRYPT);
                    
                    foreach ($data as $student) {
                        if (empty($student->matric_no) || empty($student->department_id)) continue;
                        
                        // Check if matric exists
                        $chk = $conn->prepare("SELECT id FROM students WHERE matric_no = ?");
                        $chk->execute([$student->matric_no]);
                        if ($chk->rowCount() > 0) continue; // Skip duplicates
                        
                        $email = $student->email ?? ($student->matric_no . '@student.edu');
                        
                        $uStmt->execute([
                            ':fn' => $student->first_name ?? 'Student',
                            ':ln' => $student->last_name ?? '',
                            ':email' => $email,
                            ':pass' => $defaultPass,
                            ':dept_id' => $student->department_id
                        ]);
                        $uid = $conn->lastInsertId();
                        
                        $sStmt->execute([
                            ':uid' => $uid,
                            ':matric' => $student->matric_no,
                            ':lvl' => $student->level ?? '100',
                            ':prog' => $student->programme ?? 'BSc'
                        ]);
                        $imported++;
                    }
                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => "$imported students imported successfully."]);
                } catch (Exception $e) {
                    $conn->rollBack();
                    echo json_encode(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()]);
                }
            } else {
                // Add single student
                if (!empty($data->matric_no) && !empty($data->department_id)) {
                    $conn->beginTransaction();
                    $chk = $conn->prepare("SELECT id FROM students WHERE matric_no = ?");
                    $chk->execute([$data->matric_no]);
                    if ($chk->rowCount() > 0) {
                        echo json_encode(['success' => false, 'message' => 'Matric number already exists.']);
                        $conn->rollBack();
                        exit;
                    }

                    $defaultPass = password_hash('password123', PASSWORD_BCRYPT);
                    $email = $data->email ?? ($data->matric_no . '@student.edu');
                    
                    $uStmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password, role, department_id, is_active) VALUES (:fn, :ln, :email, :pass, 'Student', :dept_id, 1)");
                    $uStmt->execute([
                        ':fn' => $data->first_name ?? 'Student',
                        ':ln' => $data->last_name ?? '',
                        ':email' => $email,
                        ':pass' => $defaultPass,
                        ':dept_id' => $data->department_id
                    ]);
                    $uid = $conn->lastInsertId();
                    
                    $sStmt = $conn->prepare("INSERT INTO students (user_id, matric_no, level, programme) VALUES (:uid, :matric, :lvl, :prog)");
                    $sStmt->execute([
                        ':uid' => $uid,
                        ':matric' => $data->matric_no,
                        ':lvl' => $data->level ?? '100',
                        ':prog' => $data->programme ?? 'BSc'
                    ]);

                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Student added successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
                }
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) { // id is user_id
                $stmt = $conn->prepare("DELETE FROM users WHERE id = :id AND role = 'Student'");
                $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Student deleted.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete.']);
                }
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
