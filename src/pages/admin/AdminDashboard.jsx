import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DoorOpen, BookOpen, GraduationCap, Contact, CalendarCog, CalendarCheck, CheckCircle2, Circle } from 'lucide-react';
import { api } from '../../services/api';
import college from '../../config/college';
import { ErrorNote, PhotoBanner, Spinner, Stat } from '../../components/common/ui';
import { useAuth } from '../../context/AuthContext';

const STATUS_TEXT = {
  empty: 'No timetable yet',
  draft: 'Draft, not visible to faculty and students',
  published: 'Published to faculty and students',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/stats').then((d) => setStats(d.data)).catch((e) => setError(e.message));
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const steps = stats ? [
    { done: stats.classrooms > 0, label: 'Add classrooms and labs', to: '/admin/classrooms' },
    { done: stats.teachers > 0, label: 'Add faculty and their availability', to: '/admin/teachers' },
    { done: stats.subjects > 0, label: 'Add subjects for each semester', to: '/admin/subjects' },
    { done: stats.sections > 0, label: 'Create divisions and assign teachers', to: '/admin/sections' },
    { done: stats.slots > 0, label: 'Generate the timetable', to: '/admin/timetable' },
    { done: stats.status === 'published', label: 'Review and publish', to: '/admin/timetable' },
  ] : [];

  return (
    <div className="page">
      <PhotoBanner image={college.images.campus} title={`Good ${greeting()}, ${user.name.split(' ')[0]}`} subtitle={today}>
        {stats && (
          <div className={`status-card status-${stats.status}`}>
            <span>Timetable status</span>
            <strong>{STATUS_TEXT[stats.status]}</strong>
            <Link to="/admin/timetable" className="btn btn-gold btn-sm"><CalendarCog size={15} /> Open generator</Link>
          </div>
        )}
      </PhotoBanner>

      <ErrorNote error={error} />
      {!stats ? <Spinner /> : (
        <>
          <div className="stat-row">
            <Stat icon={Users} value={stats.teachers} label="Faculty" />
            <Stat icon={DoorOpen} value={`${stats.classrooms - stats.labs} + ${stats.labs}`} label="Halls + labs" />
            <Stat icon={BookOpen} value={stats.subjects} label="Subjects" />
            <Stat icon={GraduationCap} value={stats.sections} label="Divisions" />
            <Stat icon={Contact} value={stats.students} label="Students registered" />
            <Link to="/admin/bookings" className="stat-link"><Stat icon={CalendarCheck} value={stats.bookings} label="Upcoming room bookings" /></Link>
          </div>

          <section className="panel">
            <h2 className="panel-title">Semester timetable setup</h2>
            <ol className="checklist">
              {steps.map((s) => (
                <li key={s.label} className={s.done ? 'done' : ''}>
                  {s.done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  <Link to={s.to}>{s.label}</Link>
                </li>
              ))}
            </ol>
            {stats.lastUpdated && (
              <p className="muted small">Timetable last changed {new Date(stats.lastUpdated).toLocaleString('en-IN')}. {stats.slots} lecture blocks, {stats.locked} locked.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
