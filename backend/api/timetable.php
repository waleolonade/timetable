<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$week = $_GET['week'] ?? null;
$department = $_GET['department'] ?? null;

$query = "SELECT e.*, c.course_name, c.course_code, c.department, 
          r.room_number, r.building
          FROM exams e
          JOIN courses c ON e.course_id = c.id
          LEFT JOIN rooms r ON e.room_id = r.id
          WHERE 1=1";

$params = [];

if($week) {
    $query .= " AND WEEK(e.exam_date) = ?";
    $params[] = $week;
}

if($department) {
    $query .= " AND c.department = ?";
    $params[] = $department;
}

$query .= " ORDER BY e.exam_date, e.start_time";

$stmt = $db->prepare($query);
$stmt->execute($params);
$timetable = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($timetable);
?>
