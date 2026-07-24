import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import HodSidebar from '../../components/hod/HodSidebar';
import HodHeader from '../../components/hod/HodHeader';
import HodFooter from '../../components/hod/HodFooter';
import { SettingsContext } from '../../context/SettingsContext';
import { useContext } from 'react';

const HodDashboard = ({ setAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const { settings } = useContext(SettingsContext);
  
  useEffect(() => {
    // Validate role
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'hod') {
        navigate('/admin');
      } else {
        setUser(parsed);
      }
    } else {
      setAuth(false);
      navigate('/login');
    }
  }, [navigate, setAuth]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
    navigate('/login');
  };

  useEffect(() => {
    if (user) {
      axios.get(`/api/hod_stats.php?department_id=${user.department_id}`)
        .then(res => {
          if (res.data.success) {
            setStats(res.data.data);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  if (!user) return null; // loading state

  // If we are exactly on /hod/dashboard, show the dashboard summary.
  // Otherwise, we could render <Outlet /> if we set up nested routes, but for now we'll just show the summary here.
  const isIndex = location.pathname === '/hod/dashboard' || location.pathname === '/hod';

  // Parse theme configuration
  let deptTheme = { primary: '#3b82f6', sidebar: '#0f172a', accent: '#f59e0b' };
  if (stats?.department?.theme_color) {
    if (stats.department.theme_color.startsWith('{')) {
      try { deptTheme = JSON.parse(stats.department.theme_color); } catch(e){}
    } else {
      deptTheme.primary = stats.department.theme_color;
    }
  }

  return (
    <div className="dashboard-layout" style={{
      '--dept-primary': deptTheme.primary,
      '--dept-sidebar': deptTheme.sidebar,
      '--dept-accent': deptTheme.accent
    }}>
      <HodSidebar />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0, background: '#f8fafc' }}>
        <HodHeader user={user} handleLogout={handleLogout} />
        
        <div className="dashboard-body" style={{ flex: 1, padding: '30px' }}>
          {isIndex ? (
            <div className="hod-overview fade-in" style={{padding: '20px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px'}}>
                <div>
                  <h1 style={{fontSize: '2rem', color: 'var(--dept-primary)', margin: '0 0 8px 0', fontWeight: 800}}>
                    {stats?.department?.name || 'Department'} Dashboard
                  </h1>
                  <p style={{color: '#64748b', margin: 0, fontSize: '1.1rem'}}>Current Session: {settings?.current_session || '2026/2027'} | {settings?.current_semester || '1st Semester'}</p>
                </div>
                {stats?.department?.logo_url && (
                  <img src={stats.department.logo_url} alt="Dept Logo" style={{height: '60px', borderRadius: '8px'}} />
                )}
              </div>
              
              <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="premium-card" style={{background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'}}>📚</div>
                  <div>
                    <p style={{margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase'}}>Total Courses</p>
                    <h3 style={{margin: 0, fontSize: '2rem', color: '#0f172a'}}>{stats ? stats.total_courses : '--'}</h3>
                  </div>
                </div>
                
                <div className="premium-card" style={{background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'}}>👥</div>
                  <div>
                    <p style={{margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase'}}>Total Students</p>
                    <h3 style={{margin: 0, fontSize: '2rem', color: '#0f172a'}}>{stats ? stats.total_students : '--'}</h3>
                  </div>
                </div>

                <div className="premium-card" style={{background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'}}>🚪</div>
                  <div>
                    <p style={{margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase'}}>Classrooms</p>
                    <h3 style={{margin: 0, fontSize: '2rem', color: '#0f172a'}}>{stats ? stats.total_classrooms : '--'}</h3>
                  </div>
                </div>

                <div className="premium-card" style={{background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '12px', background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'}}>📅</div>
                  <div>
                    <p style={{margin: '0 0 5px 0', color: '#64748b', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase'}}>Timetables</p>
                    <h3 style={{margin: 0, fontSize: '2rem', color: '#0f172a'}}>{stats ? stats.total_timetables : '--'}</h3>
                  </div>
                </div>
              </div>

              <div className="premium-card" style={{background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.02)'}}>
                <div style={{width: '80px', height: '80px', background: '#f8fafc', borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'}}>🎓</div>
                <h3 style={{color: '#0f172a', marginBottom: '15px', fontSize: '1.5rem'}}>Welcome to the HOD Workspace</h3>
                <p style={{color: '#64748b', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.6}}>
                  This portal provides exclusive access to manage your department's curriculum, dedicated classrooms, and view generated exam timetables specifically affecting your students and staff.
                </p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
        
        <HodFooter />
      </div>
    </div>
  );
};

export default HodDashboard;
