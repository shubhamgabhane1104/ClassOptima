import { useEffect, useState } from 'react';
import { FileDown, CalendarPlus, MapPin } from 'lucide-react';
import { api, downloadFile } from '../../services/api';
import college from '../../config/college';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { EmptyState, ErrorNote, PhotoBanner, Spinner } from '../../components/common/ui';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import LiveClassBanner from '../../components/timetable/LiveClassBanner';
import UpcomingExtras from '../../components/timetable/UpcomingExtras';
import { NoticesPanel } from '../../components/common/Notifications';
import { DAYS, DAY_LABELS } from '../../config/schedule';
import { exportICS } from '../../services/calendarExport';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const notify = useToast();
  const [slots, setSlots] = useState(null);
  const [load, setLoad] = useState(null);
  const [error, setError] = useState('');
  const [extras, setExtras] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/professor/schedule'), api.get('/professor/workload'), api.get('/bookings/feed')])
      .then(([s, w, f]) => { setSlots(s.data); setLoad(w.data); setExtras(f.data); })
      .catch((e) => setError(e.message));
  }, []);

  const teacher = user.teacher || {};
  const pct = load ? Math.min(100, Math.round((load.assignedHours / load.maxHoursPerWeek) * 100)) : 0;
  const busiest = load ? Math.max(1, ...Object.values(load.byDay)) : 1;

  return (
    <div className="page">
      <PhotoBanner image={college.images.classroom} title={teacher.name || user.name} subtitle={`${teacher.designation || 'Faculty'}, ${teacher.department || ''}`}>
        <div className="banner-facts">
          <span><MapPin size={15} /> {teacher.cabinNumber || 'Cabin not set'}</span>
          <span>{user.email}</span>
        </div>
      </PhotoBanner>
      <ErrorNote error={error} />
      {!slots ? <Spinner /> : (
        <>
          <div className="two-col">
            <LiveClassBanner slots={slots} extras={extras} perspective="teacher" />
            {load && (
              <section className="panel workload">
                <h2 className="panel-title">Weekly workload</h2>
                <div className="gauge" role="meter" aria-valuemin={0} aria-valuemax={load.maxHoursPerWeek} aria-valuenow={load.assignedHours}>
                  <div className="gauge-fill" style={{ width: `${pct}%` }} />
                </div>
                <p className="gauge-text"><strong>{load.assignedHours}</strong> of {load.maxHoursPerWeek} hours per week</p>
                <dl className="mini-stats">
                  <div><dt>Theory</dt><dd>{load.theoryHours} h</dd></div>
                  <div><dt>Practicals</dt><dd>{load.labHours} h</dd></div>
                  <div><dt>Divisions</dt><dd>{load.divisions}</dd></div>
                </dl>
                <div className="day-bars" aria-label="Hours per day">
                  {DAYS.map((d) => (
                    <div key={d} className="day-bar">
                      <div className="day-bar-track"><div style={{ height: `${(load.byDay[d] / busiest) * 100}%` }} /></div>
                      <span>{DAY_LABELS[d].slice(0, 3)}</span>
                      <small>{load.byDay[d]}h</small>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <section className="panel">
            <div className="panel-toolbar">
              <h2 className="panel-title">My lectures this week</h2>
              <div className="push-right toolbar-actions">
                <button type="button" className="btn btn-outline btn-sm" disabled={!slots.length} onClick={() => exportICS(slots, `${teacher.name || 'my'}-timetable`)}>
                  <CalendarPlus size={16} /> Add to calendar
                </button>
                <button type="button" className="btn btn-primary btn-sm" disabled={!slots.length}
                  onClick={() => downloadFile('/export/pdf/teacher/me', 'my-timetable.pdf').catch((e) => notify(e.message, 'error'))}>
                  <FileDown size={16} /> Download PDF
                </button>
              </div>
            </div>
            {slots.length === 0 ? (
              <EmptyState title="Your timetable has not been published yet">The admin office will publish it once the semester timetable is final.</EmptyState>
            ) : <TimetableGrid slots={slots} perspective="teacher" extras={extras} />}
          </section>

          <UpcomingExtras extras={extras} perspective="teacher" bookLink="/professor/rooms" />
          <NoticesPanel title="Recent notifications" />

          {load?.assignments?.length > 0 && (
            <section className="panel">
              <h2 className="panel-title">Subjects assigned to you</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Subject</th><th>Division</th><th>Type</th><th>Hours/week</th></tr></thead>
                  <tbody>
                    {load.assignments.map((a, i) => (
                      <tr key={i}>
                        <td data-label="Subject"><strong>{a.subject.code}</strong> {a.subject.name}</td>
                        <td data-label="Division">{a.division}</td>
                        <td data-label="Type">{a.subject.type === 'Theory' ? 'Theory' : 'Practical'}</td>
                        <td data-label="Hours/week">{a.subject.weeklyHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
