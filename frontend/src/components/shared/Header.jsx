import React, { useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';
import { Link } from 'react-router-dom';
import logoUrl from '../../assets/logo.png';

const Header = ({ user, onLogout }) => {
  const { settings } = useContext(SettingsContext);
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="institution-branding">
          <img src={settings.institution_logo || logoUrl} alt="Logo" className="sidebar-logo" style={{ width: '40px', height: '40px' }} />
          <div className="branding-text">
            <h2>{settings.institution_name?.toUpperCase() || 'FEDERAL CO-OPERATIVE COLLEGE'}</h2>
            <p>Examination Timetable Management System</p>
          </div>
        </div>
        <div className="academic-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge">{settings.current_session || '2026/2027 Academic Session'}</span>
          <span className="badge">{settings.current_semester || 'First Semester'}</span>
          {user?.role === 'admin' && (
            <Link to="/admin/institution" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6, textDecoration: 'none' }} title="Edit Global Settings">
              ⚙️
            </Link>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button className="icon-btn" title="Notifications">🔔</button>
          <button className="icon-btn" title="Messages">✉️</button>
          <button className="icon-btn" title="Settings">⚙️</button>
        </div>
        
        <div className="user-profile">
          <div className="user-avatar-small">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <span className="username">{user?.username || 'User'}</span>
            <span className="role">{user?.role || 'Admin'}</span>
          </div>
        </div>
        
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
