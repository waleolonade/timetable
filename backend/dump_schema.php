<?php
require_once 'config/database.php';
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query('SHOW TABLES');
while($row = $stmt->fetch(PDO::FETCH_NUM)){
    $res = $conn->query('SHOW CREATE TABLE `'.$row[0].'`')->fetch(PDO::FETCH_NUM);
    echo $res[1].";\n\n";
}
?>
