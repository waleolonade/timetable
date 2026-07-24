<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

echo "Starting Database Schema Update V2...<br>";

try {
    // 1. Add lecturer_id to courses table
    echo "Checking courses table for lecturer_id...<br>";
    $stmt = $conn->query("SHOW COLUMNS FROM courses LIKE 'lecturer_id'");
    if ($stmt->rowCount() === 0) {
        $conn->exec("ALTER TABLE courses ADD COLUMN lecturer_id INT NULL");
        $conn->exec("ALTER TABLE courses ADD CONSTRAINT fk_courses_lecturer FOREIGN KEY (lecturer_id) REFERENCES invigilators(id) ON DELETE SET NULL");
        echo "Added lecturer_id column to courses.<br>";
    } else {
        echo "lecturer_id column already exists in courses.<br>";
    }

    // 2. Create activity_logs table
    echo "Checking for activity_logs table...<br>";
    $conn->exec("CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )");
    echo "activity_logs table checked/created.<br>";

    // 3. Create login_history table
    echo "Checking for login_history table...<br>";
    $conn->exec("CREATE TABLE IF NOT EXISTS login_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        status VARCHAR(20),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "login_history table checked/created.<br>";

    echo "<br><b>Schema Update V2 Complete!</b>";

} catch (PDOException $e) {
    echo "<br><b style='color:red;'>Error updating schema: " . $e->getMessage() . "</b>";
}
?>
