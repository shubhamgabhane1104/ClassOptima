import { useEffect, useState } from 'react';
import { MapPin, Clock, UserRound, Users } from 'lucide-react';
import { DAYS, nowParts, shortDivision, t12 } from '../../config/schedule';

const minutesBetween = (a, b) => {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return bh * 60 + bm - (ah * 60 + am);
};

// "Happening now" tracker: the current lecture with a countdown, or the next one today.
export default function LiveClassBanner({ slots, perspective = 'section' }) {
  const [now, setNow] = useState(nowParts());
  useEffect(() => {
    const t = setInterval(() => setNow(nowParts()), 15000);
    return () => clearInterval(t);
  }, []);

  const today = slots.filter((s) => s.day === now.day).sort((a, b) => a.slotIndex - b.slotIndex);
  const current = today.find((s) => s.startTime <= now.time && now.time < s.endTime);
  const next = today.find((s) => s.startTime > now.time);

  const who = (s) => (perspective === 'teacher'
    ? <><Users size={15} /> {shortDivision(s.classSection)} ({s.classSection?.studentCount} students)</>
    : <><UserRound size={15} /> {s.teacher?.name}</>);

  if (current) {
    const left = minutesBetween(now.time, current.endTime);
    const total = minutesBetween(current.startTime, current.endTime);
    return (
      <section className="live-banner live-on" aria-live="polite">
        <div className="live-label"><span className="live-dot" /> Happening now</div>
        <div className="live-main">
          <h2>{current.subject?.name}</h2>
          <ul className="live-facts">
            <li><Clock size={15} /> {t12(current.startTime)} – {t12(current.endTime)}</li>
            <li><MapPin size={15} /> {current.classroom?.roomNumber}, {current.classroom?.building}{current.classroom?.floor ? `, floor ${current.classroom.floor}` : ''}</li>
            <li>{who(current)}</li>
          </ul>
        </div>
        <div className="live-progress">
          <strong>{left} min</strong>
          <span>remaining</span>
          <div className="bar"><div style={{ width: `${Math.round(((total - left) / total) * 100)}%` }} /></div>
        </div>
        {next && <p className="live-next">Next: {next.subject?.name} at {t12(next.startTime)} in {next.classroom?.roomNumber}</p>}
      </section>
    );
  }

  let message;
  if (!DAYS.includes(now.day)) message = 'No lectures today. Enjoy the weekend.';
  else if (next) message = null;
  else if (today.length) message = 'All lectures for today are over.';
  else message = 'No lectures scheduled today.';

  return (
    <section className="live-banner live-off" aria-live="polite">
      <div className="live-label">Today’s status</div>
      {next ? (
        <div className="live-main">
          <h2>Next: {next.subject?.name}</h2>
          <ul className="live-facts">
            <li><Clock size={15} /> Starts {t12(next.startTime)} (in {minutesBetween(now.time, next.startTime)} min)</li>
            <li><MapPin size={15} /> {next.classroom?.roomNumber}, {next.classroom?.building}</li>
            <li>{who(next)}</li>
          </ul>
        </div>
      ) : (
        <div className="live-main"><h2>{message}</h2></div>
      )}
      <p className="live-next">{today.length} lecture{today.length === 1 ? '' : 's'} on today’s timetable.</p>
    </section>
  );
}
