import React from 'react';
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const SLOTS = [1, 2, 3, 4, 5, 6];

export default function AvailabilityPicker({ availability = [], onChange }) {
  const isAvailable = (day, slot) => {
    const dayObj = availability.find((d) => d.day === day);
    return dayObj ? dayObj.availableSlots.includes(slot) : true;
  };
  const toggleSlot = (day, slot) => {
    let newAvailability = JSON.parse(JSON.stringify(availability));
    let dayObj = newAvailability.find((d) => d.day === day);
    if (!dayObj) {
      dayObj = { day, availableSlots: [1, 2, 3, 4, 5, 6] };
      newAvailability.push(dayObj);
    }
    if (dayObj.availableSlots.includes(slot)) {
      dayObj.availableSlots = dayObj.availableSlots.filter((s) => s !== slot);
    } else {
      dayObj.availableSlots.push(slot);
    }
    onChange(newAvailability);
  };
  
  return (
    <div className="availability-box">
      <label className="section-label">
        Weekly Availability Grid (Click slot to toggle Available / Busy):
      </label>
      
      <div className="availability-grid">
        <div className="grid-header-blank"></div>
        {SLOTS.map((s) => (
          <div key={s} className="grid-header-slot">P{s}</div>
        ))}
        {DAYS.map((day) => (
          <React.Fragment key={day}>
            <div className="grid-day-label">{day.slice(0, 3)}</div>
            {SLOTS.map((slot) => {
              const active = isAvailable(day, slot);
              return (
                <button
                  key={`${day}-${slot}`}
                  type="button"
                  onClick={() => toggleSlot(day, slot)}
                  className={`slot-toggle-btn ${active ? 'slot-available' : 'slot-busy'}`}
                  title={active ? 'Available' : 'Unavailable/Busy'}
                >
                  {active ? '✓' : '✗'}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}