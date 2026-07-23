import React, { useState } from 'react';

const Header = ({ user, onLogout }) => {
  const [session, setSession] = useState('2026/2027 Academic Session');
  const [semester, setSemester] = useState('First Semester');
  const [isEditingSession, setIsEditingSession] = useState(false);
  return (
    <header className="top-header">
      <div className="header-left">
        <div className="institution-branding">
          {/* Placeholder for Logo */}
          <div className="logo-placeholder">FCC</div>
          <div className="branding-text">
            <h2>FEDERAL CO-OPERATIVE COLLEGE</h2>
            <p>Examination Timetable Management System</p>
          </div>
        </div>
        <div className="academic-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditingSession ? (
            <div style={{ display: 'flex', gap: '5px', background: '#f8f9fa', padding: '5px', borderRadius: '5px', alignItems: 'center' }}>
              <input 
                type="text" 
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                className="form-control" 
                style={{ width: '200px', fontSize: '0.85rem', padding: '4px 8px' }} 
              />
              <select 
                value={semester} 
                onChange={(e) => setSemester(e.target.value)} 
                className="form-control" 
                style={{ width: '140px', fontSize: '0.85rem', padding: '4px 8px' }}
              >
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
                <option value="Summer Semester">Summer Semester</option>
              </select>
              <button 
                onClick={() => setIsEditingSession(false)} 
                style={{ background: '#0A5C36', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <span className="badge">{session}</span>
              <span className="badge">{semester}</span>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setIsEditingSession(true)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}
                  title="Edit Active Session"
                >
                  ✏️
                </button>
              )}
            </>
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
