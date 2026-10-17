// Exports weekly lectures as an .ics file that Google Calendar, Outlook and
// phone calendars can import (recurring weekly events for 16 weeks).
const DAY_INDEX = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
const RRULE_DAY = { MON: 'MO', TUE: 'TU', WED: 'WE', THU: 'TH', FRI: 'FR', SAT: 'SA' };

const pad = (n) => String(n).padStart(2, '0');
const stamp = (d, hhmm) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${hhmm.replace(':', '')}00`;

export function exportICS(slots, name) {
  const today = new Date();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ClassOptima//Timetable//EN', 'CALSCALE:GREGORIAN'];
  slots.forEach((s, i) => {
    const d = new Date(today);
    const diff = (DAY_INDEX[s.day] - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    lines.push(
      'BEGIN:VEVENT',
      `UID:classoptima-${s._id || i}@classoptima`,
      `DTSTAMP:${stamp(today, '00:00')}`,
      `DTSTART:${stamp(d, s.startTime)}`,
      `DTEND:${stamp(d, s.endTime)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${RRULE_DAY[s.day]};COUNT=16`,
      `SUMMARY:${s.subject?.name || 'Lecture'}`,
      `LOCATION:${s.classroom?.roomNumber || ''} ${s.classroom?.building || ''}`.trim(),
      `DESCRIPTION:${s.subject?.code || ''} - ${s.classSection ? `${s.classSection.name} Sem ${s.classSection.semester} Div ${s.classSection.section}` : ''}`,
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[^a-z0-9]+/gi, '-')}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
