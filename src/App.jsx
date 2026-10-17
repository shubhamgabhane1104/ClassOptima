import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homeFor, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { Spinner } from './components/common/ui';
import AppShell from './components/layout/AppShell';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import TimetableGenerator from './pages/admin/TimetableGenerator';
import TeacherManager from './pages/admin/TeacherManager';
import ClassroomManager from './pages/admin/ClassroomManager';
import SubjectManager from './pages/admin/SubjectManager';
import SectionManager from './pages/admin/SectionManager';
import StudentList from './pages/admin/StudentList';
import ProfessorDashboard from './pages/professor/ProfessorDashboard';
import ProfessorProfile from './pages/professor/ProfessorProfile';
import StudentDashboard from './pages/student/StudentDashboard';
import RoomBookingPage from './pages/shared/RoomBookingPage';
import BookingList from './pages/admin/BookingList';
import ChangePassword from './pages/shared/ChangePassword';

// Only lets a user in when they are logged in with one of the allowed roles.
function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><Spinner label="Opening portal" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><Spinner label="Opening portal" /></div>;
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/timetable" element={<ProtectedRoute roles={['admin']}><TimetableGenerator /></ProtectedRoute>} />
              <Route path="/admin/teachers" element={<ProtectedRoute roles={['admin']}><TeacherManager /></ProtectedRoute>} />
              <Route path="/admin/classrooms" element={<ProtectedRoute roles={['admin']}><ClassroomManager /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute roles={['admin']}><SubjectManager /></ProtectedRoute>} />
              <Route path="/admin/sections" element={<ProtectedRoute roles={['admin']}><SectionManager /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute roles={['admin']}><StudentList /></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><BookingList /></ProtectedRoute>} />

              <Route path="/professor" element={<ProtectedRoute roles={['professor']}><ProfessorDashboard /></ProtectedRoute>} />
              <Route path="/professor/profile" element={<ProtectedRoute roles={['professor']}><ProfessorProfile /></ProtectedRoute>} />
              <Route path="/professor/rooms" element={<ProtectedRoute roles={['professor']}><RoomBookingPage /></ProtectedRoute>} />
              <Route path="/professor/password" element={<ProtectedRoute roles={['professor']}><ChangePassword /></ProtectedRoute>} />

              <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/rooms" element={<ProtectedRoute roles={['student']}><RoomBookingPage /></ProtectedRoute>} />
              <Route path="/student/password" element={<ProtectedRoute roles={['student']}><ChangePassword /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
