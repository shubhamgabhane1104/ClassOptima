import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Navbar from './Navbar';
import './App.css';

function MainApp() {
  const { user, login, logout, switchRole } = useAuth();

  if (!user) {
    return <Login onLoginSuccess={login} />;
  }

  return (
    <div>
      <Navbar
        user={user}
        onLogout={logout}
        onSwitchRole={switchRole}
      />

      <main className="dashboard-content">
        <h1 className="dashboard-title">Welcome, {user.name}!</h1>
        <p>Active Role: <span className="dashboard-role">{user.role}</span></p>

        <div className="welcome-box">
          <h3>✅ Authentication & Session Management Active!</h3>
          <p>Your login session is now saved in localStorage. Try refreshing the page — you will stay logged in!</p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
