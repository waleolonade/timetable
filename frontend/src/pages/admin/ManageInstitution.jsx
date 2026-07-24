import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SettingsContext } from '../../context/SettingsContext';
import { Save, UploadCloud, PaintBucket, AlertCircle, RefreshCw, Calendar, GitBranch } from 'lucide-react';

const ManageInstitution = () => {
  const { settings, fetchSettings } = useContext(SettingsContext);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const uploadData = new FormData();
      uploadData.append('logo', file);
      
      setIsUploading(true);
      setMessage('');
      try {
        const res = await axios.post('/api/upload_logo.php', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (res.data.success) {
          setFormData({
            ...formData,
            institution_logo: res.data.url
          });
          setMessage('Logo uploaded successfully! Click Save to apply globally.');
        } else {
          setMessage(res.data.message || 'Error uploading logo.');
        }
      } catch (error) {
        setMessage('Failed to upload logo.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    try {
      const res = await axios.put('/api/settings.php', formData);
      if (res.data.success) {
        setMessage('Settings updated successfully!');
        // Refresh global state so the UI updates immediately
        fetchSettings();
      } else {
        setMessage(res.data.message || 'Error updating settings.');
      }
    } catch (error) {
      setMessage('Failed to connect to the server.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="manage-institution">
      <div className="content-header" style={{ marginBottom: '30px' }}>
        <h1>Institution & System Settings</h1>
        <p>Configure global institutional details, branding, and system behavior.</p>
      </div>
      
      {message && (
        <div className="alert-card" style={{ padding: '15px', background: '#e8f5e9', color: '#28a745', borderLeft: '4px solid #28a745', borderRadius: '8px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Branding & Identity Section */}
        <div className="card dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PaintBucket size={20} color="var(--primary-color)" />
            <h2>Branding & Identity</h2>
          </div>
          
          <div className="form-row" style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Institution / Project Name</label>
                <input 
                  type="text" 
                  name="institution_name"
                  value={formData.institution_name || ''} 
                  onChange={handleChange}
                  className="form-control" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Primary Theme Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    name="primary_color"
                    value={formData.primary_color || '#0A5C36'} 
                    onChange={handleChange}
                    style={{ width: '50px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    value={formData.primary_color || '#0A5C36'} 
                    readOnly
                    className="form-control" 
                    style={{ width: '120px' }}
                  />
                  <small style={{ color: '#666' }}>Updates the global UI color</small>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Institution Motto</label>
                <input 
                  type="text" 
                  name="institution_motto"
                  value={formData.institution_motto || ''} 
                  onChange={handleChange}
                  placeholder="e.g. Knowledge is Power"
                  className="form-control" 
                />
              </div>
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Address</label>
                <textarea 
                  name="institution_address"
                  value={formData.institution_address || ''} 
                  onChange={handleChange}
                  className="form-control" 
                  rows="2"
                ></textarea>
              </div>
              <div className="form-group" style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label>Contact Email</label>
                  <input 
                    type="email" 
                    name="contact_email"
                    value={formData.contact_email || ''} 
                    onChange={handleChange}
                    className="form-control" 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Contact Phone</label>
                  <input 
                    type="text" 
                    name="contact_phone"
                    value={formData.contact_phone || ''} 
                    onChange={handleChange}
                    className="form-control" 
                  />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontWeight: 600, color: '#555', fontSize: '0.9rem' }}>Institution Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px dashed #ccc' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  {formData.institution_logo ? (
                    <img src={formData.institution_logo} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: '#aaa', fontSize: '0.8rem', textAlign: 'center' }}>No Logo</div>
                  )}
                </div>
                <div>
                  <label htmlFor="logo-upload" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1 }}>
                    <UploadCloud size={18} />
                    {isUploading ? 'Uploading...' : 'Upload New Logo'}
                  </label>
                  <input 
                    id="logo-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoUpload} 
                    style={{ display: 'none' }} 
                    disabled={isUploading}
                  />
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#888' }}>Recommended: Square PNG/JPG, max 5MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Configuration */}
        <div className="card dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={20} color="var(--primary-color)" />
            <h2>Academic Configuration</h2>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Current Academic Session</label>
            <input 
              type="text" 
              name="current_session"
              value={formData.current_session || ''} 
              onChange={handleChange}
              placeholder="e.g. 2026/2027"
              className="form-control" 
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Session Badge Color</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="color" 
                name="session_badge_color"
                value={formData.session_badge_color || '#e8f5e9'} 
                onChange={handleChange}
                style={{ width: '50px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              />
              <input 
                type="text" 
                value={formData.session_badge_color || '#e8f5e9'} 
                readOnly
                className="form-control" 
                style={{ width: '120px' }}
              />
              <small style={{ color: '#666' }}>Color of the header badges</small>
            </div>
          </div>
          <div className="form-group">
            <label>Current Semester</label>
            <select 
              name="current_semester"
              value={formData.current_semester || ''} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
              <option value="Summer Semester">Summer Semester</option>
            </select>
          </div>
        </div>

        {/* Exam Configuration */}
        <div className="card dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="var(--primary-color)" />
            <h2>Exam Configuration</h2>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Exam Start Date</label>
            <input 
              type="date" 
              name="exam_start_date"
              value={formData.exam_start_date || ''} 
              onChange={handleChange}
              className="form-control" 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Exam End Date</label>
            <input 
              type="date" 
              name="exam_end_date"
              value={formData.exam_end_date || ''} 
              onChange={handleChange}
              className="form-control" 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Daily Exam Sessions</label>
            <input 
              type="number" 
              name="daily_exam_sessions"
              value={formData.daily_exam_sessions || '3'} 
              onChange={handleChange}
              className="form-control" 
              min="1" max="5"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label>Morning Slot</label>
              <input type="time" name="morning_slot_time" value={formData.morning_slot_time || '08:00'} onChange={handleChange} className="form-control" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Afternoon Slot</label>
              <input type="time" name="afternoon_slot_time" value={formData.afternoon_slot_time || '12:00'} onChange={handleChange} className="form-control" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Evening Slot</label>
              <input type="time" name="evening_slot_time" value={formData.evening_slot_time || '15:00'} onChange={handleChange} className="form-control" />
            </div>
          </div>
        </div>

        {/* Algorithm Rules */}
        <div className="card dashboard-card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitBranch size={20} color="var(--primary-color)" />
            <h2>Algorithm Rules</h2>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Max Exams Per Day (Per Student)</label>
            <input 
              type="number" 
              name="max_exams_per_day"
              value={formData.max_exams_per_day || '2'} 
              onChange={handleChange}
              className="form-control" 
              min="1" max="5"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Break Duration Between Exams (Mins)</label>
            <input 
              type="number" 
              name="break_duration"
              value={formData.break_duration || '30'} 
              onChange={handleChange}
              className="form-control" 
              step="15"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Hall Allocation Rule</label>
            <select name="hall_allocation_rule" value={formData.hall_allocation_rule || 'Capacity First'} onChange={handleChange} className="form-control">
              <option value="Capacity First">Capacity First (Largest Classes to Largest Halls)</option>
              <option value="Department First">Department First (Use Department Halls Primarily)</option>
              <option value="Random">Randomized Allocation</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Conflict Detection Level</label>
            <select name="conflict_detection_rule" value={formData.conflict_detection_rule || 'Strict'} onChange={handleChange} className="form-control">
              <option value="Strict">Strict (No overlapping exams for any level)</option>
              <option value="Permissive">Permissive (Allow overlap if different departments)</option>
            </select>
          </div>
        </div>

        {/* System Behavior */}
        <div className="card dashboard-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="var(--primary-color)" />
            <h2>System Behavior</h2>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>System Mode</label>
            <select 
              name="system_mode"
              value={formData.system_mode || 'Active'} 
              onChange={handleChange}
              className="form-control"
            >
              <option value="Active">Active (Normal Operations)</option>
              <option value="Maintenance">Maintenance Mode (Offline for Users)</option>
              <option value="Exams Only">Exams Period (Restricted Access)</option>
            </select>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#888' }}>
              Controls global access to the timetable and student portals.
            </p>
          </div>
        </div>

        {/* Sticky Footer Actions */}
        <div style={{ gridColumn: '1 / -1', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: '20px', zIndex: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '12px 30px' }}>
            <Save size={20} />
            {isSaving ? 'Saving...' : 'Save Global Settings'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ManageInstitution;
