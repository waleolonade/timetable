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
            $dept_id = isset($_GET['department_id']) ? $_GET['department_id'] : null;
            $global = isset($_GET['global']) ? $_GET['global'] : null;
            
            $query = "SELECT * FROM classrooms";
            if ($dept_id) {
                $query .= " WHERE department_id = :dept_id";
            } elseif ($global) {
                $query .= " WHERE department_id IS NULL";
            } else {
                $query .= " WHERE 1=1"; // fetch all
            }
            $query .= " ORDER BY created_at DESC";
            
            $stmt = $conn->prepare($query);
            if ($dept_id) {
                $stmt->bindParam(':dept_id', $dept_id, PDO::PARAM_INT);
            }
            $stmt->execute();
            $classrooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $classrooms]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->name) && !empty($data->capacity)) {
                $stmt = $conn->prepare("INSERT INTO classrooms (name, hall_code, capacity, venue_type, building, floor, has_ac, has_projector, is_cbt, is_accessible, department_id, is_active) 
                                        VALUES (:name, :hall_code, :capacity, :venue_type, :building, :floor, :has_ac, :has_projector, :is_cbt, :is_accessible, :department_id, 1)");
                
                $has_ac = isset($data->has_ac) && $data->has_ac ? 1 : 0;
                $has_projector = isset($data->has_projector) && $data->has_projector ? 1 : 0;
                $is_cbt = isset($data->is_cbt) && $data->is_cbt ? 1 : 0;
                $is_accessible = isset($data->is_accessible) && $data->is_accessible ? 1 : 0;
                $department_id = !empty($data->department_id) ? $data->department_id : null;
                
                $stmt->bindParam(':name', $data->name);
                $stmt->bindParam(':hall_code', $data->hall_code);
                $stmt->bindParam(':capacity', $data->capacity, PDO::PARAM_INT);
                $stmt->bindParam(':venue_type', $data->venue_type);
                $stmt->bindParam(':building', $data->building);
                $stmt->bindParam(':floor', $data->floor);
                $stmt->bindParam(':has_ac', $has_ac, PDO::PARAM_INT);
                $stmt->bindParam(':has_projector', $has_projector, PDO::PARAM_INT);
                $stmt->bindParam(':is_cbt', $is_cbt, PDO::PARAM_INT);
                $stmt->bindParam(':is_accessible', $is_accessible, PDO::PARAM_INT);
                $stmt->bindParam(':department_id', $department_id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Classroom/Venue created successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create venue.']);
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
                    $stmt = $conn->prepare("UPDATE classrooms SET name = :name, hall_code = :hall_code, capacity = :capacity, venue_type = :venue_type, building = :building, floor = :floor, has_ac = :has_ac, has_projector = :has_projector, is_cbt = :is_cbt, is_accessible = :is_accessible, department_id = :department_id WHERE id = :id");
                    
                    $has_ac = isset($data->has_ac) && $data->has_ac ? 1 : 0;
                    $has_projector = isset($data->has_projector) && $data->has_projector ? 1 : 0;
                    $is_cbt = isset($data->is_cbt) && $data->is_cbt ? 1 : 0;
                    $is_accessible = isset($data->is_accessible) && $data->is_accessible ? 1 : 0;
                    $department_id = !empty($data->department_id) ? $data->department_id : null;
                    
                    $stmt->bindParam(':name', $data->name);
                    $stmt->bindParam(':hall_code', $data->hall_code);
                    $stmt->bindParam(':capacity', $data->capacity, PDO::PARAM_INT);
                    $stmt->bindParam(':venue_type', $data->venue_type);
                    $stmt->bindParam(':building', $data->building);
                    $stmt->bindParam(':floor', $data->floor);
                    $stmt->bindParam(':has_ac', $has_ac, PDO::PARAM_INT);
                    $stmt->bindParam(':has_projector', $has_projector, PDO::PARAM_INT);
                    $stmt->bindParam(':is_cbt', $is_cbt, PDO::PARAM_INT);
                    $stmt->bindParam(':is_accessible', $is_accessible, PDO::PARAM_INT);
                    $stmt->bindParam(':department_id', $department_id);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                } elseif (isset($data->is_active)) {
                    // Update status only
                    $stmt = $conn->prepare("UPDATE classrooms SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                }
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Classroom/Venue updated successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to update venue.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Venue ID is required.']);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM classrooms WHERE id = :id");
                $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Venue deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete venue.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Venue ID is required.']);
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
