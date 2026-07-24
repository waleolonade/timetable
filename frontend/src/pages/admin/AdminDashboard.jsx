import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/AdminSidebar';
import Header from '../../components/shared/Header';
import Footer from '../../components/shared/Footer';

const API_URL = '/api';

const AdminDashboard = ({ setAuth }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Initial load check
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(false);
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar 
        user={user} 
        onLogout={handleLogout} 
      />

      <div className="main-content">
        <Header user={user} onLogout={handleLogout} />

        <div className="dashboard-body">
          <Outlet />
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default AdminDashboard;
