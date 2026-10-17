/**
 * ClassOptima Allocation Engine
 * -----------------------------
 * Builds a weekly timetable as a Constraint Satisfaction Problem (CSP).
 *
 * Variables : every lecture "unit" that has to be placed
 *             (one per theory hour, one per 2-hour lab block)
 * Domain    : (day, starting period, room) combinations
 * Hard constraints (never broken):
 *   - Teacher clash, Room clash, Section clash
 *   - Room capacity >= section strength
 *   - Lab subjects only in matching lab rooms, theory only in lecture halls
 *   - Teacher availability, teacher daily-hour limit
 *   - Lab blocks never run across lunch recess
 * Soft constraints (minimised by a heuristic score):
 *   - Same theory subject twice in one day for a division
 *   - Teacher teaching more than 3 periods in a row
 *   - Gaps ("free periods") in a division's day
 *   - Uneven spread of lectures across the week
 *
 * Search: backtracking with MRV (Minimum Remaining Values) variable ordering
 * and least-penalty value ordering. If the search budget runs out, it falls
 * back to a greedy pass and reports what could not be placed.
 */
const { DAYS, PERIOD_COUNT, isValidBlockStart, blockTimes } = require('../config/constants');
const { isTeacherAvailable } = require('../models/Teacher');
const { roomProblems, isLabSubject, longestRun, id } = require('./conflictDetector');

const DEFAULT_STEP_LIMIT = 250000;

function buildUnits(sections, ctx, lockedSlots) {
  const units = [];
  const warnings = [];

  // How many hours each section+subject already has in locked slots
  const lockedHours = new Map();
  for (const s of lockedSlots) {
    const key = `${id(s.classSection)}|${id(s.subject)}`;
    lockedHours.set(key, (lockedHours.get(key) || 0) + (s.duration || 1));
  }

  for (const section of sections) {
    for (const course of section.courses || []) {
      const subject = ctx.subjects.get(id(course.subject));
      const teacher = ctx.teachers.get(id(course.teacher));
      if (!subject || !teacher) {
        warnings.push(`Skipped a course in ${section.name} Div ${section.section}: subject or teacher missing.`);
        continue;
      }
      const lab = isLabSubject(subject);
      const duration = lab ? 2 : 1;
      const already = lockedHours.get(`${id(section._id)}|${id(subject._id)}`) || 0;
      const remainingHours = Math.max(0, subject.weeklyHours - already);
      const count = Math.ceil(remainingHours / duration);
      for (let i = 0; i < count; i += 1) {
        units.push({
          key: `${id(section._id)}|${id(subject._id)}|${i}`,
          section,
          subject,
          teacher,
          duration,
          lab,
        });
      }
    }
  }
  return { units, warnings };
}

function createState(ctx) {
  return {
    teacherBusy: new Map(), // `${teacherId}|${day}|${p}` -> true
    roomBusy: new Map(),
    sectionBusy: new Map(),
    teacherDayHours: new Map(), // `${teacherId}|${day}` -> hours
    teacherWeekHours: new Map(),
    sectionDayPeriods: new Map(), // `${sectionId}|${day}` -> Set(periods)
    sectionDaySubjects: new Map(), // `${sectionId}|${day}` -> Map(subjectId -> count)
    teacherDayPeriods: new Map(),
    ctx,
  };
}

function setFlag(map, key, value) {
  if (value) map.set(key, true);
  else map.delete(key);
}

function inc(map, key, delta) {
  map.set(key, (map.get(key) || 0) + delta);
}

function getSet(map, key) {
  if (!map.has(key)) map.set(key, new Set());
  return map.get(key);
}

function apply(state, placement, add) {
  const t = id(placement.teacher);
  const r = id(placement.classroom);
  const s = id(placement.classSection);
  const subj = id(placement.subject);
  const { day, slotIndex, duration } = placement;
  for (let p = slotIndex; p < slotIndex + duration; p += 1) {
    setFlag(state.teacherBusy, `${t}|${day}|${p}`, add);
    setFlag(state.roomBusy, `${r}|${day}|${p}`, add);
    setFlag(state.sectionBusy, `${s}|${day}|${p}`, add);
    const sp = getSet(state.sectionDayPeriods, `${s}|${day}`);
    const tp = getSet(state.teacherDayPeriods, `${t}|${day}`);
    if (add) {
      sp.add(p);
      tp.add(p);
    } else {
      sp.delete(p);
      tp.delete(p);
    }
  }
  inc(state.teacherDayHours, `${t}|${day}`, add ? duration : -duration);
  inc(state.teacherWeekHours, t, add ? duration : -duration);
  const subjMap = state.sectionDaySubjects.get(`${s}|${day}`) || new Map();
  subjMap.set(subj, (subjMap.get(subj) || 0) + (add ? 1 : -1));
  state.sectionDaySubjects.set(`${s}|${day}`, subjMap);
}

