/* eslint-disable no-console */
// End-to-end checks for room bookings and notifications.
// Needs the API running on localhost:5000 with fresh seed data:
//   npm run seed && npm start   (in another terminal)   then: npm run test:bookings
const assert = require('assert');

const BASE = process.env.API_URL || 'http://localhost:5000/api/v1';

async function call(method, path, token, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}
const login = async (email, password) => (await call('POST', '/auth/login', null, { email, password })).body.token;

// Next date (after today) that falls on the given weekday
function nextDate(code) {
  const want = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].indexOf(code);
  const d = new Date();
  d.setDate(d.getDate() + 1 + ((want - d.getDay() - 1 + 14) % 7));
  return d.toISOString().slice(0, 10);
}

let passed = 0;
async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

(async () => {
  console.log('Room booking API tests');
  const admin = await login('admin@classoptima.edu.in', 'admin123');
  const sharma = await login('amit.sharma@classoptima.edu.in', 'prof123');
  const rahul = await login('rahul.verma@classoptima.edu.in', 'student123'); // CE 5-A
  const ananya = await login('ananya.k@classoptima.edu.in', 'student123'); // CE 5-A
  const sid = await login('siddharth.pawar@classoptima.edu.in', 'student123'); // CE 5-B

  const date = nextDate('THU');
  const me = (await call('GET', '/auth/me', rahul)).body.user;
  const divA = me.student.classSection._id;
  const ttA = (await call('GET', `/student/timetable?section=${divA}`, rahul)).body.data.filter((s) => s.day === 'THU');
  const busyA = ttA[0];
  const sharmaSlots = (await call('GET', '/professor/schedule', sharma)).body.data;

  await test('student books a free room after college hours', async () => {
    const r = await call('POST', '/bookings', rahul, { title: 'Project work', attendees: 5, roomType: 'Any', date, startTime: '17:00', durationMinutes: 60, reason: 'Final year project meeting' });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
    assert.ok(r.body.data.classroom.capacity >= 5);
    assert.strictEqual(r.body.data.classroom.roomNumber, 'Room 105', 'smallest fitting room should be chosen');
  });

  await test('second group at the same time gets a different room', async () => {
    const r = await call('POST', '/bookings', sid, { title: 'Group study', attendees: 5, roomType: 'Lecture Hall', date, startTime: '17:00', durationMinutes: 60, reason: 'Study for the unit test' });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
    assert.notStrictEqual(r.body.data.classroom.roomNumber, 'Room 105');
  });

  await test("student cannot book during their own division's lecture, and gets suggestions", async () => {
    const r = await call('POST', '/bookings', ananya, { title: 'Group study', attendees: 4, date, startTime: busyA.startTime, durationMinutes: 60, reason: 'Study for the unit test' });
    assert.strictEqual(r.status, 409);
    assert.match(r.body.message, /Your division has/);
    assert.ok(r.body.details.suggestions.length > 0);
  });

  await test('past dates, Sundays and very long bookings are rejected', async () => {
    const past = await call('POST', '/bookings', rahul, { title: 'X', attendees: 3, date: '2020-01-06', startTime: '10:00', durationMinutes: 60, reason: 'Testing past date' });
    assert.strictEqual(past.status, 400);
    const sun = await call('POST', '/bookings', rahul, { title: 'X', attendees: 3, date: nextDate('SUN'), startTime: '10:00', durationMinutes: 60, reason: 'Testing sunday' });
    assert.strictEqual(sun.status, 400);
    const long = await call('POST', '/bookings', rahul, { title: 'X', attendees: 3, date, startTime: '09:00', endTime: '13:30', reason: 'Testing long booking' });
    assert.strictEqual(long.status, 400);
  });

  const divisions = (await call('GET', '/bookings/my-divisions', sharma)).body.data;
  const theDivA = divisions.find((d) => d._id === divA);
  const dbms = theDivA.subjects.find((s) => s.type === 'Theory');

  await test('professor cannot take an extra lecture while teaching another class', async () => {
    const teaching = sharmaSlots.find((s) => s.day === 'THU') || sharmaSlots[0];
    const d = teaching.day === 'THU' ? date : nextDate(teaching.day);
    const r = await call('POST', '/bookings', sharma, { kind: 'extra-lecture', classSectionId: divA, subjectId: dbms._id, date: d, startTime: teaching.startTime, durationMinutes: 60, reason: 'Revision session' });
    assert.strictEqual(r.status, 409);
  });

  let extraId;
  await test('professor books an extra lecture; the division gets notified', async () => {
    const r = await call('POST', '/bookings', sharma, { kind: 'extra-lecture', classSectionId: divA, subjectId: dbms._id, date, startTime: '18:00', durationMinutes: 60, reason: 'Doubt solving before the test' });
    assert.strictEqual(r.status, 201, JSON.stringify(r.body));
    assert.strictEqual(r.body.data.classroom.type, 'Lecture Hall');
    assert.ok(r.body.data.classroom.capacity >= theDivA.studentCount);
    extraId = r.body.data._id;
    const n = (await call('GET', '/notifications', ananya)).body;
    assert.ok(n.data.some((x) => x.type === 'extra-lecture' && x.booking === extraId), 'Div A student should be notified');
    const other = (await call('GET', '/notifications', sid)).body;
    assert.ok(!other.data.some((x) => x.booking === extraId), 'Div B student should not be notified');
  });

  await test("extra lecture appears in the students' and professor's timetable feed", async () => {
    const studentFeed = (await call('GET', '/bookings/feed', ananya)).body.data;
    assert.ok(studentFeed.some((b) => b._id === extraId));
    const profFeed = (await call('GET', '/bookings/feed', sharma)).body.data;
    assert.ok(profFeed.some((b) => b._id === extraId));
    const otherFeed = (await call('GET', '/bookings/feed', sid)).body.data;
    assert.ok(!otherFeed.some((b) => b._id === extraId));
  });

  await test('marking notifications as read clears the unread count', async () => {
    assert.ok((await call('GET', '/notifications', ananya)).body.unread > 0);
    await call('PATCH', '/notifications/read', ananya);
    assert.strictEqual((await call('GET', '/notifications', ananya)).body.unread, 0);
  });

  await test('only the owner or an admin can cancel; cancelling notifies the division', async () => {
    const forbidden = await call('PATCH', `/bookings/${extraId}/cancel`, rahul);
    assert.strictEqual(forbidden.status, 403);
    const ok = await call('PATCH', `/bookings/${extraId}/cancel`, sharma);
    assert.strictEqual(ok.status, 200);
    const n = (await call('GET', '/notifications', ananya)).body;
    assert.ok(n.data.some((x) => x.type === 'booking-cancelled' && x.booking === extraId));
    const feed = (await call('GET', '/bookings/feed', ananya)).body.data;
    assert.ok(!feed.some((b) => b._id === extraId));
  });

  await test('admin sees every booking and can cancel one (requester is notified)', async () => {
    const all = (await call('GET', '/bookings', admin)).body.data;
    assert.ok(all.length >= 3);
    const studentBooking = all.find((b) => b.kind === 'student-activity' && b.status === 'approved' && b.requesterName === 'Siddharth Pawar');
    const r = await call('PATCH', `/bookings/${studentBooking._id}/cancel`, admin);
    assert.strictEqual(r.status, 200);
    const n = (await call('GET', '/notifications', sid)).body.data;
    assert.ok(n.some((x) => x.type === 'booking-cancelled'));
  });

  await test('students cannot see the admin booking list', async () => {
    assert.strictEqual((await call('GET', '/bookings', rahul)).status, 403);
  });

  console.log(`\n${passed} tests passed`);
})().catch((err) => {
  console.error('\n✗', err.message);
  process.exit(1);
});
