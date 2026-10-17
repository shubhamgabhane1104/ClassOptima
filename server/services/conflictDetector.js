/**
 * Conflict Detector
 * -----------------
 * Checks a timetable slot against the hard and soft constraints of ClassOptima.
 * Works on plain objects so it can be used by the allocation engine, the
 * drag-and-drop validation endpoint and the admin "conflict matrix".
 *
 * A slot looks like:
 *   { _id, classSection, subject, teacher, classroom, day, slotIndex, duration }
 * where the four references are ids (strings or ObjectIds).
 *
 * `ctx` holds lookup maps: { teachers, rooms, sections, subjects } keyed by id string.
 */
const { isValidBlockStart, DAYS } = require('../config/constants');
const { isTeacherAvailable } = require('../models/Teacher');

const id = (v) => (v && v._id ? String(v._id) : String(v));

const periodsOf = (slot) => {
  const list = [];
  for (let i = 0; i < (slot.duration || 1); i += 1) list.push(slot.slotIndex + i);
  return list;
};

const overlaps = (a, b) =>
  a.day === b.day &&
  a.slotIndex < b.slotIndex + (b.duration || 1) &&
  b.slotIndex < a.slotIndex + (a.duration || 1);

const isLabSubject = (subject) => subject && subject.type === 'Practical/Lab';

/**
 * Room is suitable for subject + section (type and capacity rules).
 * Returns an array of problems (empty = suitable).
 */
function roomProblems(room, subject, section) {
  const problems = [];
  if (!room) return [{ type: 'ROOM_MISSING', message: 'The selected room does not exist.' }];
  if (section && room.capacity < section.studentCount) {
    problems.push({
      type: 'ROOM_CAPACITY',
      message: `${room.roomNumber} seats ${room.capacity}, but ${sectionLabel(section)} has ${section.studentCount} students.`,
    });
  }
  if (subject) {
    if (isLabSubject(subject)) {
      if (room.type === 'Lecture Hall') {
        problems.push({
          type: 'LAB_TYPE',
          message: `${subject.name} is a practical and must be held in a lab, not ${room.roomNumber} (Lecture Hall).`,
        });
      } else if (subject.preferredRoomType && room.type !== subject.preferredRoomType) {
        problems.push({
          type: 'LAB_TYPE',
          message: `${subject.name} needs a ${subject.preferredRoomType}, but ${room.roomNumber} is a ${room.type}.`,
        });
      }
    } else if (room.type !== 'Lecture Hall') {
      problems.push({
        type: 'LAB_TYPE',
        message: `${subject.name} is a theory lecture and should use a lecture hall, not ${room.roomNumber} (${room.type}).`,
      });
    }
  }
  return problems;
}

function sectionLabel(section) {
  if (!section) return 'this division';
  return `${section.department || section.name} Sem ${section.semester} Div ${section.section}`;
}

/**
 * Validate one slot against all other slots.
 * Returns { valid, conflicts: [...hard], warnings: [...soft] }
 */
