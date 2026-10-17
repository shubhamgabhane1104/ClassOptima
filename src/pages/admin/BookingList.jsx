import { useMemo, useState } from 'react';
import { CalendarCheck, XCircle } from 'lucide-react';
import useResource from '../../components/common/useResource';
import { EmptyState, ErrorNote, PageHeader, Spinner } from '../../components/common/ui';
import { useToast } from '../../components/common/Toast';
import { api } from '../../services/api';
import { niceDate, shortDivision, t12, todayISO } from '../../config/schedule';

const KIND = { 'extra-lecture': 'Extra lecture', 'student-activity': 'Student', 'faculty-meeting': 'Faculty' };

export default function BookingList() {
  const { data, loading, error, reload } = useResource('/bookings');
  const notify = useToast();
  const [show, setShow] = useState('upcoming');
  const today = todayISO();

  const rows = useMemo(() => {
    if (show === 'upcoming') return data.filter((b) => b.status === 'approved' && b.date >= today).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    return data;
  }, [data, show, today]);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel "${b.title}" booked by ${b.requesterName}? They will be notified.`)) return;
    try {
      const r = await api.patch(`/bookings/${b._id}/cancel`);
      notify(r.message);
      reload();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <div className="page">
      <PageHeader title="Room bookings" description="Rooms booked by students and faculty for extra lectures, study sessions and meetings. Bookings are approved automatically when a room is free; you can cancel any of them." />
      <section className="panel">
        <div className="panel-toolbar">
          <div className="segmented" role="tablist" aria-label="Which bookings">
            <button type="button" role="tab" aria-selected={show === 'upcoming'} className={show === 'upcoming' ? 'on' : ''} onClick={() => setShow('upcoming')}>Upcoming</button>
            <button type="button" role="tab" aria-selected={show === 'all'} className={show === 'all' ? 'on' : ''} onClick={() => setShow('all')}>All</button>
          </div>
          <span className="muted push-right">{rows.length} shown</span>
        </div>
        <ErrorNote error={error} />
        {loading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={show === 'upcoming' ? 'No upcoming bookings' : 'No bookings yet'}>Students and faculty book rooms from their own portals.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>When</th><th>Booking</th><th>Booked by</th><th>Room</th><th>People</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b._id}>
                    <td data-label="When"><strong>{niceDate(b.date)}</strong><div className="muted small">{t12(b.startTime)} – {t12(b.endTime)}</div></td>
                    <td data-label="Booking">
                      {b.title}
                      <div className="muted small">{b.reason}</div>
                    </td>
                    <td data-label="Booked by">
                      {b.requesterName}
                      <div><span className={`tag ${b.kind === 'extra-lecture' ? 'tag-blue' : b.kind === 'student-activity' ? 'tag-green' : 'tag-gold'}`}>{KIND[b.kind]}</span>{b.classSection && <span className="muted small"> {shortDivision(b.classSection)}</span>}</div>
                    </td>
                    <td data-label="Room">{b.classroom?.roomNumber}</td>
                    <td data-label="People">{b.attendees}</td>
                    <td data-label="Status">
                      {b.status === 'cancelled' ? <span className="pill">Cancelled{b.cancelledBy === 'admin' ? ' by office' : ''}</span>
                        : b.date < today ? <span className="pill">Done</span> : <span className="pill pill-green">Booked</span>}
                    </td>
                    <td className="actions-col">
                      {b.status === 'approved' && b.date >= today && (
                        <button type="button" className="icon-btn danger" aria-label="Cancel booking" onClick={() => cancel(b)}><XCircle size={17} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
