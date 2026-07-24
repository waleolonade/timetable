<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Simple routing based on method/action
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? 'login';
    
    if ($action === 'login') {
        login($db, $data);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

function login($db, $data) {
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'error' => 'Username and password are required']);
        return;
    }
    
    $query = "SELECT id, username, password, role, is_active, department_id FROM users WHERE username = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$username]);
    
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        if (password_verify($password, $row['password'])) {
            if ($row['is_active'] == 0) {
                echo json_encode(['success' => false, 'error' => 'Account is locked or disabled. Please contact the administrator.']);
                return;
            }

            // Success - Generate a simple pseudo-token for this demo
            $token = bin2hex(random_bytes(16));
            
            echo json_encode([
                'success' => true, 
                'token' => $token,
                'user' => [
                    'id' => $row['id'],
                    'username' => $row['username'],
                    'role' => $row['role'],
                    'department_id' => $row['department_id']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
}
?>
