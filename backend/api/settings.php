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
            $stmt = $conn->query("SELECT setting_key, setting_value FROM settings");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format as a simple key-value object
            $settings = [];
            foreach($rows as $row) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
            
            echo json_encode(['success' => true, 'data' => $settings]);
            break;

        case 'POST':
        case 'PUT':
            // Bulk update settings
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data)) {
                $conn->beginTransaction();
                try {
                    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) ON DUPLICATE KEY UPDATE setting_value = :val2");
                    foreach($data as $key => $val) {
                        $stmt->execute([':key' => $key, ':val' => (string)$val, ':val2' => (string)$val]);
                    }
                    $conn->commit();
                    echo json_encode(['success' => true, 'message' => 'Settings updated successfully.']);
                } catch (Exception $ex) {
                    $conn->rollBack();
                    throw $ex;
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'No settings provided.']);
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
