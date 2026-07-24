import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Folders,
  Users,
  BookOpen,
  Globe,
  DoorOpen,
  CalendarDays,
  Shield,
  Activity
} from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import { SettingsContext } from '../../context/SettingsContext';
import { useContext } from 'react';

const AdminSidebar = () => {
  const { settings } = useContext(SettingsContext);
  return (
    <div className="sidebar fcc-theme">
      {/* Logo Area */}
      <div className="sidebar-logo-area">
        <img src={settings?.institution_logo || logoUrl} alt="Institution Logo" className="sidebar-logo" />
        <h3 className="sidebar-title">Admin Portal</h3>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">Dashboard</div>
        <div className="nav-group-items">
          <NavLink to="/admin/overview" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard className="nav-icon" size={20} />
            Overview
          </NavLink>
        </div>

        <div className="nav-group-title">Schedules</div>
        <div className="nav-group-items">
          <NavLink to="/admin/timetables" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <CalendarDays className="nav-icon" size={20} />
            Timetable Generator
          </NavLink>
        </div>

        <div className="nav-group-title">Institution</div>
        <div className="nav-group-items">
          <NavLink to="/admin/institution" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Building2 className="nav-icon" size={20} />
            Institution Setup
          </NavLink>
          <NavLink to="/admin/faculties" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <GraduationCap className="nav-icon" size={20} />
            Manage Faculties
          </NavLink>
          <NavLink to="/admin/departments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Folders className="nav-icon" size={20} />
            Manage Departments
          </NavLink>
        </div>

        <div className="nav-group-title">Academics & People</div>
        <div className="nav-group-items">
          <NavLink to="/admin/users" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users className="nav-icon" size={20} />
            Manage Users
          </NavLink>
          <NavLink to="/admin/students" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <GraduationCap className="nav-icon" size={20} />
            Manage Students
          </NavLink>
          <NavLink to="/admin/courses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BookOpen className="nav-icon" size={20} />
            Manage Courses
          </NavLink>
          <NavLink to="/admin/general-courses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Globe className="nav-icon" size={20} />
            General Courses
          </NavLink>
          <NavLink to="/admin/classrooms" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <DoorOpen className="nav-icon" size={20} />
            Classrooms & Venues
          </NavLink>
        </div>
        <div className="nav-group-title">System & Security</div>
        <div className="nav-group-items">
          <NavLink to="/admin/logs" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Activity className="nav-icon" size={20} />
            System Logs
          </NavLink>
          <NavLink to="/admin/security" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Shield className="nav-icon" size={20} />
            Security & Backups
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;