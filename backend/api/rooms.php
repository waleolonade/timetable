<?php
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM rooms ORDER BY room_number";
$stmt = $db->prepare($query);
$stmt->execute();
$rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rooms);
?>
