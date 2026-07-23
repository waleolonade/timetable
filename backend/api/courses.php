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
            // Fetch all courses, joining with departments to get department name
            $query = "
                SELECT c.id, c.course_code, c.course_name, c.department_id, c.semester, c.level, c.credit_unit, c.is_active, c.created_at,
                       d.name as department_name
                FROM courses c
                LEFT JOIN departments d ON c.department_id = d.id
                ORDER BY c.created_at DESC
            ";
            $stmt = $conn->query($query);
            $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $courses]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->course_code) && !empty($data->course_name) && !empty($data->department_id)) {
                $stmt = $conn->prepare("INSERT INTO courses (course_code, course_name, department_id, semester, level, credit_unit, is_active) VALUES (:course_code, :course_name, :department_id, :semester, :level, :credit_unit, 1)");
                $stmt->bindParam(':course_code', $data->course_code);
                $stmt->bindParam(':course_name', $data->course_name);
                $stmt->bindParam(':department_id', $data->department_id);
                $stmt->bindParam(':semester', $data->semester);
                $stmt->bindParam(':level', $data->level);
                $stmt->bindParam(':credit_unit', $data->credit_unit);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Course created successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create course.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Course Code, Name, and Department are required.']);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                if (isset($data->course_name)) {
                    // Full update
                    $stmt = $conn->prepare("UPDATE courses SET course_code = :course_code, course_name = :course_name, department_id = :department_id, semester = :semester, level = :level, credit_unit = :credit_unit WHERE id = :id");
                    $stmt->bindParam(':course_code', $data->course_code);
                    $stmt->bindParam(':course_name', $data->course_name);
                    $stmt->bindParam(':department_id', $data->department_id);
                    $stmt->bindParam(':semester', $data->semester);
                    $stmt->bindParam(':level', $data->level);
                    $stmt->bindParam(':credit_unit', $data->credit_unit);
                    $stmt->bindParam(':id', $data->id);
                } elseif (isset($data->is_active)) {
                    // Update status only
                    $stmt = $conn->prepare("UPDATE courses SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
                    $stmt->bindParam(':id', $data->id);
                }
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Course updated successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update course.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Course ID is required.']);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM courses WHERE id = :id");
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
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
