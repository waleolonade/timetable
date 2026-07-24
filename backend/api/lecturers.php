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
$data = json_decode(file_get_contents("php://input"));

try {
    if ($method === 'GET') {
        $query = "SELECT i.*, d.name as department_name,
                  (SELECT COUNT(*) FROM courses c WHERE c.lecturer_id = i.id) as total_courses,
                  (SELECT COUNT(*) FROM exam_invigilators ei WHERE ei.invigilator_id = i.id) as total_invigilations
                  FROM invigilators i 
                  LEFT JOIN departments d ON i.department_id = d.id 
                  WHERE 1=1";
        
        if (isset($_GET['department_id'])) {
            $dept_id = (int)$_GET['department_id'];
            $query .= " AND i.department_id = " . $dept_id;
        }

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $lecturers = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $lecturers]);

    } elseif ($method === 'POST') {
        if (!isset($data->name) || !isset($data->department_id)) {
            echo json_encode(['success' => false, 'message' => 'Name and department_id required']);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO invigilators (name, email, department, department_id) VALUES (:name, :email, :dept, :dept_id)");
        
        $dept_name = '';
        $s = $conn->prepare("SELECT name FROM departments WHERE id = :id");
        $s->execute([':id' => $data->department_id]);
        if($d = $s->fetch()) $dept_name = $d['name'];

        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':dept', $dept_name);
        $stmt->bindParam(':dept_id', $data->department_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Lecturer added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add lecturer']);
        }

    } elseif ($method === 'PUT') {
        if (!isset($data->id) || !isset($data->name)) {
            echo json_encode(['success' => false, 'message' => 'ID and Name required']);
            exit;
        }
        $stmt = $conn->prepare("UPDATE invigilators SET name = :name, email = :email WHERE id = :id");
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Lecturer updated']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update']);
        }

    } elseif ($method === 'DELETE') {
        if (!isset($data->id)) {
            echo json_encode(['success' => false, 'message' => 'ID required']);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM invigilators WHERE id = :id");
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            // Unassign from courses
            $conn->query("UPDATE courses SET lecturer_id = NULL WHERE lecturer_id = " . (int)$data->id);
            echo json_encode(['success' => true, 'message' => 'Lecturer deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