// All (day, start) pairs that satisfy teacher availability and recess rules.
function timeDomain(unit) {
  const out = [];
  for (const day of DAYS) {
    for (let start = 1; start <= PERIOD_COUNT; start += 1) {
      if (!isValidBlockStart(start, unit.duration)) continue;
      let ok = true;
      for (let p = start; p < start + unit.duration; p += 1) {
        if (!isTeacherAvailable(unit.teacher, day, p)) ok = false;
      }
      if (ok) out.push({ day, start });
    }
  }
  return out;
}

function candidateRooms(unit, rooms) {
  return rooms
    .filter((room) => roomProblems(room, unit.subject, unit.section).length === 0)
    .sort((a, b) => a.capacity - b.capacity); // best fit first
}

function isFree(state, unit, day, start, roomId) {
  const t = id(unit.teacher._id);
  const s = id(unit.section._id);
  for (let p = start; p < start + unit.duration; p += 1) {
    if (state.teacherBusy.has(`${t}|${day}|${p}`)) return false;
    if (state.sectionBusy.has(`${s}|${day}|${p}`)) return false;
    if (roomId && state.roomBusy.has(`${roomId}|${day}|${p}`)) return false;
  }
  const dayHours = state.teacherDayHours.get(`${t}|${day}`) || 0;
  if (dayHours + unit.duration > (unit.teacher.maxHoursPerDay || 99)) return false;
  return true;
}

// Soft-constraint penalty for placing `unit` at (day, start). Lower is better.
function penalty(state, unit, day, start) {
  const s = id(unit.section._id);
  const t = id(unit.teacher._id);
  let score = 0;

  // Daily subject diversity
  const subjCount = (state.sectionDaySubjects.get(`${s}|${day}`) || new Map()).get(id(unit.subject._id)) || 0;
  if (subjCount > 0) score += unit.lab ? 6 : 12 * subjCount;

  // Compactness: gaps in the division's day after placement
  const periods = new Set(state.sectionDayPeriods.get(`${s}|${day}`) || []);
  for (let p = start; p < start + unit.duration; p += 1) periods.add(p);
  const sorted = [...periods].sort((a, b) => a - b);
  const span = sorted[sorted.length - 1] - sorted[0] + 1;
  const gaps = span - sorted.length; // lunch recess is not counted as a gap
  score += gaps * 3;

  // Spread the week: prefer lighter days for the division
  score += (periods.size - unit.duration) * 0.8;

  // Teacher fatigue: more than 3 consecutive periods
  const tPeriods = new Set(state.teacherDayPeriods.get(`${t}|${day}`) || []);
  for (let p = start; p < start + unit.duration; p += 1) tPeriods.add(p);
  if (longestRun(tPeriods) > 3) score += 8;

  // Days should start early: penalise empty periods before the first lecture
  score += (sorted[0] - 1) * 1.2;
  return score;
}

/**
 * @param {object} input
 *   sections: ClassSection docs (with courses)
 *   subjects, teachers, rooms: arrays of docs
 *   lockedSlots: existing locked TimetableSlot docs to keep
 * @returns {{ success, slots, unallocated, warnings, stats }}
 */
