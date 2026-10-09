import React from 'react';
import LectureCard from './LectureCard';
import '../../styles/timetable.css';

const PERIODS = [1, 2, 3, 'recess', 4, 5];

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export default function TimetableGrid({
  schedule = {},
  onSlotClick,
}) {
  return (
    <div className="timetable-container">
      <table className="timetable-matrix">
        <thead>
          <tr>
            <th>Day</th>

            {PERIODS.map((period) => (
              <th key={period}>
                {period === 'recess'
                  ? 'Recess'
                  : `Period ${period}`}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {DAYS.map((day) => (
            <tr key={day}>
              <td className="day-cell">{day}</td>

              {PERIODS.map((period) => {
                if (period === 'recess') {
                  return (
                    <td key={period} className="recess-col">
                      LUNCH RECESS
                    </td>
                  );
                }

                const slot = schedule[day]?.[period];

                return (
                  <td key={period}>
                    {slot ? (
                      <LectureCard
                        slot={slot}
                        onClick={onSlotClick}
                      />
                    ) : null}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}