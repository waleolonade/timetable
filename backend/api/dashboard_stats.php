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

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Base stats initialized to 0
    $stats = [
        'faculties' => 0,
        'departments' => 0,
        'schools' => 0,
        'courses' => 0,
        'classrooms' => 0,
        'students' => 0,
        'lecturers' => 0,
        'hods' => 0,
        'exam_officers' => 0,
        'venues' => 0,
        'published_timetables' => 0,
        'draft_timetables' => 0,
        'upcoming_exams' => 0,
        'today_exams' => 0,
        'conflict_alerts' => 0,
        'active_session' => '2026/2027',
        'semester' => 'First',
        'system_status' => 'Online',
        'chart_data' => []
    ];

    // Attempt queries (using try-catch for each to handle missing tables gracefully)
    try { $stats['courses'] = (int) $conn->query("SELECT COUNT(*) FROM courses")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['venues'] = (int) $conn->query("SELECT COUNT(*) FROM rooms")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['classrooms'] = $stats['venues']; } catch(Exception $e) {}
    try { $stats['lecturers'] = (int) $conn->query("SELECT COUNT(*) FROM invigilators")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['upcoming_exams'] = (int) $conn->query("SELECT COUNT(*) FROM exams WHERE exam_date >= CURDATE()")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['today_exams'] = (int) $conn->query("SELECT COUNT(*) FROM exams WHERE exam_date = CURDATE()")->fetchColumn(); } catch(Exception $e) {}
    
    // Enterprise tables (Faculties/Departments/Users by role)
    try { $stats['faculties'] = (int) $conn->query("SELECT COUNT(*) FROM faculties")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['schools'] = (int) $conn->query("SELECT COUNT(*) FROM faculties")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['departments'] = (int) $conn->query("SELECT COUNT(*) FROM departments")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['students'] = (int) $conn->query("SELECT COUNT(*) FROM users WHERE role='student'")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['hods'] = (int) $conn->query("SELECT COUNT(*) FROM users WHERE role='hod'")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['exam_officers'] = (int) $conn->query("SELECT COUNT(*) FROM users WHERE role='exam_officer'")->fetchColumn(); } catch(Exception $e) {}
    try { $stats['conflict_alerts'] = (int) $conn->query("SELECT COUNT(*) FROM conflicts WHERE resolved = 0")->fetchColumn(); } catch(Exception $e) {}
    
    // Chart Data (Group exams by department)
    try {
        $stmt = $conn->query("
            SELECT c.department as name, COUNT(e.id) as exams 
            FROM exams e 
            JOIN courses c ON e.course_id = c.id 
            GROUP BY c.department
        ");
        $chartData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert string counts to int for recharts
        foreach($chartData as &$row) {
            $row['exams'] = (int) $row['exams'];
        }

        if (count($chartData) > 0) {
            $stats['chart_data'] = $chartData;
        } else {
            $stats['chart_data'] = [
                ['name' => 'Computer Science', 'exams' => 0],
                ['name' => 'Business Admin', 'exams' => 0],
                ['name' => 'Accounting', 'exams' => 0]
            ];
        }
    } catch(Exception $e) {
        $stats['chart_data'] = [
            ['name' => 'Computer Science', 'exams' => 0]
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
