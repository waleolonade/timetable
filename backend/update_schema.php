<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Add invigilator_id if it doesn't exist
    $query = "ALTER TABLE timetables ADD COLUMN invigilator_id INT DEFAULT NULL";
    $db->exec($query);
    echo "Column invigilator_id added successfully.\n";
} catch(PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column invigilator_id already exists.\n";
    } else {
        echo "Error adding column: " . $e->getMessage() . "\n";
    }
}

try {
    // Add foreign key
    $queryFK = "ALTER TABLE timetables ADD CONSTRAINT fk_timetable_invigilator FOREIGN KEY (invigilator_id) REFERENCES invigilators(id) ON DELETE SET NULL";
    $db->exec($queryFK);
    echo "Foreign key constraint added successfully.\n";
} catch(PDOException $e) {
    echo "Notice on FK: " . $e->getMessage() . " (It might already exist or invigilators table is missing).\n";
}
?>
