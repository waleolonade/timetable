import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api';

const AddExamForm = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    course_id: '',
    room_id: '',
    exam_date: '',
    start_time: '',
    end_time: '',
    exam_type: 'Final',
    max_students: ''
  });
  
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoursesAndRooms();
  }, []);

  const fetchCoursesAndRooms = async () => {
    try {
      const [coursesRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/courses.php`),
        axios.get(`${API_URL}/rooms.php`)
      ]);
      setCourses(coursesRes.data);
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.course_id || !formData.exam_date || !formData.start_time || !formData.end_time) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      alert('End time must be after start time');
      return;
    }

    onAdd(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Exam</h2>
        
        <form onSubmit={handleSubmit} className="exam-form">
          <div className="form-group">
            <label>Course *</label>
            <select 
              name="course_id" 
              value={formData.course_id} 
              onChange={handleChange}
              required
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Room</label>
            <select 
              name="room_id" 
              value={formData.room_id} 
              onChange={handleChange}
            >
              <option value="">Select Room (Optional)</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.room_number} - {room.building} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Exam Date *</label>
            <input
              type="date"
              name="exam_date"
              value={formData.exam_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time *</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Exam Type</label>
            <select 
              name="exam_type" 
              value={formData.exam_type} 
              onChange={handleChange}
            >
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
              <option value="Quiz">Quiz</option>
              <option value="Practical">Practical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Maximum Students</label>
            <input
              type="number"
              name="max_students"
              value={formData.max_students}
              onChange={handleChange}
              placeholder="Optional"
              min="1"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExamForm;
