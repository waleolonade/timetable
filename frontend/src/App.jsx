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
import ManageTimetables from './pages/admin/ManageTimetables';
import ManageUsers from './pages/admin/ManageUsers';
import SystemLogs from './pages/admin/SystemLogs';
import ManageSecurity from './pages/admin/ManageSecurity';
import HodDashboard from './pages/hod/HodDashboard';
import HodManageCourses from './pages/hod/HodManageCourses';
import HodManageClassrooms from './pages/hod/HodManageClassrooms';
import HodTimetables from './pages/hod/HodTimetables';
import HodManageLecturers from './pages/hod/HodManageLecturers';
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
            <Navigate to="/" replace /> : 
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
          <Route path="users" element={<ManageUsers />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="general-courses" element={<ManageGeneralCourses />} />
          <Route path="classrooms" element={<ManageClassrooms />} />
          <Route path="timetables" element={<ManageTimetables />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="security" element={<ManageSecurity />} />
          
          {/* Catch-all for /admin */}
          <Route path="dashboard" element={<Navigate to="/admin/overview" replace />} />
        </Route>

        <Route 
          path="/hod" 
          element={
            <ProtectedRoute isAuth={isAuthenticated}>
              <HodDashboard setAuth={setIsAuthenticated} />
            </ProtectedRoute>
          } 
        >
          {/* Default redirect for HOD */}
          <Route index element={<Navigate to="/hod/dashboard" replace />} />
          <Route path="dashboard" element={<HodDashboard setAuth={setIsAuthenticated} />} />
          <Route path="courses" element={<HodManageCourses />} />
          <Route path="classrooms" element={<HodManageClassrooms />} />
          <Route path="lecturers" element={<HodManageLecturers />} />
          <Route path="timetables" element={<HodTimetables />} />
        </Route>
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute isAuth={isAuthenticated}>
              {/* Note: In a real app we would check role here. For now we route to admin if authenticated, but if HOD tries to access Admin they will get blocked by API. Actually, let's just let them go to admin dashboard and the sidebar will adjust, or we explicitly redirect based on localStorage role. */}
              {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role === 'hod' ? 
                <Navigate to="/hod/dashboard" replace /> : 
                <Navigate to="/admin/dashboard" replace />
              }
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
