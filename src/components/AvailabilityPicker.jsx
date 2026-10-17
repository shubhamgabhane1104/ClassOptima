import { DAYS, DAY_LABELS, PERIODS } from '../config/schedule';

// Grid of day × period toggles. `availability` uses the server format:
// [{ day: 'MON', availableSlots: [1,2,3] }]. A day that is not listed = fully available.
export default function AvailabilityPicker({ availability = [], onChange }) {
  const isFree = (day, p) => {
    const entry = availability.find((a) => a.day === day);
    return entry ? entry.availableSlots.includes(p) : true;
  };

  const write = (day, slots) => {
    const rest = availability.filter((a) => a.day !== day);
    const sorted = [...new Set(slots)].sort((a, b) => a - b);
    onChange(sorted.length === PERIODS.length ? rest : [...rest, { day, availableSlots: sorted }]);
  };

  const toggle = (day, p) => {
    const current = PERIODS.map((x) => x.index).filter((x) => isFree(day, x));
    write(day, isFree(day, p) ? current.filter((x) => x !== p) : [...current, p]);
  };

  const toggleDay = (day) => {
    const allFree = PERIODS.every((p) => isFree(day, p.index));
    write(day, allFree ? [] : PERIODS.map((p) => p.index));
  };

  return (
    <div className="avail">
      <div className="avail-row avail-head">
        <span />
        {PERIODS.map((p) => <span key={p.index}>P{p.index}</span>)}
      </div>
      {DAYS.map((day) => (
        <div className="avail-row" key={day}>
          <button type="button" className="avail-day" onClick={() => toggleDay(day)} title="Toggle whole day">
            {DAY_LABELS[day].slice(0, 3)}
          </button>
          {PERIODS.map((p) => {
            const free = isFree(day, p.index);
            return (
              <button
                key={p.index}
                type="button"
                className={`avail-cell ${free ? 'free' : 'busy'}`}
                aria-pressed={free}
                aria-label={`${DAY_LABELS[day]} period ${p.index}: ${free ? 'available' : 'not available'}`}
                onClick={() => toggle(day, p.index)}
              >
                {free ? '✓' : ''}
              </button>
            );
          })}
        </div>
      ))}
      <p className="field-hint">Ticked periods are available. Click a day name to toggle the whole day.</p>
    </div>
  );
}
