import React from 'react';
import { format, parseISO } from 'date-fns';

const ExamTimetable = ({ exams, onDelete, totalExams }) => {
  const getExamTypeColor = (type) => {
    const colors = {
      'Midterm': '#4CAF50',
      'Final': '#f44336',
      'Quiz': '#FF9800',
      'Practical': '#2196F3'
    };
    return colors[type] || '#9E9E9E';
  };

  const groupByDate = () => {
    const groups = {};
    exams.forEach(exam => {
      const date = exam.exam_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(exam);
    });
    return groups;
  };

  const groupedExams = groupByDate();

  if (exams.length === 0) {
    return (
      <div className="empty-state">
        <p>No exams scheduled</p>
        <p className="sub-text">Add an exam to get started</p>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h2>📅 Exam Schedule</h2>
        <span className="exam-count">{totalExams} exams</span>
      </div>

      {Object.entries(groupedExams).map(([date, dayExams]) => (
        <div key={date} className="day-section">
          <div className="day-header">
            <h3>{format(parseISO(date), 'EEEE, MMMM d, yyyy')}</h3>
            <span className="day-count">{dayExams.length} exams</span>
          </div>

          <div className="exam-grid">
            {dayExams.map(exam => (
              <div key={exam.id} className="exam-card">
                <div className="exam-card-header">
                  <div className="exam-course">
                    <span className="course-code">{exam.course_code}</span>
                    <span className="course-name">{exam.course_name}</span>
                  </div>
                  <span 
                    className="exam-type-badge"
                    style={{ backgroundColor: getExamTypeColor(exam.exam_type) }}
                  >
                    {exam.exam_type}
                  </span>
                </div>

                <div className="exam-details">
                  <div className="detail-item">
                    <span className="detail-label">🕐 Time</span>
                    <span className="detail-value">
                      {exam.start_time} - {exam.end_time}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📍 Room</span>
                    <span className="detail-value">
                      {exam.room_number || 'TBD'}
                      {exam.building && ` (${exam.building})`}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">📊 Department</span>
                    <span className="detail-value">{exam.department || 'N/A'}</span>
                  </div>
                  {exam.max_students && (
                    <div className="detail-item">
                      <span className="detail-label">👥 Students</span>
                      <span className="detail-value">{exam.max_students}</span>
                    </div>
                  )}
                </div>

                <button 
                  className="btn-delete"
                  onClick={() => onDelete(exam.id)}
                >
                  × Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ExamTimetable;
