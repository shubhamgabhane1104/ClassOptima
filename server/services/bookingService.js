/**
 * Room booking service
 * --------------------
 * Finds an empty classroom or lab for a one-off request on a given date and
 * time. A room is "empty" when no weekly timetable lecture uses it on that
 * weekday at an overlapping time, and no other approved booking holds it.
 * For extra lectures the teacher and the division must also be free.
 */
const Classroom = require('../models/Classroom');
const TimetableSlot = require('../models/TimetableSlot');
const RoomBooking = require('../models/RoomBooking');
const { HttpError } = require('../middleware/errorHandler');

const CAMPUS_OPEN = '08:00';
const CAMPUS_CLOSE = '19:00';
const MAX_DAYS_AHEAD = 60;

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMin = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const timesOverlap = (aStart, aEnd, bStart, bEnd) => toMin(aStart) < toMin(bEnd) && toMin(bStart) < toMin(aEnd);

// "2026-10-20" -> "TUE"
const weekdayCode = (date) => ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date(`${date}T00:00:00Z`).getUTCDay()];

// Today's date and time in the college's time zone
function collegeNow() {
  const tz = process.env.TIMEZONE || 'Asia/Kolkata';
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
  return { date, time };
}

const addDays = (date, n) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

function validateWhen({ date, startTime, endTime }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || Number.isNaN(new Date(`${date}T00:00:00Z`).getTime())) {
    throw new HttpError(400, 'Choose a valid date.');
  }
  if (!/^\d{2}:\d{2}$/.test(startTime || '') || !/^\d{2}:\d{2}$/.test(endTime || '')) {
    throw new HttpError(400, 'Choose a valid start time and duration.');
  }
  if (toMin(endTime) <= toMin(startTime)) throw new HttpError(400, 'End time must be after the start time.');
  if (toMin(startTime) < toMin(CAMPUS_OPEN) || toMin(endTime) > toMin(CAMPUS_CLOSE)) {
    throw new HttpError(400, `Rooms can be booked between ${CAMPUS_OPEN} and ${CAMPUS_CLOSE}.`);
  }
  if (weekdayCode(date) === 'SUN') throw new HttpError(400, 'The campus is closed on Sundays.');
  const now = collegeNow();
  if (date < now.date || (date === now.date && startTime <= now.time)) {
    throw new HttpError(400, 'That time has already passed. Choose a future date and time.');
  }
  if (date > addDays(now.date, MAX_DAYS_AHEAD)) {
    throw new HttpError(400, `Bookings can be made up to ${MAX_DAYS_AHEAD} days ahead.`);
  }
}

// Everything already happening on that date in the requested time window
async function busyAt(date, startTime, endTime, excludeBookingId) {
  const day = weekdayCode(date);
  const [slots, bookings] = await Promise.all([
    TimetableSlot.find({ day }).populate('subject', 'name').populate('classSection', 'name semester section').lean(),
    RoomBooking.find({ date, status: 'approved', ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}) }).lean(),
  ]);
  return {
    slots: slots.filter((s) => timesOverlap(startTime, endTime, s.startTime, s.endTime)),
    bookings: bookings.filter((b) => timesOverlap(startTime, endTime, b.startTime, b.endTime)),
  };
}

const roomFitsType = (room, roomType) => !roomType || roomType === 'Any' || room.type === roomType;

async function freeRooms({ date, startTime, endTime, attendees, roomType }, busy) {
  const b = busy || (await busyAt(date, startTime, endTime));
  const taken = new Set([...b.slots.map((s) => String(s.classroom)), ...b.bookings.map((x) => String(x.classroom))]);
  const rooms = await Classroom.find().lean();
  return rooms
    .filter((r) => !taken.has(String(r._id)) && r.capacity >= attendees && roomFitsType(r, roomType))
    // smallest room that fits, so big halls stay free for big groups
    .sort((a, c) => a.capacity - c.capacity);
}

// Teacher / division clashes for an extra lecture
function peopleConflicts({ teacherId, sectionId, userId, ownDivision }, busy) {
  const division = ownDivision ? 'Your division' : 'The division';
  const problems = [];
  if (userId) {
    const own = busy.bookings.find((x) => String(x.requestedBy) === String(userId));
    if (own) problems.push(`You already have "${own.title}" booked at that time.`);
  }
  if (teacherId) {
    const s = busy.slots.find((x) => String(x.teacher) === String(teacherId));
    if (s) problems.push(`You are teaching ${s.subject ? s.subject.name : 'a lecture'} at that time.`);
    const bk = busy.bookings.find((x) => x.teacher && String(x.teacher) === String(teacherId));
    if (bk && !problems.length) problems.push(`You already have "${bk.title}" at that time.`);
  }
  if (sectionId) {
    const s = busy.slots.find((x) => String(x.classSection && x.classSection._id ? x.classSection._id : x.classSection) === String(sectionId));
    if (s) problems.push(`${division} has ${s.subject ? s.subject.name : 'a lecture'} at that time.`);
    const bk = busy.bookings.find((x) => x.classSection && String(x.classSection) === String(sectionId));
    if (bk) problems.push(`${division} already has "${bk.title}" at that time.`);
  }
  return problems;
}

/**
 * Picks the best free room, or explains why there is none and suggests
 * up to 4 other times (same day first, then the next working days).
 */
async function allocate(request) {
  const { date, startTime, endTime } = request;
  const busy = await busyAt(date, startTime, endTime);
  const people = peopleConflicts(request, busy);
  const rooms = await freeRooms(request, busy);
  if (!people.length && rooms.length) return { room: rooms[0], alternatives: rooms.slice(1, 4) };

  const reason = people.length
    ? people[0]
    : `No ${request.roomType && request.roomType !== 'Any' ? request.roomType.toLowerCase() : 'room'} with ${request.attendees}+ seats is free at that time.`;
  return { room: null, reason, suggestions: await suggestTimes(request) };
}

async function suggestTimes(request) {
  const duration = toMin(request.endTime) - toMin(request.startTime);
  const out = [];
  const now = collegeNow();
  let date = request.date;
  for (let d = 0; d < 4 && out.length < 4; d += 1) {
    if (weekdayCode(date) !== 'SUN') {
      for (let t = toMin(CAMPUS_OPEN); t + duration <= toMin(CAMPUS_CLOSE) && out.length < 4; t += 30) {
        const startTime = fromMin(t);
        const endTime = fromMin(t + duration);
        if (date === request.date && startTime === request.startTime) continue;
        if (date < now.date || (date === now.date && startTime <= now.time)) continue;
        const busy = await busyAt(date, startTime, endTime);
        if (peopleConflicts(request, busy).length) continue;
        const rooms = await freeRooms({ ...request, date, startTime, endTime }, busy);
        if (rooms.length) out.push({ date, startTime, endTime, roomNumber: rooms[0].roomNumber });
      }
    }
    date = addDays(date, 1);
  }
  return out;
}

const niceDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const t12 = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
// "Tue, 20 Oct, 1:45 PM – 2:45 PM"
const describeWhen = (b) => `${niceDate(b.date)}, ${t12(b.startTime)} – ${t12(b.endTime)}`;

module.exports = {
  describeWhen,
  allocate, freeRooms, busyAt, validateWhen, collegeNow, weekdayCode, addDays, toMin, fromMin, timesOverlap,
};
