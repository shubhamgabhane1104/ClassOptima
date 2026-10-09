import React, { useState } from 'react';
import './auth.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1-Click Viva Demo Role Switcher
  const handleQuickDemo = (role) => {
    setErrorMessage('');
    onLoginSuccess({
      name: role === 'admin' ? 'Admin Officer' : (role === 'professor' ? 'Dr. Amit Sharma' : 'Student (CSE Div A)'),
      role
    });
  };

  // Form Validation & Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation Check 1: Empty fields
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password fields.');
      return;
    }

    // Validation Check 2: Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid college email address.');
      return;
    }

    // Validation Check 3: Password length
    if (password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    // Simulate login loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        name: email.split('@')[0],
        email,
        role: email.includes('admin') ? 'admin' : (email.includes('prof') ? 'professor' : 'student')
      });
    }, 600);
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
          <div className="demo-title">⚡ ONE-CLICK VIVA DEMO LOGIN</div>
          <div className="demo-buttons">
            <button type="button" className="btn-demo" onClick={() => handleQuickDemo('admin')}>👑 Admin</button>
            <button type="button" className="btn-demo" onClick={() => handleQuickDemo('professor')}>👨‍🏫 Faculty</button>
            <button type="button" className="btn-demo" onClick={() => handleQuickDemo('student')}>🎓 Student</button>
          </div>
        </div>

        {/* Dynamic Error Alert Banner */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'left' }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>College Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sharma@college.edu"
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

          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}
          </button>
        </form>

      </div>
    </div>
  );
}
