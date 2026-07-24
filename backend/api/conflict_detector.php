<?php

class ConflictDetector {
    private $conn;

    public function __construct($dbConnection) {
        $this->conn = $dbConnection;
    }

    public function validateSlot($course_id, $classroom_id, $day_of_week, $start_time, $end_time, $semester, $session, $exclude_timetable_id = null) {
        $conflicts = [];

        // 1. Fetch Course and Classroom info
        $stmtC = $this->conn->prepare("SELECT department_id, level, student_population, lecturer_id FROM courses WHERE id = ?");
        $stmtC->execute([$course_id]);
        $course = $stmtC->fetch(PDO::FETCH_ASSOC);

        if (!$course) {
            $conflicts[] = "Course does not exist.";
            return $conflicts;
        }

        $stmtR = $this->conn->prepare("SELECT capacity, name FROM classrooms WHERE id = ?");
        $stmtR->execute([$classroom_id]);
        $room = $stmtR->fetch(PDO::FETCH_ASSOC);

        if (!$room) {
            $conflicts[] = "Classroom does not exist.";
            return $conflicts;
        }

        // 2. Check Capacity Overflow
        $reqCapacity = (int)($course['student_population']);
        $roomCapacity = (int)($room['capacity']);
        if ($reqCapacity > 0 && $reqCapacity > $roomCapacity) {
            $conflicts[] = "Capacity Overflow: Room {$room['name']} capacity is {$roomCapacity}, but course has {$reqCapacity} students.";
        }

        // 3. Duplicate Course Check
        $queryDup = "SELECT id FROM timetables WHERE course_id = ? AND semester = ? AND session = ?";
        $paramsDup = [$course_id, $semester, $session];
        if ($exclude_timetable_id) {
            $queryDup .= " AND id != ?";
            $paramsDup[] = $exclude_timetable_id;
        }
        $stmtDup = $this->conn->prepare($queryDup);
        $stmtDup->execute($paramsDup);
        if ($stmtDup->rowCount() > 0) {
            $conflicts[] = "Duplicate Course: This course is already scheduled for the current semester and session.";
        }

        // Prepare overlap query
        $queryOverlap = "
            SELECT t.id, t.classroom_id, t.invigilator_id, c.department_id, c.level 
            FROM timetables t
            JOIN courses c ON t.course_id = c.id
            WHERE t.day_of_week = ? 
              AND t.semester = ? 
              AND t.session = ?
              AND t.start_time < ? 
              AND t.end_time > ?
        ";
        $paramsOverlap = [$day_of_week, $semester, $session, $end_time, $start_time];
        if ($exclude_timetable_id) {
            $queryOverlap .= " AND t.id != ?";
            $paramsOverlap[] = $exclude_timetable_id;
        }

        $stmtOverlap = $this->conn->prepare($queryOverlap);
        $stmtOverlap->execute($paramsOverlap);
        $overlappingSlots = $stmtOverlap->fetchAll(PDO::FETCH_ASSOC);

        foreach ($overlappingSlots as $slot) {
            // 4. Venue Clash
            if ($slot['classroom_id'] == $classroom_id) {
                $conflicts[] = "Venue Clash: Room is already booked for this time.";
            }

            // 5. Student Clash (Same department and level)
            if ($slot['department_id'] == $course['department_id'] && $slot['level'] == $course['level']) {
                $conflicts[] = "Student Clash: Students in Level {$course['level']} of this department already have an exam scheduled at this time.";
            }

            // 6. Lecturer/Invigilator Clash
            if ($course['lecturer_id'] && $slot['invigilator_id'] == $course['lecturer_id']) {
                $conflicts[] = "Lecturer Clash: The course lecturer is already assigned to invigilate another exam at this time.";
            }
        }

        return $conflicts;
    }
}
?>
