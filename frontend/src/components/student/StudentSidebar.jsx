import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, BookOpen, LogOut } from 'lucide-react';
import { SettingsContext } from '../../context/SettingsContext';
import logoUrl from '../../assets/logo.png';

const StudentSidebar = ({ setAuth }) => {
  const { settings } = useContext(SettingsContext);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
  };

  return (
    <div className="sidebar" style={{ background: '#0288d1' }}>
      <div className="sidebar-logo-area">
        <img src={settings?.institution_logo || logoUrl} alt="Logo" className="sidebar-logo" />
        <h3 className="sidebar-title">Student Portal</h3>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-title">Dashboard</div>
        <div className="nav-group-items">
          <NavLink to="/student/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard className="nav-icon" size={20} />
            My Dashboard
          </NavLink>
        </div>

        <div className="nav-group-title">Academics</div>
        <div className="nav-group-items">
          <NavLink to="/student/courses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BookOpen className="nav-icon" size={20} />
            My Courses
          </NavLink>
          <NavLink to="/student/timetable" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <CalendarDays className="nav-icon" size={20} />
            My Timetable
          </NavLink>
        </div>
        
        <div className="nav-group-title">Account</div>
        <div className="nav-group-items">
          <button onClick={handleLogout} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
            <LogOut className="nav-icon" size={20} />
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
};

export default StudentSidebar;
