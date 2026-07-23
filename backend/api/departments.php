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
            // Fetch all departments with faculty name and total courses count
            $query = "
                SELECT d.id, d.name, d.faculty_id, d.is_active, d.created_at, 
                       f.name as faculty_name,
                       COUNT(c.id) as total_courses
                FROM departments d
                LEFT JOIN faculties f ON d.faculty_id = f.id
                LEFT JOIN courses c ON d.name = c.department
                GROUP BY d.id, d.name, d.faculty_id, d.is_active, d.created_at, f.name
                ORDER BY d.created_at DESC
            ";
            $stmt = $conn->query($query);
            $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $departments]);
            break;

        case 'POST':
            // Create new department
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->name) && !empty($data->faculty_id)) {
                $stmt = $conn->prepare("INSERT INTO departments (faculty_id, name, is_active) VALUES (:faculty_id, :name, 1)");
                $stmt->bindParam(':faculty_id', $data->faculty_id);
                $stmt->bindParam(':name', $data->name);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Department created successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create department.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Department name and Faculty ID are required.']);
            }
            break;

        case 'PUT':
            // Update department
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                if (isset($data->name) && isset($data->faculty_id)) {
                    // Update name and faculty_id
                    $stmt = $conn->prepare("UPDATE departments SET name = :name, faculty_id = :faculty_id WHERE id = :id");
                    $stmt->bindParam(':name', $data->name);
                    $stmt->bindParam(':faculty_id', $data->faculty_id);
                    $stmt->bindParam(':id', $data->id);
                } elseif (isset($data->is_active)) {
                    // Update status
                    $stmt = $conn->prepare("UPDATE departments SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
                    $stmt->bindParam(':id', $data->id);
                }
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Department updated successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update department.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Department ID is required.']);
            }
            break;

        case 'DELETE':
            // Delete department
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM departments WHERE id = :id");
                $stmt->bindParam(':id', $data->id);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Department deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete department.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Department ID is required.']);
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
