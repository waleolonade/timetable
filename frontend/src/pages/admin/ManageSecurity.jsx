import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SettingsContext } from '../../context/SettingsContext';
import { Shield, Lock, Download, Trash2, HardDrive, RefreshCw } from 'lucide-react';

const ManageSecurity = () => {
  const { settings, fetchSettings } = useContext(SettingsContext);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(true);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
    fetchBackups();
  }, [settings]);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await axios.get('/api/backups.php');
      if (res.data.success) {
        setBackups(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    try {
      const res = await axios.put('/api/settings.php', formData);
      if (res.data.success) {
        setMessage('Security settings updated successfully!');
        fetchSettings();
      } else {
        setMessage(res.data.message || 'Error updating settings.');
      }
    } catch (error) {
      setMessage('Failed to save settings.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCreateBackup = async () => {
    if (window.confirm('Create a new database backup?')) {
      try {
        const res = await axios.post('/api/backups.php?action=create');
        if (res.data.success) {
          alert('Backup created successfully!');
          fetchBackups();
        } else {
          alert('Failed to create backup: ' + res.data.message);
        }
      } catch (err) {
        alert('Error creating backup.');
      }
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (window.confirm(`WARNING: This will overwrite the current database with the backup '${filename}'. Do you want to proceed?`)) {
      try {
        const res = await axios.post('/api/backups.php?action=restore', { filename });
        if (res.data.success) {
          alert('Database restored successfully!');
        } else {
          alert('Restore failed: ' + res.data.message);
        }
      } catch (err) {
        alert('Error restoring database.');
      }
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (window.confirm(`Delete backup '${filename}'?`)) {
      try {
        const res = await axios.post('/api/backups.php?action=delete', { filename });
        if (res.data.success) {
          fetchBackups();
        } else {
          alert('Failed to delete: ' + res.data.message);
        }
      } catch (err) {
        alert('Error deleting backup.');
      }
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="fade-in">
      <div className="content-header" style={{ marginBottom: '30px' }}>
        <h1>Security & Backups</h1>
        <p>Manage system security policies, authentication, and database backups.</p>
      </div>

      {message && (
        <div className="alert-card" style={{ padding: '15px', background: '#e8f5e9', color: '#28a745', borderLeft: '4px solid #28a745', borderRadius: '8px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Security Settings */}
        <div className="card dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} color="var(--primary-color)" />
            <h2>Security Policies</h2>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Password Policy</label>
                <select name="password_policy" value={formData.password_policy || 'Medium'} onChange={handleChange} className="form-control">
                  <option value="Low">Low (Min 6 chars)</option>
                  <option value="Medium">Medium (Min 8 chars, Letters + Numbers)</option>
                  <option value="High">High (Min 8 chars, Mixed Case, Numbers, Symbols)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Session Timeout (Minutes)</label>
                <input 
                  type="number" 
                  name="session_timeout" 
                  value={formData.session_timeout || '30'} 
                  onChange={handleChange} 
                  className="form-control" 
                />
              </div>

              <div className="form-group">
                <label>Max Failed Login Attempts</label>
                <input 
                  type="number" 
                  name="max_login_attempts" 
                  value={formData.max_login_attempts || '5'} 
                  onChange={handleChange} 
                  className="form-control" 
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="enable_mfa" 
                    checked={formData.enable_mfa === 'true' || formData.enable_mfa === true} 
                    onChange={handleChange} 
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>Require Multi-Factor Authentication (MFA)</span>
                </label>
              </div>
            </div>
            
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Database Backups */}
        <div className="card dashboard-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={20} color="var(--primary-color)" />
              <h2>Database Backups</h2>
            </div>
            <button className="btn btn-primary" onClick={handleCreateBackup} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Create Backup
            </button>
          </div>
          
          {loadingBackups ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#666' }}>Loading backups...</div>
          ) : backups.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#666', background: '#f8f9fa', borderRadius: '8px' }}>
              No backups found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Size</th>
                    <th>Date Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b, i) => (
                    <tr key={i}>
                      <td><strong style={{ color: '#0f172a' }}>{b.filename}</strong></td>
                      <td>{formatBytes(b.size)}</td>
                      <td>{b.created_at}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleRestoreBackup(b.filename)}
                          style={{ padding: '5px 10px', fontSize: '0.85rem', marginRight: '10px' }}
                          title="Restore"
                        >
                          <RefreshCw size={14} /> Restore
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDeleteBackup(b.filename)}
                          style={{ padding: '5px 10px', fontSize: '0.85rem', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManageSecurity;
