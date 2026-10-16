import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Navbar from './Navbar';
import ProtectedRoute from './ProtectedRoute';
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
        {/* Use ProtectedRoute guard for Admin-only Faculty and Classroom managers */}
        <ProtectedRoute user={user} allowedRoles={['admin']}>
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
                🏫 Classroom & Lab Manager
              </button>
            </div>

            {adminTab === 'teachers' && <TeacherManager />}
            {adminTab === 'classrooms' && <ClassroomManager />}
          </div>
        </ProtectedRoute>
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
