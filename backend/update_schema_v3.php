<?php
require_once 'config/database.php';

$db = new Database();
$conn = $db->getConnection();

echo "Starting Database Schema Update V3...<br>";

try {
    // 1. Alter timetables table
    echo "Checking timetables table for publish_status...<br>";
    $stmt = $conn->query("SHOW COLUMNS FROM timetables LIKE 'publish_status'");
    if ($stmt->rowCount() === 0) {
        $conn->exec("ALTER TABLE timetables ADD COLUMN publish_status VARCHAR(20) DEFAULT 'Draft'");
        $conn->exec("ALTER TABLE timetables ADD COLUMN published_at TIMESTAMP NULL");
        echo "Added publish_status and published_at to timetables.<br>";
    } else {
        echo "publish_status column already exists in timetables.<br>";
    }

    // 2. Create timetable_versions table
    echo "Checking for timetable_versions table...<br>";
    $conn->exec("CREATE TABLE IF NOT EXISTS timetable_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version_name VARCHAR(100),
        timetable_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )");
    echo "timetable_versions table checked/created.<br>";

    // 3. Create students table
    echo "Checking for students table...<br>";
    $conn->exec("CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        matric_no VARCHAR(50) UNIQUE,
        level VARCHAR(20),
        programme VARCHAR(100),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "students table checked/created.<br>";

    // 4. Create student_courses table
    echo "Checking for student_courses table...<br>";
    $conn->exec("CREATE TABLE IF NOT EXISTS student_courses (
        student_id INT,
        course_id INT,
        PRIMARY KEY (student_id, course_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )");
    echo "student_courses table checked/created.<br>";

    echo "<br><b>Schema Update V3 Complete!</b>";

} catch (PDOException $e) {
    echo "<br><b style='color:red;'>Error updating schema: " . $e->getMessage() . "</b>";
}
?>
