import React, { useContext } from 'react';
import { SettingsContext } from '../../context/SettingsContext';

const HodFooter = () => {
  const { settings } = useContext(SettingsContext);
  return (
    <footer style={{
      background: 'white',
      borderTop: '1px solid #e2e8f0',
      padding: '20px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: '#64748b',
      fontSize: '0.85rem',
      marginTop: 'auto'
    }}>
      <div>
        &copy; {new Date().getFullYear()} {settings?.institution_name || 'Exam Timetable System'}. All rights reserved.
      </div>
      <div style={{display: 'flex', gap: '15px'}}>
        <a href="#" style={{color: '#64748b', textDecoration: 'none', transition: 'color 0.2s'}} onMouseOver={e => e.target.style.color = '#3b82f6'} onMouseOut={e => e.target.style.color = '#64748b'}>Support</a>
        <a href="#" style={{color: '#64748b', textDecoration: 'none', transition: 'color 0.2s'}} onMouseOver={e => e.target.style.color = '#3b82f6'} onMouseOut={e => e.target.style.color = '#64748b'}>Documentation</a>
        <a href="#" style={{color: '#64748b', textDecoration: 'none', transition: 'color 0.2s'}} onMouseOver={e => e.target.style.color = '#3b82f6'} onMouseOut={e => e.target.style.color = '#64748b'}>Privacy Policy</a>
      </div>
    </footer>
  );
};

export default HodFooter;
