/* eslint-disable no-console */
// Run: npm test   (no database needed — tests the engine on the sample college data)
const assert = require('assert');
const { Types } = require('mongoose');
const { solveTimetable } = require('../services/allocationEngine');
const { detectAllConflicts, validateSlot } = require('../services/conflictDetector');
const data = require('../seed/sampleCollegeData');

const oid = () => new Types.ObjectId();

function buildSample(extraSections = 0) {
  const subjects = data.subjects.map((s) => ({ _id: oid(), ...s }));
  const byCode = Object.fromEntries(subjects.map((s) => [s.code, s]));
  const teachers = data.teachers.map(({ key, ...t }) => ({ _id: oid(), key, availability: [], ...t }));
  const byKey = Object.fromEntries(teachers.map((t) => [t.key, t]));
  const rooms = data.classrooms.map((r) => ({ _id: oid(), ...r }));
  const sections = [];
  const defs = [...data.sections];
  for (let i = 0; i < extraSections; i += 1) defs.push({ ...data.sections[2], section: String.fromCharCode(66 + i) });
  for (const s of defs) {
    sections.push({
      _id: oid(), name: s.name, department: s.department, semester: s.semester, section: s.section, studentCount: s.studentCount,
      courses: s.courses.map(([code, tk]) => ({ subject: byCode[code]._id, teacher: byKey[tk]._id })),
    });
  }
  return { subjects, teachers, rooms, sections };
}

const ctxOf = (input) => ({
  teachers: new Map(input.teachers.map((x) => [String(x._id), x])),
  rooms: new Map(input.rooms.map((x) => [String(x._id), x])),
  subjects: new Map(input.subjects.map((x) => [String(x._id), x])),
  sections: new Map(input.sections.map((x) => [String(x._id), x])),
});

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('ClassOptima allocation engine tests');

test('places every lecture of the sample college', () => {
  const input = buildSample();
  const result = solveTimetable(input);
  assert.strictEqual(result.unallocated.length, 0, JSON.stringify(result.unallocated));
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.slots.length, result.stats.totalUnits);
});

test('produces zero hard conflicts', () => {
  const input = buildSample();
  const { slots } = solveTimetable(input);
  const withIds = slots.map((s) => ({ ...s, _id: oid() }));
  const report = detectAllConflicts(withIds, ctxOf(input));
  assert.deepStrictEqual(report.conflicts, []);
});

test('respects teacher availability (Dr. Iyer not on Monday 1-2, Prof. Patil not on Saturday)', () => {
  const input = buildSample();
  input.teachers.find((t) => t.key === 'iyer').availability = [{ day: 'MON', availableSlots: [3, 4, 5, 6, 7] }];
  input.teachers.find((t) => t.key === 'patil').availability = [{ day: 'SAT', availableSlots: [] }];
  const { slots } = solveTimetable(input);
  const iyer = String(input.teachers.find((t) => t.key === 'iyer')._id);
  const patil = String(input.teachers.find((t) => t.key === 'patil')._id);
  assert.ok(!slots.some((s) => String(s.teacher) === iyer && s.day === 'MON' && s.slotIndex <= 2));
  assert.ok(!slots.some((s) => String(s.teacher) === patil && s.day === 'SAT'));
});

test('labs are 2-hour blocks in labs that never cross lunch recess', () => {
  const input = buildSample();
  const { slots } = solveTimetable(input);
  const subjects = ctxOf(input).subjects;
  const rooms = ctxOf(input).rooms;
  for (const s of slots) {
    const subj = subjects.get(String(s.subject));
    if (subj.type === 'Practical/Lab') {
      assert.strictEqual(s.duration, 2);
      assert.notStrictEqual(rooms.get(String(s.classroom)).type, 'Lecture Hall');
      assert.ok(!(s.slotIndex === 4), 'lab crossed recess');
    } else {
      assert.strictEqual(rooms.get(String(s.classroom)).type, 'Lecture Hall');
    }
  }
});

test('room capacity is respected (Room 105 seats 40, never used for 60+ divisions)', () => {
  const input = buildSample();
  const { slots } = solveTimetable(input);
  const small = String(input.rooms.find((r) => r.roomNumber === 'Room 105')._id);
  assert.ok(!slots.some((s) => String(s.classroom) === small));
});

test('conflict detector catches a teacher, room and division clash', () => {
  const input = buildSample();
  const { slots } = solveTimetable(input);
  const withIds = slots.map((s) => ({ ...s, _id: oid() }));
  const a = withIds[0];
  const b = withIds.find((s) => String(s.classSection) === String(a.classSection) && s !== a);
  const moved = { ...b, day: a.day, slotIndex: a.slotIndex, classroom: a.classroom, teacher: a.teacher, duration: 1 };
  const result = validateSlot(moved, withIds, ctxOf(input));
  const types = result.conflicts.map((c) => c.type);
  assert.ok(types.includes('TEACHER_CLASH'));
  assert.ok(types.includes('ROOM_CLASH'));
  assert.ok(types.includes('SECTION_CLASH'));
});

test('keeps locked slots fixed and schedules around them', () => {
  const input = buildSample();
  const first = solveTimetable(input).slots[0];
  const locked = { ...first, _id: oid(), day: 'SAT', slotIndex: 7, duration: first.duration };
  if (locked.duration === 2) locked.slotIndex = 6;
  const result = solveTimetable({ ...input, lockedSlots: [locked] });
  const all = [...result.slots.map((s) => ({ ...s, _id: oid() })), locked];
  assert.deepStrictEqual(detectAllConflicts(all, ctxOf(input)).conflicts, []);
  assert.strictEqual(result.slots.length, result.stats.totalUnits);
});

test('reports unplaceable lectures instead of hanging (impossible case)', () => {
  const input = buildSample();
  input.rooms = input.rooms.filter((r) => r.type === 'Lecture Hall'); // remove every lab
  const result = solveTimetable(input);
  assert.strictEqual(result.success, false);
  assert.ok(result.unallocated.length > 0);
});

test('scales to 6 divisions within a few seconds', () => {
  const input = buildSample(3);
  input.teachers.forEach((t) => { t.maxHoursPerWeek = 40; t.maxHoursPerDay = 6; });
  const result = solveTimetable(input);
  assert.ok(result.stats.durationMs < 10000);
  const withIds = result.slots.map((s) => ({ ...s, _id: oid() }));
  assert.deepStrictEqual(detectAllConflicts(withIds, ctxOf(input)).conflicts, []);
  console.log(`      (${result.stats.placed}/${result.stats.totalUnits} placed in ${result.stats.durationMs} ms)`);
});

console.log(`\n${passed} tests passed`);
