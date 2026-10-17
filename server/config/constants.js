// Shared scheduling constants used by models, the allocation engine and the API.

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const DAY_LABELS = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
};

// 7 teaching periods per day with a lunch recess after period 4.
const PERIODS = [
  { index: 1, start: '09:00', end: '10:00' },
  { index: 2, start: '10:00', end: '11:00' },
  { index: 3, start: '11:00', end: '12:00' },
  { index: 4, start: '12:00', end: '13:00' },
  { index: 5, start: '13:45', end: '14:45' },
  { index: 6, start: '14:45', end: '15:45' },
  { index: 7, start: '15:45', end: '16:45' },
];

const RECESS = { afterPeriod: 4, start: '13:00', end: '13:45' };

const PERIOD_COUNT = PERIODS.length;

const ROOM_TYPES = ['Lecture Hall', 'Computer Lab', 'Hardware Lab', 'Physics Lab'];
const LAB_ROOM_TYPES = ['Computer Lab', 'Hardware Lab', 'Physics Lab'];

const SUBJECT_TYPES = ['Theory', 'Practical/Lab'];

const getPeriod = (index) => PERIODS.find((p) => p.index === index);

// A block of `duration` periods starting at `start` may not cross the lunch recess.
const isValidBlockStart = (start, duration) => {
  const end = start + duration - 1;
  if (start < 1 || end > PERIOD_COUNT) return false;
  if (start <= RECESS.afterPeriod && end > RECESS.afterPeriod) return false;
  return true;
};

const blockTimes = (start, duration) => ({
  startTime: getPeriod(start).start,
  endTime: getPeriod(start + duration - 1).end,
});

module.exports = {
  DAYS,
  DAY_LABELS,
  PERIODS,
  RECESS,
  PERIOD_COUNT,
  ROOM_TYPES,
  LAB_ROOM_TYPES,
  SUBJECT_TYPES,
  getPeriod,
  isValidBlockStart,
  blockTimes,
};
