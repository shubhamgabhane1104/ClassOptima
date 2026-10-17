import { useCallback, useEffect, useState } from 'react';
import { DoorOpen, MapPin, Search, XCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { ErrorNote, Field, PageHeader, Spinner } from '../../components/common/ui';
import { ROOM_TYPES, addMinutes, niceDate, t12, todayISO } from '../../config/schedule';

const STUDENT_PURPOSES = ['Group study', 'Project work', 'Club / committee meeting', 'Event practice', 'Seminar preparation', 'Other'];
const DURATIONS = [30, 60, 90, 120, 150, 180];
const durationLabel = (m) => (m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? 's' : ''}`.replace('.5 hours', '½ hours'));

const emptyForm = (role) => ({
  kind: role === 'professor' ? 'extra-lecture' : 'student-activity',
  title: role === 'professor' ? 'Department meeting' : STUDENT_PURPOSES[0],
  attendees: role === 'professor' ? 10 : 6,
  roomType: 'Any',
  classSectionId: '',
  subjectId: '',
  date: '',
  startTime: '14:00',
  durationMinutes: 60,
  reason: '',
});

export default function RoomBookingPage() {
  const { user } = useAuth();
  const notify = useToast();
  const isProf = user.role === 'professor';
  const [form, setForm] = useState(emptyForm(user.role));
  const [divisions, setDivisions] = useState([]);
  const [mine, setMine] = useState(null);
  const [free, setFree] = useState(null);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [confirmed, setConfirmed] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadMine = useCallback(() => api.get('/bookings/mine').then((d) => setMine(d.data)).catch((e) => setError(e.message)), []);

  useEffect(() => {
    loadMine();
    if (isProf) {
      api.get('/bookings/my-divisions').then((d) => {
        setDivisions(d.data);
        if (d.data[0]) setForm((f) => ({ ...f, classSectionId: d.data[0]._id, subjectId: d.data[0].subjects[0]?._id || '' }));
      }).catch(() => {});
    }
  }, [isProf, loadMine]);

  const division = divisions.find((d) => d._id === form.classSectionId);
  const isExtra = isProf && form.kind === 'extra-lecture';
  const attendees = isExtra ? division?.studentCount || 0 : Number(form.attendees);
  const subject = division?.subjects.find((x) => x._id === form.subjectId);
  // for "match the subject": theory needs a lecture hall; labs are checked against any lab here
  let previewType = form.roomType;
  if (isExtra && form.roomType === 'Any') previewType = subject?.type === 'Theory' ? 'Lecture Hall' : '';
  const endTime = form.startTime ? addMinutes(form.startTime, form.durationMinutes) : '';

  // Live preview of free rooms while the form is being filled
  const previewKey = form.date && form.startTime && attendees
    ? `date=${form.date}&startTime=${form.startTime}&durationMinutes=${form.durationMinutes}&attendees=${attendees}&roomType=${encodeURIComponent(previewType)}`
    : '';

  useEffect(() => {
    if (!previewKey) return undefined;
    const t = setTimeout(() => {
      api.get(`/bookings/availability?${previewKey}`)
        .then((d) => setFree({ key: previewKey, rooms: d.data, error: '' }))
        .catch((e) => setFree({ key: previewKey, rooms: [], error: e.message }));
    }, 350);
    return () => clearTimeout(t);
  }, [previewKey]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSuggestions([]);
    setConfirmed(null);
    try {
      const body = { ...form, durationMinutes: Number(form.durationMinutes), attendees: Number(form.attendees) };
      if (isProf && form.kind !== 'extra-lecture') body.kind = 'faculty-meeting';
      const r = await api.post('/bookings', body);
      setConfirmed(r.data);
      notify(r.message);
      setForm((f) => ({ ...emptyForm(user.role), kind: f.kind, classSectionId: f.classSectionId, subjectId: f.subjectId }));
      loadMine();
    } catch (err) {
      setError(err.message);
      setSuggestions(err.details?.suggestions || []);
    } finally {
      setBusy(false);
    }
  };

  const applySuggestion = (s) => {
    const mins = (Number(s.endTime.slice(0, 2)) * 60 + Number(s.endTime.slice(3))) - (Number(s.startTime.slice(0, 2)) * 60 + Number(s.startTime.slice(3)));
    setForm({ ...form, date: s.date, startTime: s.startTime, durationMinutes: mins });
    setError('');
    setSuggestions([]);
  };

  const cancel = async (b) => {
    if (!window.confirm(`Cancel "${b.title}" on ${niceDate(b.date)}?${b.kind === 'extra-lecture' ? ' Students of the division will be notified.' : ''}`)) return;
    try {
      const r = await api.patch(`/bookings/${b._id}/cancel`);
      notify(r.message);
      loadMine();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const today = todayISO();
  const preview = free && free.key === previewKey ? free : null;

  return (
    <div className="page">
      <PageHeader
        title={isProf ? 'Book a room or extra lecture' : 'Book a room'}
        description={isProf
          ? 'Request a classroom or lab for an extra lecture or a meeting. If a suitable room is free, it is booked straight away and your students are notified.'
          : 'Need a classroom or lab for group study, a project or a meeting? Fill in the details and an empty room is booked for you instantly.'}
      />

      <div className="booking-layout">
        <form className="panel form-grid" onSubmit={submit}>
          {isProf && (
            <div className="field-span segmented segmented-wide" role="radiogroup" aria-label="Booking type">
              <button type="button" role="radio" aria-checked={form.kind === 'extra-lecture'} className={form.kind === 'extra-lecture' ? 'on' : ''} onClick={() => setForm({ ...form, kind: 'extra-lecture' })}>Extra lecture</button>
              <button type="button" role="radio" aria-checked={form.kind !== 'extra-lecture'} className={form.kind !== 'extra-lecture' ? 'on' : ''} onClick={() => setForm({ ...form, kind: 'faculty-meeting' })}>Meeting or other</button>
            </div>
          )}

          {isExtra ? (
            <>
              <Field label="Division">
                <select required value={form.classSectionId} onChange={(e) => {
                  const d = divisions.find((x) => x._id === e.target.value);
                  setForm({ ...form, classSectionId: e.target.value, subjectId: d?.subjects[0]?._id || '' });
                }}>
                  {divisions.length === 0 && <option value="">No divisions assigned to you</option>}
                  {divisions.map((d) => <option key={d._id} value={d._id}>{d.label}</option>)}
                </select>
              </Field>
              <Field label="Subject">
                <select required value={form.subjectId} onChange={set('subjectId')}>
                  {division?.subjects.map((s) => <option key={s._id} value={s._id}>{s.code} {s.name}</option>)}
                </select>
              </Field>
              <Field label="Number of students" hint="Taken from the division's strength">
                <input value={division ? division.studentCount : ''} disabled />
              </Field>
              <Field label="Room type">
                <select value={form.roomType} onChange={set('roomType')}>
                  <option value="Any">Match the subject (hall for theory, lab for practical)</option>
                  {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </>
          ) : (
            <>
              <Field label={isProf ? 'Title' : 'What is it for?'}>
                {isProf ? (
                  <input required value={form.title} onChange={set('title')} maxLength={120} />
                ) : (
                  <select value={form.title} onChange={set('title')}>
                    {STUDENT_PURPOSES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                )}
              </Field>
              <Field label={isProf ? 'Number of people' : 'Number of students'}>
                <input required type="number" min="1" max="200" value={form.attendees} onChange={set('attendees')} />
              </Field>
              <Field label="Room type" span>
                <select value={form.roomType} onChange={set('roomType')}>
                  <option value="Any">Any free room</option>
                  {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </>
          )}

          <Field label="Date"><input required type="date" min={today} value={form.date} onChange={set('date')} /></Field>
          <Field label="Start time" hint="Between 8:00 AM and 7:00 PM">
            <input required type="time" min="08:00" max="18:30" step="900" value={form.startTime} onChange={set('startTime')} />
          </Field>
          <Field label="Duration" hint={endTime ? `Ends at ${t12(endTime)}` : undefined}>
            <select value={form.durationMinutes} onChange={set('durationMinutes')}>
              {DURATIONS.map((m) => <option key={m} value={m}>{durationLabel(m)}</option>)}
            </select>
          </Field>
          <div className="field room-preview" aria-live="polite">
            <span className="field-label">Free rooms at that time</span>
            {!previewKey ? <span className="muted small">Pick a date to check.</span>
              : !preview ? <span className="muted small">Checking…</span>
                : preview.error ? <span className="small text-red">{preview.error}</span>
                  : preview.rooms.length === 0 ? <span className="small text-red">None free. Try another time.</span>
                    : (
                      <span className="small">
                        <strong className="text-green">{preview.rooms.length} free</strong>: {preview.rooms.slice(0, 4).map((r) => `${r.roomNumber} (${r.capacity})`).join(', ')}{preview.rooms.length > 4 ? '…' : ''}
                      </span>
                    )}
          </div>

          <Field label="Reason" span hint="Shown to the admin office">
            <textarea required minLength={5} maxLength={500} rows={3} value={form.reason} onChange={set('reason')}
              placeholder={isExtra ? 'e.g. Revision of Unit 3 before the class test' : 'e.g. Final year project discussion with our guide'} />
          </Field>

          <ErrorNote error={error} />
          {suggestions.length > 0 && (
            <div className="field-span suggestions">
              <span className="field-label">These times are free instead</span>
              <div>
                {suggestions.map((s) => (
                  <button key={`${s.date}${s.startTime}`} type="button" className="btn btn-outline btn-sm" onClick={() => applySuggestion(s)}>
                    {niceDate(s.date)}, {t12(s.startTime)} ({s.roomNumber})
                  </button>
                ))}
              </div>
            </div>
          )}

          {confirmed && (
            <div className="field-span booking-confirmed">
              <CheckCircle2 size={22} />
              <div>
                <strong>{confirmed.classroom.roomNumber} is booked</strong>
                <p>{confirmed.title}, {niceDate(confirmed.date, { weekday: 'long', day: 'numeric', month: 'long' })}, {t12(confirmed.startTime)} – {t12(confirmed.endTime)}. {confirmed.classroom.building}{confirmed.classroom.floor ? `, floor ${confirmed.classroom.floor}` : ''}.</p>
                {confirmed.kind === 'extra-lecture' && <p>Students of the division have been notified, and it now shows on your timetable and theirs.</p>}
              </div>
            </div>
          )}

          <div className="field-span">
            <button type="submit" className="btn btn-primary" disabled={busy || (isExtra && !divisions.length)}>
              <Search size={16} /> {busy ? 'Finding a room…' : 'Find and book a room'}
            </button>
          </div>
        </form>

        <section className="panel">
          <h2 className="panel-title">My bookings</h2>
          {!mine ? <Spinner /> : mine.length === 0 ? (
            <p className="muted">You have not booked any rooms yet.</p>
          ) : (
            <ul className="my-bookings">
              {mine.map((b) => {
                const past = b.date < today;
                return (
                  <li key={b._id} className={b.status === 'cancelled' || past ? 'faded' : ''}>
                    <div>
                      <strong>{b.title}</strong>
                      <span className="small">{niceDate(b.date)}, {t12(b.startTime)} – {t12(b.endTime)}</span>
                      <span className="small muted"><MapPin size={13} /> {b.classroom?.roomNumber}{b.classSection ? `, Div ${b.classSection.section}` : ''}</span>
                    </div>
                    {b.status === 'cancelled' ? <span className="pill">Cancelled</span>
                      : past ? <span className="pill">Done</span>
                        : (
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => cancel(b)}>
                            <XCircle size={15} /> Cancel
                          </button>
                        )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="muted small booking-rules">
            <DoorOpen size={14} /> Rooms are booked only when no regular lecture or other booking uses them, and
            {isProf ? ' only when you and the division are free.' : ' not during your own division’s lectures. You can hold up to 3 upcoming bookings.'}
          </p>
        </section>
      </div>
    </div>
  );
}

