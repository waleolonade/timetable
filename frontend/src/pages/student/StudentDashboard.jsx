import React, { useState, useEffect, useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import TopHeader from '../../components/common/TopHeader';
import axios from 'axios';
import { CalendarDays, BookOpen, Clock } from 'lucide-react';

const StudentDashboard = ({ setAuth }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);
  const { settings } = useContext(SettingsContext);
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        // Student view - theoretically, we should get their specific level. We assume the backend or localstorage has level, or we query all for their dept if level is unknown.
        // For now, we query by department_id and status=Published.
        const res = await axios.get(`/api/timetables.php?department_id=${user?.department_id}&semester=${settings?.current_semester}&session=${settings?.current_session}&status=Published`);
        if (res.data.success) {
          setTimetables(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.department_id) {
        fetchTimetable();
    } else {
        setLoading(false);
    }
  }, [user, settings]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let val = parseInt(h);
    let ampm = val >= 12 ? 'PM' : 'AM';
    val = val % 12 || 12;
    return `${val}:${m} ${ampm}`;
  };

  const getUpcomingClass = () => {
    // Basic logic to find next class for demo purposes
    if (timetables.length === 0) return null;
    return timetables[0]; 
  };

  const upcoming = getUpcomingClass();

  return (
    <div className="app-container">
      <StudentSidebar setAuth={setAuth} />
      
      <div className="main-content">
        <TopHeader user={user} title="Student Dashboard" />
        
        <div className="dashboard-content">
          <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)', color: 'white', padding: '30px', borderRadius: '12px', marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 10px 0' }}>Welcome, {user?.first_name} {user?.last_name}!</h2>
            <p style={{ margin: 0, opacity: 0.9 }}>Here is your schedule for {settings?.current_semester}, {settings?.current_session}.</p>
          </div>

          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="stat-card card">
              <div className="stat-icon" style={{ background: 'rgba(2, 136, 209, 0.1)', color: '#0288d1' }}>
                <BookOpen size={24} />
              </div>
              <div className="stat-details">
                <h3>{timetables.length}</h3>
                <p>Scheduled Classes</p>
              </div>
            </div>
            
            <div className="stat-card card" style={{ flex: 2 }}>
              <div className="stat-icon" style={{ background: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' }}>
                <Clock size={24} />
              </div>
              <div className="stat-details">
                <h3>Next Class</h3>
                <p>
                  {upcoming ? `${upcoming.course_code} - ${upcoming.day_of_week} at ${formatTime(upcoming.start_time)} in ${upcoming.room_name}` : 'No upcoming classes'}
                </p>
              </div>
            </div>
          </div>

          <div className="card dashboard-card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>My Timetable</h3>
            </div>
            
            <div className="card-body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>Loading timetable...</div>
              ) : timetables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <CalendarDays size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                  <p>No published timetable found for your department.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Course</th>
                        <th>Venue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetables.map(slot => (
                        <tr key={slot.id}>
                          <td><strong>{slot.day_of_week}</strong></td>
                          <td>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</td>
                          <td>{slot.course_code} - {slot.course_name}</td>
                          <td>{slot.room_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
