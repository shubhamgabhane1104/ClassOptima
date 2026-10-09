import React from 'react';

export default function Navbar({ user, onLogout, onSwitchRole }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo-badge">CO</div>
        <h2 className="brand-title">Class<span>Optima</span></h2>
      </div>

      {/* Role Navigation Switcher */}
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

      <div className="nav-user">
        <span>User: <strong>{user.name}</strong></span>
        <button className="btn-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
