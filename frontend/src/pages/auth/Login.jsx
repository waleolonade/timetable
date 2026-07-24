import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { SettingsContext } from '../../context/SettingsContext';

const API_URL = '/api';

const Login = ({ setAuth }) => {
  const { settings } = useContext(SettingsContext);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth.php`, {
        action: 'login',
        username: credentials.username,
        password: credentials.password
      });

      if (response.data.success) {
        // Save token and user details
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Update auth state in App.jsx
        setAuth(true);
        if (response.data.user.role === 'hod') {
          navigate('/hod/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        setError(response.data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred connecting to the server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          {settings.institution_logo ? (
            <img src={settings.institution_logo} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', marginBottom: '15px' }} />
          ) : (
            <div className="school-badge">
              {settings.institution_name?.toUpperCase() || 'FEDERAL CO-OPERATIVE COLLEGE'}
            </div>
          )}
          <h2>{settings.institution_name || 'Federal Co-operative College'}</h2>
          <p>{settings.institution_motto || 'Examination Timetable Management System'}</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="e.g. admin"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Default credentials: <b>admin</b> / <b>password123</b></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
