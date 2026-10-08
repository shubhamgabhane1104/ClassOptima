import React, { useState } from 'react';
import './auth.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleQuickDemo = (role) => {
    onLoginSuccess({
      name: role === 'admin' ? 'Admin Officer' : (role === 'professor' ? 'Dr. Amit Sharma' : 'Student (CSE Div A)'),
      role: role
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        <div className="login-header">
          <div className="logo-badge">CO</div>
          <h2 className="brand-title">Class<span>Optima</span></h2>
          <p className="login-subtitle">Academic Allocation System</p>
        </div>

        {/* 1-Click Viva Demo Role Switcher */}
        <div className="demo-box">
          <div className="demo-title">⚡ ONE-CLICK DEMO LOGIN</div>
          <div className="demo-buttons">
            <button type="button" className="btn-demo" onClick={() => handleQuickDemo('admin')}>👑 Admin</button>
            <button type="button" className="btn-demo" onClick={() => handleQuickDemo('professor')}>👨‍🏫 Faculty</button>
            <button type="button" className="btn-demo" onClick={() => handleQuickDemo('student')}>🎓 Student</button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleQuickDemo('admin'); }}>
          <div className="form-group">
            <label>College Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@college.edu"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-submit">
            Sign In to Portal
          </button>
        </form>

      </div>
    </div>
  );
}
