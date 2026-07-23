<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if(isset($_GET['id'])) {
            getExam($db, $_GET['id']);
        } else {
            getExams($db);
        }
        break;
    case 'POST':
        createExam($db);
        break;
    case 'PUT':
        updateExam($db);
        break;
    case 'DELETE':
        deleteExam($db);
        break;
}

function getExams($db) {
    $query = "SELECT e.*, c.course_name, c.course_code, r.room_number 
              FROM exams e
              LEFT JOIN courses c ON e.course_id = c.id
              LEFT JOIN rooms r ON e.room_id = r.id
              ORDER BY e.exam_date, e.start_time";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $exams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($exams);
}

function getExam($db, $id) {
    $query = "SELECT e.*, c.course_name, c.course_code, r.room_number 
              FROM exams e
              LEFT JOIN courses c ON e.course_id = c.id
              LEFT JOIN rooms r ON e.room_id = r.id
              WHERE e.id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$id]);
    $exam = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode($exam);
}

function createExam($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $query = "INSERT INTO exams (course_id, room_id, exam_date, start_time, end_time, exam_type, max_students)
              VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([
            $data['course_id'],
            $data['room_id'],
            $data['exam_date'],
            $data['start_time'],
            $data['end_time'],
            $data['exam_type'],
            $data['max_students'] ?? null
        ]);
        echo json_encode(['success' => true, 'id' => $db->lastInsertId()]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function updateExam($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $query = "UPDATE exams SET 
              course_id = ?, room_id = ?, exam_date = ?, 
              start_time = ?, end_time = ?, exam_type = ?, max_students = ?
              WHERE id = ?";
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([
            $data['course_id'],
            $data['room_id'],
            $data['exam_date'],
            $data['start_time'],
            $data['end_time'],
            $data['exam_type'],
            $data['max_students'] ?? null,
            $data['id']
        ]);
        echo json_encode(['success' => true]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function deleteExam($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    
    if(!$id) {
        echo json_encode(['success' => false, 'error' => 'ID required']);
        return;
    }
    
    $query = "DELETE FROM exams WHERE id = ?";
    $stmt = $db->prepare($query);
    
    try {
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>
