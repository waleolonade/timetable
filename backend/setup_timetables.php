<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Create timetables table
    $query = "CREATE TABLE IF NOT EXISTS timetables (
        id INT PRIMARY KEY AUTO_INCREMENT,
        course_id INT NOT NULL,
        classroom_id INT NOT NULL,
        day_of_week VARCHAR(20) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        semester VARCHAR(50),
        session VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    $db->exec($query);
    echo "Timetables table created successfully.\n";
    
} catch(PDOException $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}
?>
