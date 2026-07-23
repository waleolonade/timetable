CREATE DATABASE IF NOT EXISTS exam_timetable;
USE exam_timetable;

CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    semester INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    building VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    room_id INT,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    exam_type ENUM('Midterm', 'Final', 'Quiz', 'Practical') DEFAULT 'Final',
    max_students INT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE invigilators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department VARCHAR(50)
);

CREATE TABLE exam_invigilators (
    exam_id INT,
    invigilator_id INT,
    PRIMARY KEY (exam_id, invigilator_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (invigilator_id) REFERENCES invigilators(id) ON DELETE CASCADE
);

-- Sample Data
INSERT INTO courses (course_code, course_name, department, semester) VALUES
('CS101', 'Introduction to Programming', 'Computer Science', 1),
('CS201', 'Data Structures', 'Computer Science', 2),
('MATH101', 'Calculus I', 'Mathematics', 1),
('PHY101', 'Physics I', 'Physics', 1);

INSERT INTO rooms (room_number, capacity, building) VALUES
('A101', 50, 'Building A'),
('A102', 40, 'Building A'),
('B201', 60, 'Building B'),
('B202', 45, 'Building B');

INSERT INTO invigilators (name, email, department) VALUES
('Dr. Smith', 'smith@university.edu', 'Computer Science'),
('Prof. Johnson', 'johnson@university.edu', 'Mathematics'),
('Dr. Williams', 'williams@university.edu', 'Physics');

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin user (password is 'password123')
INSERT IGNORE INTO users (username, password, role) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
