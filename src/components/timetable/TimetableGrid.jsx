import { Fragment, useEffect, useRef, useState } from 'react';
import { Lock, FlaskConical } from 'lucide-react';
import { DAYS, DAY_LABELS, PERIODS, RECESS, isLab, nowParts, shortDivision, t12 } from '../../config/schedule';

/**
 * Weekly timetable matrix (Mon–Sat × 7 periods, lunch recess after period 4).
 *
 * perspective: 'section' shows the teacher on each card, 'teacher' shows the division.
 * editable:    enables drag-and-drop; validateMove/onMove are then required.
 */
export default function TimetableGrid({
  slots = [],
  perspective = 'section',
  editable = false,
  validateMove,
  onMove,
  onSlotClick,
  conflictIds = new Set(),
  id = 'timetable',
}) {
  const [now, setNow] = useState(nowParts());
  const [dragging, setDragging] = useState(null);
  const [dropState, setDropState] = useState({});
  const pending = useRef(new Set());

  useEffect(() => {
    const t = setInterval(() => setNow(nowParts()), 30000);
    return () => clearInterval(t);
  }, []);

  const slotAt = (day, p) => slots.find((s) => s.day === day && s.slotIndex === p);
  const coveredBy = (day, p) => slots.find((s) => s.day === day && s.slotIndex < p && s.slotIndex + s.duration > p);
  const nowPeriod = PERIODS.find((p) => p.start <= now.time && now.time < p.end);

  // --- drag and drop ---
  const startDrag = (e, slot) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slot._id);
    setDragging(slot);
    setDropState({});
    pending.current = new Set();
  };

  const checkCell = async (day, p) => {
    const key = `${day}-${p}`;
    if (!dragging || dropState[key] || pending.current.has(key)) return;
    if (dragging.day === day && dragging.slotIndex === p) return;
    pending.current.add(key);
    setDropState((s) => ({ ...s, [key]: { status: 'checking' } }));
    try {
      const r = await validateMove(dragging, day, p);
      setDropState((s) => ({ ...s, [key]: { status: r.valid ? 'ok' : 'bad', message: r.valid ? '' : r.conflicts[0]?.message } }));
    } catch (err) {
      setDropState((s) => ({ ...s, [key]: { status: 'bad', message: err.message } }));
    }
  };

  const endDrag = () => {
    setDragging(null);
    setDropState({});
  };

  const drop = (e, day, p) => {
    e.preventDefault();
    const slot = dragging;
    endDrag();
    if (slot && !(slot.day === day && slot.slotIndex === p)) onMove(slot, day, p);
  };

  const cellProps = (day, p) => {
    if (!editable || !dragging) return {};
    return {
      onDragEnter: () => checkCell(day, p),
      onDragOver: (e) => e.preventDefault(),
      onDrop: (e) => drop(e, day, p),
    };
  };

  return (
    <div className="tt-scroll">
      <table className={`tt ${editable ? 'tt-editable' : ''}`} id={id}>
        <thead>
          <tr>
            <th className="tt-corner" scope="col">Day</th>
            {PERIODS.map((p) => (
              <Fragment key={p.index}>
                <th scope="col" className={nowPeriod?.index === p.index ? 'tt-now-col' : ''}>
                  <span className="tt-period">Period {p.index}</span>
                  <span className="tt-time">{t12(p.start)} – {t12(p.end)}</span>
                </th>
                {p.index === RECESS.afterPeriod && <th scope="col" className="tt-recess-head" aria-label="Lunch recess">Lunch</th>}
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day} className={now.day === day ? 'tt-today' : ''}>
              <th scope="row" className="tt-day">
                {DAY_LABELS[day]}
                {now.day === day && <span className="tt-today-tag">Today</span>}
              </th>
              {PERIODS.map((p) => {
                const recessCell = p.index === RECESS.afterPeriod && (
                  day === DAYS[0] ? (
                    <td className="tt-recess" rowSpan={DAYS.length}>
                      <span>Lunch recess {t12(RECESS.start)} – {t12(RECESS.end)}</span>
                    </td>
                  ) : null
                );
                if (coveredBy(day, p.index)) return <Fragment key={p.index}>{recessCell}</Fragment>;
                const slot = slotAt(day, p.index);
                const key = `${day}-${p.index}`;
                const ds = dropState[key];
                const isNow = now.day === day && nowPeriod && slot && nowPeriod.index >= slot.slotIndex && nowPeriod.index < slot.slotIndex + slot.duration;
                return (
                  <Fragment key={p.index}>
                    <td
                      colSpan={slot ? slot.duration : undefined}
                      className={`tt-cell ${ds ? `drop-${ds.status}` : ''}`}
                      title={ds?.message || undefined}
                      {...cellProps(day, p.index)}
                    >
                      {slot && (
                        <LectureCard
                          slot={slot}
                          perspective={perspective}
                          live={Boolean(isNow)}
                          clash={conflictIds.has(slot._id)}
                          draggable={editable}
                          onDragStart={(e) => startDrag(e, slot)}
                          onDragEnd={endDrag}
                          onClick={onSlotClick ? () => onSlotClick(slot) : undefined}
                        />
                      )}
                    </td>
                    {recessCell}
                  </Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {dragging && (
        <p className="tt-drag-hint">
          Moving <strong>{dragging.subject?.name}</strong>. Green cells are free for this teacher, room and division; red cells would cause a clash.
        </p>
      )}
    </div>
  );
}

export function LectureCard({ slot, perspective, live, clash, onClick, ...dragProps }) {
  const lab = isLab(slot);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`lecture ${lab ? 'lecture-lab' : 'lecture-theory'} ${live ? 'lecture-live' : ''} ${clash ? 'lecture-clash' : ''}`}
      onClick={onClick}
      {...dragProps}
    >
      <span className="lecture-top">
        <span className="lecture-code">{slot.subject?.code}</span>
        {lab && <FlaskConical size={13} aria-label="Lab" />}
        {slot.isLocked && <Lock size={12} aria-label="Locked" />}
        {live && <span className="live-dot" aria-label="Happening now" />}
      </span>
      <span className="lecture-name">{slot.subject?.name}</span>
      <span className="lecture-meta">
        {perspective === 'teacher' ? shortDivision(slot.classSection) : slot.teacher?.name}
      </span>
      <span className="lecture-room">{slot.classroom?.roomNumber}</span>
    </Tag>
  );
}
