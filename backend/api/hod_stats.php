<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    if ($method === 'GET') {
        if (!isset($_GET['department_id'])) {
            echo json_encode(['success' => false, 'message' => 'department_id is required']);
            exit;
        }

        $dept_id = (int)$_GET['department_id'];
        
        // 1. Get total courses and total student population
        $stmt_courses = $conn->prepare("SELECT COUNT(*) as total_courses, SUM(student_population) as total_students FROM courses WHERE department_id = :dept_id AND is_active = 1");
        $stmt_courses->bindParam(':dept_id', $dept_id, PDO::PARAM_INT);
        $stmt_courses->execute();
        $course_stats = $stmt_courses->fetch(PDO::FETCH_ASSOC);
        
        // 2. Get total classrooms dedicated to this department
        $stmt_rooms = $conn->prepare("SELECT COUNT(*) as total_classrooms FROM classrooms WHERE department_id = :dept_id AND is_active = 1");
        $stmt_rooms->bindParam(':dept_id', $dept_id, PDO::PARAM_INT);
        $stmt_rooms->execute();
        $room_stats = $stmt_rooms->fetch(PDO::FETCH_ASSOC);

        // 3. Get department info (for theme/logo)
        $stmt_dept = $conn->prepare("SELECT name, theme_color, logo_url FROM departments WHERE id = :dept_id");
        $stmt_dept->bindParam(':dept_id', $dept_id, PDO::PARAM_INT);
        $stmt_dept->execute();
        $dept_info = $stmt_dept->fetch(PDO::FETCH_ASSOC);

        // 4. (Mock) active timetables for now
        $total_timetables = 0; // We will link this to the timetables table later

        echo json_encode([
            'success' => true, 
            'data' => [
                'total_courses' => (int)$course_stats['total_courses'],
                'total_students' => (int)$course_stats['total_students'] ?? 0,
                'total_classrooms' => (int)$room_stats['total_classrooms'],
                'total_timetables' => $total_timetables,
                'department' => $dept_info
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
