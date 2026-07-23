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
} from 'lucide-react';

const navGroups = [
  {
    title: 'Dashboard',
    items: [
      {
        to: '/admin/overview',
        icon: LayoutDashboard,
        label: 'Overview',
      },
    ],
  },
  {
    title: 'Institution',
    items: [
      {
        to: '/admin/institution',
        icon: Building2,
        label: 'Institution Setup',
      },
      {
        to: '/admin/faculties',
        icon: GraduationCap,
        label: 'Manage Faculties',
      },
      {
        to: '/admin/departments',
        icon: Folders,
        label: 'Manage Departments',
      },
    ],
  },
  {
    title: 'Academics & People',
    items: [
      {
        to: '/admin/users',
        icon: Users,
        label: 'Manage Users',
      },
      {
        to: '/admin/courses',
        icon: BookOpen,
        label: 'Manage Courses',
      },
      {
        to: '/admin/general-courses',
        icon: Globe,
        label: 'General Courses',
      },
      {
        to: '/admin/classrooms',
        icon: DoorOpen,
        label: 'Classrooms & Venues',
      },
    ],
  },
  {
    title: 'Schedules',
    items: [
      {
        to: '/admin/timetables',
        icon: CalendarDays,
        label: 'Timetable Generator',
      },
    ],
  },
];

const AdminSidebar = () => {
  return (
    <div className="sidebar fcc-theme">
      {/* Logo Area */}
      <div className="sidebar-logo-area">
        <div className="logo-placeholder lg">FCC</div>
        <h3 className="sidebar-title">Admin Portal</h3>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {navGroups.map((group, groupIndex) => (
          <React.Fragment key={group.title}>
            <div className="nav-group-title">
              {group.title}
            </div>

            <div className="nav-group-items">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                >
                  <item.icon className="nav-icon" size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;