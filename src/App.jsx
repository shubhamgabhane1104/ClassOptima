import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Navbar from './Navbar';
import TeacherManager from './TeacherManager';
import ClassroomManager from './ClassroomManager';
import './App.css';

function MainApp() {
  const { user, login, logout, switchRole } = useAuth();
  const [adminTab, setAdminTab] = useState('teachers'); // 'teachers' | 'classrooms'

  // If user is not logged in, show Login page
  if (!user) {
    return <Login onLoginSuccess={login} />;
  }

  // Once logged in, show Navbar and views
  return (
    <div>
      <Navbar
        user={user}
        onLogout={logout}
        onSwitchRole={switchRole}
      />

      <main className="dashboard-content">
        {/* If Admin is logged in, show Faculty and Classroom Managers */}
        {user.role === 'admin' ? (
          <div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
              <button
                className={`btn-demo ${adminTab === 'teachers' ? 'btn-primary' : ''}`}
                onClick={() => setAdminTab('teachers')}
              >
                👨‍🏫 Faculty Manager
              </button>
              <button
                className={`btn-demo ${adminTab === 'classrooms' ? 'btn-primary' : ''}`}
                onClick={() => setAdminTab('classrooms')}
              >
                🏢 Classroom & Lab Manager
              </button>
            </div>

            {adminTab === 'teachers' && <TeacherManager />}
            {adminTab === 'classrooms' && <ClassroomManager />}
          </div>
        ) : (
          <div className="welcome-box">
            <h3>Welcome, {user.name}!</h3>
            <p>Logged in as: <strong style={{ color: '#818cf8', textTransform: 'uppercase' }}>{user.role}</strong></p>
            <p style={{ color: '#94a3b8', marginTop: '10px' }}>
              Switch to 👑 Admin in the top navigation bar to manage faculty and classrooms.
            </p>
          </div>
        )}
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
