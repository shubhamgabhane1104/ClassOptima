import React from 'react';
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const SLOTS = [1, 2, 3, 4, 5, 6];
export default function AvailabilityPicker({ availability = [], onChange }) {
    const isAvailable = (day, slot) => {
        const dayObj = availability.find(d => d.day === day);
        return dayObj ? dayObj.availableSlots.includes(slot) : true;
    };
    const toggle = (day, slot) => {
        let copy = JSON.parse(JSON.stringify(availability));
        let dayObj = copy.find(d => d.day === day);
        if (!dayObj) {
            dayObj = { day, availableSlots: [1, 2, 3, 4, 5, 6] };
            copy.push(dayObj);
        }
        dayObj.availableSlots = dayObj.availableSlots.includes(slot)
            ? dayObj.availableSlots.filter(s => s !== slot)
            : [...dayObj.availableSlots, slot];
        onChange(copy);
    };
    return (
        <div className="availability-box">
            <div className="availability-grid">
                {DAYS.map(day => (
                    <div key={day} className="avail-row">
                        <span>{day.slice(0, 3)}</span>
                        {SLOTS.map(slot => (
                            <button key={slot} type="button" onClick={() => toggle(day, slot)} className={isAvailable(day, slot) ? 'avail-free' : 'avail-busy'}>
                                {isAvailable(day, slot) ? '✓' : '✗'}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}