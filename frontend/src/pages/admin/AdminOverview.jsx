import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    faculties: '...', departments: '...', schools: '...', courses: '...', 
    classrooms: '...', students: '...', lecturers: '...', hods: '...', 
    exam_officers: '...', venues: '...', published_timetables: '...', 
    draft_timetables: '...', upcoming_exams: '...', today_exams: '...', 
    conflict_alerts: '...', active_session: '...', semester: '...', 
    system_status: '...', chart_data: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard_stats.php');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, []);
  return (
    <div className="admin-overview">
      <div className="content-header">
        <h1>Super Admin Dashboard</h1>
        <p>Comprehensive overview of institutional examination metrics.</p>
      </div>

      <div className="overview-sections">
        {/* Section 1: Academic Infrastructure */}
        <div className="overview-section">
          <h3 className="section-title">Academic Infrastructure</h3>
          <div className="summary-cards">
            <div className="card stat-card"><div className="stat-icon">🏛️</div><div className="stat-info"><h3>Total Faculties</h3><p className="stat-value">{stats.faculties}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">🏫</div><div className="stat-info"><h3>Total Schools</h3><p className="stat-value">{stats.schools}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">📁</div><div className="stat-info"><h3>Departments</h3><p className="stat-value">{stats.departments}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">🚪</div><div className="stat-info"><h3>Classrooms</h3><p className="stat-value">{stats.classrooms}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">📍</div><div className="stat-info"><h3>Exam Venues</h3><p className="stat-value">{stats.venues}</p></div></div>
          </div>
        </div>

        {/* Section 2: User Demographics */}
        <div className="overview-section">
          <h3 className="section-title">User Demographics</h3>
          <div className="summary-cards">
            <div className="card stat-card"><div className="stat-icon">🎓</div><div className="stat-info"><h3>Total Students</h3><p className="stat-value">{stats.students}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">👨‍🏫</div><div className="stat-info"><h3>Lecturers</h3><p className="stat-value">{stats.lecturers}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">👔</div><div className="stat-info"><h3>Total HODs</h3><p className="stat-value">{stats.hods}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">🛡️</div><div className="stat-info"><h3>Exam Officers</h3><p className="stat-value">{stats.exam_officers}</p></div></div>
          </div>
        </div>

        {/* Section 3: Academics & Timetables */}
        <div className="overview-section">
          <h3 className="section-title">Academics & Timetables</h3>
          <div className="summary-cards">
            <div className="card stat-card"><div className="stat-icon">📚</div><div className="stat-info"><h3>Total Courses</h3><p className="stat-value">{stats.courses}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">✅</div><div className="stat-info"><h3>Published Timetables</h3><p className="stat-value">{stats.published_timetables}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">📝</div><div className="stat-info"><h3>Draft Timetables</h3><p className="stat-value">{stats.draft_timetables}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">📅</div><div className="stat-info"><h3>Upcoming Exams</h3><p className="stat-value">{stats.upcoming_exams}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">🔥</div><div className="stat-info"><h3>Today's Exams</h3><p className="stat-value">{stats.today_exams}</p></div></div>
            <div className="card stat-card alert-card"><div className="stat-icon">⚠️</div><div className="stat-info"><h3>Conflict Alerts</h3><p className="stat-value text-danger">{stats.conflict_alerts}</p></div></div>
          </div>
        </div>

        {/* Section 4: System Status */}
        <div className="overview-section">
          <h3 className="section-title">System Status</h3>
          <div className="summary-cards">
            <div className="card stat-card"><div className="stat-icon">⏱️</div><div className="stat-info"><h3>Active Session</h3><p className="stat-value text-md">{stats.active_session}</p></div></div>
            <div className="card stat-card"><div className="stat-icon">⏳</div><div className="stat-info"><h3>Semester</h3><p className="stat-value text-md">{stats.semester}</p></div></div>
            <div className="card stat-card success-card"><div className="stat-icon">🟢</div><div className="stat-info"><h3>System Status</h3><p className="stat-value text-success text-md">{stats.system_status}</p></div></div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card dashboard-card">
          <div className="card-header">
            <h2>Department-wise Examinations</h2>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="exams" fill="var(--primary-color)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card dashboard-card">
          <div className="card-header">
            <h2>Hall Utilization</h2>
          </div>
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            <p>Pie Chart Data Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
