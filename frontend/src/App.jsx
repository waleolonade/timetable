import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import ManageInstitution from './pages/admin/ManageInstitution';
import ManageFaculties from './pages/admin/ManageFaculties';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageCourses from './pages/admin/ManageCourses';
import ManageGeneralCourses from './pages/admin/ManageGeneralCourses';
import ManageClassrooms from './pages/admin/ManageClassrooms';
import './styles/App.css';

// A protected route component
const ProtectedRoute = ({ isAuth, children }) => {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for authentication token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Initializing...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <Login setAuth={setIsAuthenticated} />
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute isAuth={isAuthenticated}>
              <AdminDashboard setAuth={setIsAuthenticated} />
            </ProtectedRoute>
          } 
        >
          {/* Default redirect to overview */}
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<AdminOverview />} />
          <Route path="institution" element={<ManageInstitution />} />
          <Route path="faculties" element={<ManageFaculties />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="general-courses" element={<ManageGeneralCourses />} />
          <Route path="classrooms" element={<ManageClassrooms />} />
          
          {/* Catch-all for /admin */}
          <Route path="dashboard" element={<Navigate to="/admin/overview" replace />} />
        </Route>
        
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
