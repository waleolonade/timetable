import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, LogIn, Clock, User, Shield } from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity'); // activity or login

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/logs.php?type=${activeTab}`);
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fade-in">
      <div className="content-header" style={{ marginBottom: '30px' }}>
        <h1>Audit & Activity Logs</h1>
        <p>Monitor system usage, logins, and administrative actions.</p>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <button 
          className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('activity')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Activity size={18} /> Activity Logs
        </button>
        <button 
          className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('login')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <LogIn size={18} /> Login History
        </button>
      </div>

      <div className="card dashboard-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No logs found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  {activeTab === 'activity' ? (
                    <>
                      <th>Time</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </>
                  ) : (
                    <>
                      <th>Login Time</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>IP Address</th>
                      <th>Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    {activeTab === 'activity' ? (
                      <>
                        <td style={{ whiteSpace: 'nowrap' }}><Clock size={14} style={{marginRight:'5px', color:'#888'}}/> {formatDate(log.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <User size={14} color="#555"/>
                            <strong>{log.username || 'System'}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>({log.role})</span>
                          </div>
                        </td>
                        <td><span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>{log.action}</span></td>
                        <td>{log.details}</td>
                        <td>{log.ip_address}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ whiteSpace: 'nowrap' }}><Clock size={14} style={{marginRight:'5px', color:'#888'}}/> {formatDate(log.login_time)}</td>
                        <td><strong>{log.username || 'Unknown'}</strong></td>
                        <td><Shield size={14} style={{marginRight:'5px', color:'#888'}}/> {log.role}</td>
                        <td>{log.ip_address}</td>
                        <td>
                          <span style={{
                            background: log.status === 'Success' ? '#dcfce7' : '#fee2e2',
                            color: log.status === 'Success' ? '#166534' : '#991b1b',
                            padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600
                          }}>
                            {log.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
