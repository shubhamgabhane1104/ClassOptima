import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Navbar from './Navbar';
import ProtectedRoute from './ProtectedRoute';

// Admin Components
import TeacherManager from './TeacherManager';
import ClassroomManager from './ClassroomManager';
import SubjectCatalog from './pages/admin/SubjectCatalog';
import SectionManager from './pages/admin/SectionManager';
import AllocationControl from './pages/admin/AllocationControl';
import TimetableGrid from './components/timetable/TimetableGrid';

// Professor & Student Dashboards
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

import './App.css';

const sampleSchedule = {
  MON: {
    1: { subject: 'Database Systems', teacher: 'Dr. Amit Sharma', room: 'Room 402', type: 'theory' },
    2: { subject: 'Operating Systems', teacher: 'Prof. Vikas Patil', room: 'Room 304', type: 'theory' },
    4: { subject: 'DBMS Lab', teacher: 'Dr. Amit Sharma', room: 'Lab 3', type: 'lab' },
    5: { subject: 'DBMS Lab', teacher: 'Dr. Amit Sharma', room: 'Lab 3', type: 'lab' }
  },
  TUE: {
    1: { subject: 'Computer Networks', teacher: 'Dr. Meera Iyer', room: 'Room 202', type: 'theory' },
    3: { subject: 'Software Engg', teacher: 'Prof. K. Joshi', room: 'Room 305', type: 'theory' }
  },
  WED: {
    2: { subject: 'Database Systems', teacher: 'Dr. Amit Sharma', room: 'Room 402', type: 'theory' },
    4: { subject: 'Network Lab', teacher: 'Dr. Meera Iyer', room: 'Lab 1', type: 'lab' }
  },
  THU: {
    1: { subject: 'Operating Systems', teacher: 'Prof. Vikas Patil', room: 'Room 304', type: 'theory' },
    3: { subject: 'Database Systems', teacher: 'Dr. Amit Sharma', room: 'Room 402', type: 'theory' }
  },
  FRI: {
    2: { subject: 'Software Engg', teacher: 'Prof. K. Joshi', room: 'Room 305', type: 'theory' },
    4: { subject: 'Project Lab', teacher: 'Prof. Vikas Patil', room: 'Lab 2', type: 'lab' }
  }
};

function MainApp() {
  const { user, login, logout, switchRole } = useAuth();
  const [adminTab, setAdminTab] = useState('teachers');

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
        {/* Admin Portal */}
        {user.role === 'admin' && (
          <ProtectedRoute user={user} allowedRoles={['admin']}>
            <div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button
                  className={`btn-demo ${adminTab === 'teachers' ? 'btn-primary' : ''}`}
                  onClick={() => setAdminTab('teachers')}
                >
                  👨‍🏫 Faculty
                </button>
                <button
                  className={`btn-demo ${adminTab === 'classrooms' ? 'btn-primary' : ''}`}
                  onClick={() => setAdminTab('classrooms')}
                >
                  🏫 Classrooms
                </button>
                <button
                  className={`btn-demo ${adminTab === 'subjects' ? 'btn-primary' : ''}`}
                  onClick={() => setAdminTab('subjects')}
                >
                  📚 Subjects
                </button>
                <button
                  className={`btn-demo ${adminTab === 'sections' ? 'btn-primary' : ''}`}
                  onClick={() => setAdminTab('sections')}
                >
                  👥 Sections
                </button>
                <button
                  className={`btn-demo ${adminTab === 'allocation' ? 'btn-primary' : ''}`}
                  onClick={() => setAdminTab('allocation')}
                >
                  ⚡ Allocation Engine
                </button>
                <button
                  className={`btn-demo ${adminTab === 'timetable' ? 'btn-primary' : ''}`}
                  onClick={() => setAdminTab('timetable')}
                >
                  🗓️ Timetable Grid
                </button>
              </div>

              {adminTab === 'teachers' && <TeacherManager />}
              {adminTab === 'classrooms' && <ClassroomManager />}
              {adminTab === 'subjects' && <SubjectCatalog />}
              {adminTab === 'sections' && <SectionManager />}
              {adminTab === 'allocation' && <AllocationControl />}
              {adminTab === 'timetable' && <TimetableGrid schedule={sampleSchedule} />}
            </div>
          </ProtectedRoute>
        )}

        {/* Professor Portal */}
        {user.role === 'professor' && (
          <ProfessorDashboard />
        )}

        {/* Student Portal */}
        {user.role === 'student' && (
          <StudentDashboard />
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
