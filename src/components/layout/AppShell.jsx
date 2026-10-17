import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, DoorOpen, BookOpen, GraduationCap, CalendarCog, UserRound, LogOut, CalendarDays, Contact,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import college from '../../config/college';
import Crest from './Crest';

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/timetable', label: 'Timetable Generator', icon: CalendarCog },
    { to: '/admin/teachers', label: 'Faculty', icon: Users },
    { to: '/admin/classrooms', label: 'Classrooms & Labs', icon: DoorOpen },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/sections', label: 'Divisions', icon: GraduationCap },
    { to: '/admin/students', label: 'Students', icon: Contact },
  ],
  professor: [
    { to: '/professor', label: 'My Timetable', icon: CalendarDays, end: true },
    { to: '/professor/profile', label: 'Profile & Availability', icon: UserRound },
  ],
  student: [
    { to: '/student', label: 'Class Timetable', icon: CalendarDays, end: true },
  ],
};

const ROLE_NAME = { admin: 'Administrator', professor: 'Faculty', student: 'Student' };

const initials = (name = '') =>
  name.replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-brand">
          <Crest size={34} />
          <div>
            <span className="college-name">{college.name}</span>
            <span className="college-sub">ClassOptima timetable portal</span>
          </div>
        </div>
        <div className="topbar-user">
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <div className="topbar-user-text">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{ROLE_NAME[user.role]}</span>
          </div>
          <button type="button" className="btn btn-ghost-light" onClick={signOut}>
            <LogOut size={16} /> <span>Sign out</span>
          </button>
        </div>
      </header>

      <div className="shell-body">
        <nav className="sidebar" aria-label="Main">
          {NAV[user.role].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="sidebar-foot">
            {college.shortName} &copy; {new Date().getFullYear()}
          </div>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
