import React from 'react';
import "./styles/navbar.css";

export default function Navbar({ user, onLogout, onSwitchRole }) {
  // Generates avatar initials (e.g. "Dr. Amit Sharma" -> "AS", "Admin Officer" -> "AO")
  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.replace('Dr.', '').replace('Prof.', '').trim().split(' ');
    return words.map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo-badge">CO</div>
        <h2 className="brand-title">Class<span>Optima</span></h2>
      </div>

      {/* 3-Role Navigation Switcher */}
      <nav className="role-tabs">
        <button
          className={`role-btn ${user.role === 'admin' ? 'active' : ''}`}
          onClick={() => onSwitchRole('admin')}
        >
          👑 Admin
        </button>
        <button
          className={`role-btn ${user.role === 'professor' ? 'active' : ''}`}
          onClick={() => onSwitchRole('professor')}
        >
          👨‍🏫 Professor
        </button>
        <button
          className={`role-btn ${user.role === 'student' ? 'active' : ''}`}
          onClick={() => onSwitchRole('student')}
        >
          🎓 Student
        </button>
      </nav>

      {/* User Info & Actions */}
      <div className="nav-actions">
        <div className="status-pill">
          <span className="status-dot"></span>
          <span>System Live</span>
        </div>

        <div className="user-badge">
          <div className="user-avatar">{getInitials(user.name)}</div>
          <div className="user-details">
            <span className="user-name">{user.name}</span>
            <span className="user-role-label">{user.role}</span>
          </div>
        </div>

        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
