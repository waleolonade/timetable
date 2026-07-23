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
            // Fetch all faculties with total departments count
            $query = "
                SELECT f.id, f.name, f.is_active, f.created_at, COUNT(d.id) as total_departments 
                FROM faculties f
                LEFT JOIN departments d ON f.id = d.faculty_id
                GROUP BY f.id, f.name, f.is_active, f.created_at
                ORDER BY f.created_at DESC
            ";
            $stmt = $conn->query($query);
            $faculties = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $faculties]);
            break;

        case 'POST':
            // Create new faculty
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->name)) {
                $stmt = $conn->prepare("INSERT INTO faculties (name, is_active) VALUES (:name, 1)");
                $stmt->bindParam(':name', $data->name);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Faculty created successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create faculty.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Faculty name is required.']);
            }
            break;

        case 'PUT':
            // Update faculty (rename or change status)
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                if (isset($data->name)) {
                    // Update name
                    $stmt = $conn->prepare("UPDATE faculties SET name = :name WHERE id = :id");
                    $stmt->bindParam(':name', $data->name);
                    $stmt->bindParam(':id', $data->id);
                } elseif (isset($data->is_active)) {
                    // Update status
                    $stmt = $conn->prepare("UPDATE faculties SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
                    $stmt->bindParam(':id', $data->id);
                }
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Faculty updated successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update faculty.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Faculty ID is required.']);
            }
            break;

        case 'DELETE':
            // Delete faculty
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM faculties WHERE id = :id");
                $stmt->bindParam(':id', $data->id);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Faculty deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete faculty.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Faculty ID is required.']);
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