function solveTimetable(input, options = {}) {
  const started = Date.now();
  const stepLimit = options.stepLimit || DEFAULT_STEP_LIMIT;
  const ctx = {
    subjects: new Map(input.subjects.map((x) => [id(x._id), x])),
    teachers: new Map(input.teachers.map((x) => [id(x._id), x])),
    rooms: new Map(input.rooms.map((x) => [id(x._id), x])),
    sections: new Map(input.sections.map((x) => [id(x._id), x])),
  };
  const lockedSlots = input.lockedSlots || [];
  const { units, warnings } = buildUnits(input.sections, ctx, lockedSlots);
  const state = createState(ctx);
  lockedSlots.forEach((s) => apply(state, { ...s, duration: s.duration || 1 }, true));

  // Pre-compute static domains and check for impossible units
  const unallocated = [];
  const work = [];
  for (const unit of units) {
    unit.times = timeDomain(unit);
    unit.rooms = candidateRooms(unit, input.rooms);
    if (unit.rooms.length === 0) {
      unallocated.push({ ...describe(unit), reason: `No ${unit.lab ? 'lab' : 'lecture hall'} is large enough for ${unit.section.studentCount} students.` });
    } else if (unit.times.length === 0) {
      unallocated.push({ ...describe(unit), reason: `${unit.teacher.name} has no available periods.` });
    } else work.push(unit);
  }

  // Weekly workload check (warning only)
  const weekly = new Map();
  for (const u of units) inc(weekly, id(u.teacher._id), u.duration);
  for (const [tid, hours] of weekly) {
    const t = ctx.teachers.get(tid);
    if (t && hours > t.maxHoursPerWeek) {
      warnings.push(`${t.name} is assigned ${hours} hours/week, above their limit of ${t.maxHoursPerWeek}.`);
    }
  }

  const placements = [];
  let steps = 0;
  let backtracks = 0;
  let aborted = false;

  const remainingOptions = (unit) => {
    let n = 0;
    for (const { day, start } of unit.times) {
      if (!isFree(state, unit, day, start, null)) continue;
      for (const room of unit.rooms) if (isFree(state, unit, day, start, id(room._id))) n += 1;
    }
    return n;
  };

  const orderedValues = (unit) => {
    const values = [];
    for (const { day, start } of unit.times) {
      if (!isFree(state, unit, day, start, null)) continue;
      const room = unit.rooms.find((r) => isFree(state, unit, day, start, id(r._id)));
      if (!room) continue;
      values.push({ day, start, room, score: penalty(state, unit, day, start) });
    }
    values.sort((a, b) => a.score - b.score);
    return values;
  };

  const place = (unit, v) => {
    const p = {
      classSection: unit.section._id,
      subject: unit.subject._id,
      teacher: unit.teacher._id,
      classroom: v.room._id,
      day: v.day,
      slotIndex: v.start,
      duration: unit.duration,
      ...blockTimes(v.start, unit.duration),
    };
    apply(state, p, true);
    placements.push(p);
    return p;
  };

  const unplace = () => {
    const p = placements.pop();
    apply(state, p, false);
  };

  // Backtracking search with dynamic MRV ordering
  const pending = new Set(work);
  function search() {
    if (pending.size === 0) return true;
    if (steps > stepLimit) {
      aborted = true;
      return false;
    }
    // MRV: choose the unit with the fewest remaining options; labs win ties
    let best = null;
    let bestCount = Infinity;
    for (const u of pending) {
      const c = remainingOptions(u);
      if (c < bestCount || (c === bestCount && u.lab && !best.lab)) {
        best = u;
        bestCount = c;
        if (c === 0) break;
      }
    }
    if (bestCount === 0) return false;

    pending.delete(best);
    for (const v of orderedValues(best).slice(0, 12)) {
      steps += 1;
      place(best, v);
      if (search()) return true;
      unplace();
      backtracks += 1;
      if (aborted) break;
    }
    pending.add(best);
    return false;
  }

  let success = search();

  if (!success) {
    // Greedy fallback: keep the best partial schedule and list what is left
    while (placements.length) unplace();
    const order = [...work].sort((a, b) => a.times.length * a.rooms.length - b.times.length * b.rooms.length || b.duration - a.duration);
    for (const unit of order) {
      const values = orderedValues(unit);
      if (values.length) place(unit, values[0]);
      else unallocated.push({ ...describe(unit), reason: 'No free period left for this teacher, room and division together.' });
    }
  }

  success = success && unallocated.length === 0;

  return {
    success,
    slots: placements,
    unallocated,
    warnings,
    stats: {
      totalUnits: units.length,
      placed: placements.length,
      steps,
      backtracks,
      usedFallback: !success && aborted,
      durationMs: Date.now() - started,
    },
  };
}

function describe(unit) {
  return {
    section: `${unit.section.name} Sem ${unit.section.semester} Div ${unit.section.section}`,
    subject: unit.subject.name,
    teacher: unit.teacher.name,
    duration: unit.duration,
  };
}

module.exports = { solveTimetable, buildUnits };
