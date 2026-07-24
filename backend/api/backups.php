<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

// A simple backup directory
$backupDir = __DIR__ . '/../../backups/';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

try {
    if ($method === 'GET') {
        // List backups
        $files = glob($backupDir . '*.sql');
        $backups = [];
        foreach ($files as $file) {
            $backups[] = [
                'filename' => basename($file),
                'size' => filesize($file),
                'created_at' => date("Y-m-d H:i:s", filemtime($file))
            ];
        }
        
        // Sort descending by date
        usort($backups, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        echo json_encode(['success' => true, 'data' => $backups]);
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"));
        $action = $_GET['action'] ?? '';

        if ($action === 'create') {
            // Note: A robust system would use mysqldump. 
            // For cross-platform compatibility without exec() requirements, we'll generate a basic dump.
            
            $filename = 'backup_' . date('Y_m_d_H_i_s') . '.sql';
            $filepath = $backupDir . $filename;
            
            // Get all tables
            $tables = [];
            $stmt = $conn->query("SHOW TABLES");
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }
            
            $sqlScript = "-- Database Backup\n-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
            
            foreach ($tables as $table) {
                // Table structure
                $stmt = $conn->query("SHOW CREATE TABLE `$table`");
                $row = $stmt->fetch(PDO::FETCH_NUM);
                $sqlScript .= "\nDROP TABLE IF EXISTS `$table`;\n";
                $sqlScript .= $row[1] . ";\n\n";
                
                // Table data
                $stmt = $conn->query("SELECT * FROM `$table`");
                $rowCount = $stmt->rowCount();
                if ($rowCount > 0) {
                    $sqlScript .= "INSERT INTO `$table` VALUES ";
                    $rowsData = [];
                    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                        $values = [];
                        foreach ($row as $val) {
                            if ($val === null) {
                                $values[] = "NULL";
                            } else {
                                $values[] = $conn->quote($val);
                            }
                        }
                        $rowsData[] = "(" . implode(", ", $values) . ")";
                    }
                    $sqlScript .= implode(",\n", $rowsData) . ";\n\n";
                }
            }
            
            file_put_contents($filepath, $sqlScript);
            
            echo json_encode(['success' => true, 'message' => 'Backup created successfully', 'filename' => $filename]);
            
        } elseif ($action === 'restore') {
            $filename = $data->filename ?? '';
            $filepath = $backupDir . basename($filename);
            
            if (file_exists($filepath)) {
                $sql = file_get_contents($filepath);
                
                // Disable foreign key checks before restoring
                $conn->exec("SET FOREIGN_KEY_CHECKS=0");
                
                try {
                    $conn->exec($sql);
                    $conn->exec("SET FOREIGN_KEY_CHECKS=1");
                    echo json_encode(['success' => true, 'message' => 'Database restored successfully']);
                } catch (Exception $e) {
                    $conn->exec("SET FOREIGN_KEY_CHECKS=1");
                    throw $e;
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Backup file not found']);
            }
        } elseif ($action === 'delete') {
            $filename = $data->filename ?? '';
            $filepath = $backupDir . basename($filename);
            
            if (file_exists($filepath)) {
                unlink($filepath);
                echo json_encode(['success' => true, 'message' => 'Backup deleted']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Backup file not found']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