function validateSlot(slot, otherSlots, ctx) {
  const conflicts = [];
  const warnings = [];
  const teacher = ctx.teachers.get(id(slot.teacher));
  const room = ctx.rooms.get(id(slot.classroom));
  const section = ctx.sections.get(id(slot.classSection));
  const subject = ctx.subjects.get(id(slot.subject));
  const duration = slot.duration || 1;

  if (!DAYS.includes(slot.day)) {
    conflicts.push({ type: 'INVALID_TIME', message: `Unknown day "${slot.day}".` });
  }
  if (!isValidBlockStart(slot.slotIndex, duration)) {
    conflicts.push({
      type: 'INVALID_TIME',
      message:
        duration > 1
          ? `A ${duration}-period block cannot start at period ${slot.slotIndex} (it would run past the day or across lunch recess).`
          : `Period ${slot.slotIndex} does not exist.`,
    });
  }

  const others = otherSlots.filter((o) => id(o._id) !== id(slot._id));

  for (const other of others) {
    if (!overlaps(slot, other)) continue;
    const otherSubject = ctx.subjects.get(id(other.subject));
    const otherSection = ctx.sections.get(id(other.classSection));
    const sameSection = id(other.classSection) === id(slot.classSection);
    const otherName = `${otherSubject ? otherSubject.name : 'another class'}${otherSection && !sameSection ? ` for ${sectionLabel(otherSection)}` : ''}`;
    if (id(other.teacher) === id(slot.teacher)) {
      conflicts.push({
        type: 'TEACHER_CLASH',
        message: `${teacher ? teacher.name : 'Teacher'} is already teaching ${otherName} at this time.`,
        withSlot: id(other._id),
      });
    }
    if (id(other.classroom) === id(slot.classroom)) {
      conflicts.push({
        type: 'ROOM_CLASH',
        message: `${room ? room.roomNumber : 'Room'} is already booked for ${otherName} at this time.`,
        withSlot: id(other._id),
      });
    }
    if (id(other.classSection) === id(slot.classSection)) {
      conflicts.push({
        type: 'SECTION_CLASH',
        message: `${sectionLabel(section)} already has ${otherName} at this time.`,
        withSlot: id(other._id),
      });
    }
  }

  conflicts.push(...roomProblems(room, subject, section));

  if (teacher) {
    const unavailable = periodsOf(slot).filter((p) => !isTeacherAvailable(teacher, slot.day, p));
    if (unavailable.length) {
      conflicts.push({
        type: 'TEACHER_UNAVAILABLE',
        message: `${teacher.name} is not available on ${slot.day} period ${unavailable.join(', ')}.`,
      });
    }

    // Soft: daily load and fatigue
    const sameDay = others.filter((o) => id(o.teacher) === id(slot.teacher) && o.day === slot.day);
    const dayHours = sameDay.reduce((sum, o) => sum + (o.duration || 1), 0) + duration;
    if (dayHours > (teacher.maxHoursPerDay || 99)) {
      warnings.push({
        type: 'TEACHER_DAILY_LOAD',
        message: `${teacher.name} would teach ${dayHours} hours on ${slot.day} (limit ${teacher.maxHoursPerDay}).`,
      });
    }
    const busy = new Set(sameDay.flatMap(periodsOf));
    periodsOf(slot).forEach((p) => busy.add(p));
    if (longestRun(busy) > 3) {
      warnings.push({
        type: 'TEACHER_FATIGUE',
        message: `${teacher.name} would teach more than 3 periods in a row on ${slot.day}.`,
      });
    }
  }

  // Soft: same theory subject twice in one day for a division
  if (subject && !isLabSubject(subject)) {
    const repeat = others.some(
      (o) => id(o.classSection) === id(slot.classSection) && o.day === slot.day && id(o.subject) === id(slot.subject)
    );
    if (repeat) {
      warnings.push({
        type: 'SUBJECT_REPEAT',
        message: `${subject.name} is already scheduled for this division on ${slot.day}.`,
      });
    }
  }

  return { valid: conflicts.length === 0, conflicts, warnings };
}

// Length of the longest run of consecutive periods, treating lunch recess as a break.
function longestRun(periodSet) {
  let best = 0;
  let run = 0;
  for (let p = 1; p <= 7; p += 1) {
    if (p === 5) run = 0; // recess between 4 and 5
    if (periodSet.has(p)) {
      run += 1;
      best = Math.max(best, run);
    } else run = 0;
  }
  return best;
}

/**
 * Check every slot of a timetable. Returns a de-duplicated list of hard
 * conflicts, each listing the slot ids involved, plus soft warnings.
 */
function detectAllConflicts(slots, ctx) {
  const conflicts = [];
  const warnings = [];
  const seen = new Set();
  for (const slot of slots) {
    const result = validateSlot(slot, slots, ctx);
    for (const c of result.conflicts) {
      const ids = [id(slot._id), c.withSlot].filter(Boolean).sort();
      const key = `${c.type}|${ids.join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      conflicts.push({ type: c.type, message: c.message, slotIds: ids, day: slot.day, slotIndex: slot.slotIndex });
    }
    for (const w of result.warnings) {
      const key = `${w.type}|${w.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push({ ...w, slotIds: [id(slot._id)] });
    }
  }
  return { conflicts, warnings };
}

module.exports = {
  validateSlot,
  detectAllConflicts,
  roomProblems,
  overlaps,
  periodsOf,
  longestRun,
  isLabSubject,
  id,
};
