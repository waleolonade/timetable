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
            // Fetch users with their department name if any
            $query = "
                SELECT u.id, u.username, u.full_name, u.role, u.is_active, u.created_at, u.department_id, d.name as department_name 
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.id
                ORDER BY u.created_at DESC
            ";
            $stmt = $conn->query($query);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $users]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->username) && !empty($data->password)) {
                // Check if username exists
                $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
                $check->execute([$data->username]);
                if ($check->rowCount() > 0) {
                    echo json_encode(['success' => false, 'message' => 'Username already exists.']);
                    exit;
                }

                $stmt = $conn->prepare("
                    INSERT INTO users (username, full_name, password, role, department_id, is_active) 
                    VALUES (:username, :full_name, :password, :role, :department_id, 1)
                ");
                
                $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
                $role = $data->role ?? 'hod';
                $deptId = (!empty($data->department_id)) ? $data->department_id : null;
                
                $stmt->bindParam(':username', $data->username);
                $stmt->bindParam(':full_name', $data->full_name);
                $stmt->bindParam(':password', $hashedPassword);
                $stmt->bindParam(':role', $role);
                $stmt->bindParam(':department_id', $deptId);

                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'User created successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to create user.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                if (isset($data->action) && $data->action === 'reset_password') {
                    // Password Reset
                    if (!empty($data->password)) {
                        $stmt = $conn->prepare("UPDATE users SET password = :password WHERE id = :id");
                        $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
                        $stmt->bindParam(':password', $hashedPassword);
                        $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                        
                        if ($stmt->execute()) {
                            echo json_encode(['success' => true, 'message' => 'Password reset successfully.']);
                        } else {
                            echo json_encode(['success' => false, 'message' => 'Failed to reset password.']);
                        }
                    } else {
                        echo json_encode(['success' => false, 'message' => 'New password is required.']);
                    }
                } elseif (isset($data->is_active)) {
                    // Toggle Status
                    $stmt = $conn->prepare("UPDATE users SET is_active = :is_active WHERE id = :id");
                    $isActive = $data->is_active ? 1 : 0;
                    $stmt->bindParam(':is_active', $isActive, PDO::PARAM_INT);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'User status updated.']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
                    }
                } else {
                    // Full Update (e.g. transfer HOD, update name)
                    $stmt = $conn->prepare("UPDATE users SET full_name = :full_name, role = :role, department_id = :department_id WHERE id = :id");
                    $deptId = (!empty($data->department_id)) ? $data->department_id : null;
                    $stmt->bindParam(':full_name', $data->full_name);
                    $stmt->bindParam(':role', $data->role);
                    $stmt->bindParam(':department_id', $deptId);
                    $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                    
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'User details updated successfully.']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to update user.']);
                    }
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'User ID is required.']);
            }
            break;

        case 'DELETE':
            // Generally we shouldn't delete users, just disable them, but we provide this for cleanup.
            $data = json_decode(file_get_contents("php://input"));
            if (!empty($data->id)) {
                $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
                $stmt->bindParam(':id', $data->id, PDO::PARAM_INT);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'User deleted successfully.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'User ID is required.']);
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
