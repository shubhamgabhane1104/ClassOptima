import React from 'react';
import './styles/protectedRoute.css';

export default function ProtectedRoute({ user, allowedRoles = [], children }) {
  // If user is not logged in or role is not allowed, block access
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="access-denied-box">
        <div className="access-denied-card">
          <div className="access-denied-icon">🔒</div>
          <h2 className="access-denied-title">Access Restricted</h2>
          <p className="access-denied-text">
            Your current role (<span className="role-tag">{user ? user.role : 'Guest'}</span>) does not have permission to view this section.
          </p>
        </div>
      </div>
    );
  }

  // Access granted, show protected component!
  return children;
}
