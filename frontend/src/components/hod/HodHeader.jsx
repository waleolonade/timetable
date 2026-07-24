import React from 'react';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HodHeader = ({ user, handleLogout }) => {
  return (
    <header className="hod-header" style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 30px', 
      background: 'white', 
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <div className="header-left" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
        <h2 style={{margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: '700'}}>
          Welcome back, {user?.full_name || user?.username}!
        </h2>
        <span style={{
          background: '#ecfdf5', 
          color: '#059669', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '0.8rem', 
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block'}}></span>
          HOD Portal
        </span>
      </div>

      <div className="header-right" style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', position: 'relative'
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', 
            fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold'
          }}>3</span>
        </button>

        <div style={{height: '30px', width: '1px', background: '#e2e8f0'}}></div>

        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{
            width: '36px', height: '36px', background: '#f1f5f9', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
          }}>
            <User size={18} />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <span style={{fontSize: '0.9rem', fontWeight: '600', color: '#334155'}}>{user?.full_name || user?.username}</span>
            <span style={{fontSize: '0.75rem', color: '#94a3b8'}}>Department Head</span>
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          style={{
            background: 'white', border: '1px solid #cbd5e1', padding: '8px 15px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#475569',
            display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </header>
  );
};

export default HodHeader;
