import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  DoorOpen,
  Calendar,
  Users
} from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import { SettingsContext } from '../../context/SettingsContext';
import { useContext } from 'react';

const HodSidebar = () => {
  const { settings } = useContext(SettingsContext);
  return (
    <div className="sidebar" style={{ background: 'var(--dept-sidebar, #0f172a)' }}>
      {/* Logo Area */}
      <div className="sidebar-logo-area">
        <img src={settings?.institution_logo || logoUrl} alt="Institution Logo" className="sidebar-logo" />
        <h3 className="sidebar-title">HOD Portal</h3>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">Dashboard</div>
        <div className="nav-group-items">
          <NavLink to="/hod/dashboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <LayoutDashboard className="nav-icon" size={20} />
            My Department
          </NavLink>
        </div>

        <div className="nav-group-title">Academics & Resources</div>
        <div className="nav-group-items">
          <NavLink to="/hod/courses" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <BookOpen className="nav-icon" size={20} />
            Manage Courses
          </NavLink>
          <NavLink to="/hod/classrooms" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <DoorOpen className="nav-icon" size={20} />
            Department Halls
          </NavLink>
          <NavLink to="/hod/lecturers" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <Users className="nav-icon" size={20} />
            Lecturers
          </NavLink>
        </div>

        <div className="nav-group-title">Schedules</div>
        <div className="nav-group-items">
          <NavLink to="/hod/timetables" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
            <CalendarDays className="nav-icon" size={20} />
            View Timetables
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default HodSidebar;
