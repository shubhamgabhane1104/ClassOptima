import { Link } from 'react-router-dom';
import { CalendarPlus, MapPin } from 'lucide-react';
import { niceDate, t12, shortDivision, todayISO } from '../../config/schedule';

// List of upcoming extra lectures and room bookings for the dashboard
export default function UpcomingExtras({ extras, perspective, bookLink }) {
  const today = todayISO();
  const upcoming = extras.filter((b) => b.date >= today).slice(0, 6);
  return (
    <section className="panel">
      <div className="panel-toolbar">
        <h2 className="panel-title">Extra lectures and room bookings</h2>
        {bookLink && <Link to={bookLink} className="btn btn-outline btn-sm push-right"><CalendarPlus size={16} /> Book a room</Link>}
      </div>
      {upcoming.length === 0 ? (
        <p className="muted">Nothing extra scheduled. Bookings and extra lectures you are part of will appear here and on the timetable.</p>
      ) : (
        <ul className="extras-list">
          {upcoming.map((b) => (
            <li key={b._id}>
              <div className="extras-date">
                <strong>{niceDate(b.date, { day: 'numeric' })}</strong>
                <span>{niceDate(b.date, { month: 'short' })}</span>
              </div>
              <div className="extras-body">
                <strong>{b.title}</strong>
                <span className="muted small">
                  {niceDate(b.date, { weekday: 'long' })}, {t12(b.startTime)} – {t12(b.endTime)}
                  {b.kind === 'extra-lecture' && (perspective === 'teacher' ? `, ${shortDivision(b.classSection)}` : `, ${b.teacher?.name}`)}
                </span>
              </div>
              <span className="extras-room"><MapPin size={14} /> {b.classroom?.roomNumber}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
