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
            $stmt = $conn->query("SELECT * FROM classrooms ORDER BY name ASC");
            $classrooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $classrooms]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->name) && !empty($data->capacity)) {
                $stmt = $conn->prepare("INSERT INTO classrooms (name, capacity, venue_type, is_active) VALUES (:name, :capacity, :venue_type, 1)");
                $stmt->bindParam(':name', $data->name);
                $stmt->bindParam(':capacity', $data->capacity, PDO::PARAM_INT);
                $stmt->bindParam(':venue_type', $data->venue_type);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Classroom created successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create classroom.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Name and capacity are required.']);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                if (isset($data->name)) {
                    // Full update
                    $stmt = $conn->prepare("UPDATE classrooms SET name = :name, capacity = :capacity, venue_type = :venue_type WHERE id = :id");
                    $stmt->bindParam(':name', $data->name);
                    $stmt->bindParam(':capacity', $data->capacity, PDO::PARAM_INT);
                    $stmt->bindParam(':venue_type', $data->venue_type);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                } elseif (isset($data->is_active)) {
                    // Update status only
                    $stmt = $conn->prepare("UPDATE classrooms SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                }
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Classroom updated successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update classroom.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Classroom ID is required.']);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM classrooms WHERE id = :id");
                $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Classroom deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete classroom.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Classroom ID is required.']);
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
