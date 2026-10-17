// Mirrors server/config/constants.js
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };
export const PERIODS = [
  { index: 1, start: '09:00', end: '10:00' },
  { index: 2, start: '10:00', end: '11:00' },
  { index: 3, start: '11:00', end: '12:00' },
  { index: 4, start: '12:00', end: '13:00' },
  { index: 5, start: '13:45', end: '14:45' },
  { index: 6, start: '14:45', end: '15:45' },
  { index: 7, start: '15:45', end: '16:45' },
];
export const RECESS = { afterPeriod: 4, start: '13:00', end: '13:45' };
export const ROOM_TYPES = ['Lecture Hall', 'Computer Lab', 'Hardware Lab', 'Physics Lab'];

export const isLab = (slot) => slot?.subject?.type === 'Practical/Lab';

export const divisionLabel = (s) => (s ? `${s.name}, Sem ${s.semester} Div ${s.section}` : '');
export const shortDivision = (s) =>
  s ? `${s.department.split(' ').map((w) => w[0]).join('')} ${s.semester}-${s.section}` : '';

// 12-hour time for display
export const t12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// Today's code and time in the browser's clock
export const nowParts = () => {
  const d = new Date();
  const day = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { day, time, date: d };
};
