// Room requests from students and professors, plus notifications.
const RoomBooking = require('../models/RoomBooking');
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const ClassSection = require('../models/ClassSection');
const Subject = require('../models/Subject');
const { asyncHandler, HttpError } = require('../middleware/errorHandler');
const booking = require('../services/bookingService');

const MAX_HOURS = 3;
const MAX_ACTIVE_STUDENT_BOOKINGS = 3;

const populateBooking = (q) =>
  q.populate('classroom', 'roomNumber building floor type capacity')
    .populate('classSection', 'name department semester section studentCount')
    .populate('subject', 'code name type')
    .populate('teacher', 'name');

const when = booking.describeWhen;

async function studentProfile(user) {
  const s = await Student.findById(user.student);
  if (!s) throw new HttpError(404, 'No student profile is linked to this account.');
  return s;
}

function endFrom(body) {
  if (body.endTime) return body.endTime;
  const mins = Number(body.durationMinutes);
  if (!body.startTime || !mins) return '';
  return booking.fromMin(booking.toMin(body.startTime) + mins);
}

// POST /api/v1/bookings
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const startTime = body.startTime;
  const endTime = endFrom(body);
  booking.validateWhen({ date: body.date, startTime, endTime });
  if (booking.toMin(endTime) - booking.toMin(startTime) > MAX_HOURS * 60) {
    throw new HttpError(400, `A booking can be at most ${MAX_HOURS} hours long.`);
  }
  const reason = String(body.reason || '').trim();
  if (reason.length < 5) throw new HttpError(400, 'Tell the office briefly why you need the room.');

  const doc = {
    requestedBy: req.user._id,
    requesterName: req.user.name,
    requesterRole: req.user.role,
    reason,
    date: body.date,
    startTime,
    endTime,
    roomType: body.roomType || 'Any',
  };
  const request = { date: body.date, startTime, endTime, roomType: doc.roomType, userId: req.user._id };

  if (req.user.role === 'student') {
    const student = await studentProfile(req.user);
    const active = await RoomBooking.countDocuments({ requestedBy: req.user._id, status: 'approved', date: { $gte: booking.collegeNow().date } });
    if (active >= MAX_ACTIVE_STUDENT_BOOKINGS) {
      throw new HttpError(400, `You can hold at most ${MAX_ACTIVE_STUDENT_BOOKINGS} upcoming bookings. Cancel one you no longer need.`);
    }
    const attendees = Number(body.attendees);
    if (!attendees || attendees < 1 || attendees > 200) throw new HttpError(400, 'Enter how many students will attend (1–200).');
    Object.assign(doc, { kind: 'student-activity', title: String(body.title || 'Student activity').trim().slice(0, 120), attendees });
    Object.assign(request, { attendees, sectionId: student.classSection, ownDivision: true });
  } else {
    const teacherId = req.user.teacher;
    if (body.kind === 'extra-lecture') {
      const section = await ClassSection.findById(body.classSectionId);
      if (!section) throw new HttpError(400, 'Choose the division for the extra lecture.');
      const course = section.courses.find((c) => String(c.teacher) === String(teacherId) && String(c.subject) === String(body.subjectId));
      if (!course) throw new HttpError(403, 'You can only take extra lectures for subjects you teach to that division.');
      const subject = await Subject.findById(body.subjectId);
      const lab = subject.type === 'Practical/Lab';
      doc.announcement = `${req.user.name} has scheduled an extra ${lab ? 'practical' : 'lecture'} of ${subject.name}`;
      Object.assign(doc, {
        kind: 'extra-lecture',
        title: `Extra ${lab ? 'practical' : 'lecture'}: ${subject.name}`,
        classSection: section._id,
        subject: subject._id,
        teacher: teacherId,
        attendees: section.studentCount,
        roomType: body.roomType && body.roomType !== 'Any' ? body.roomType : (lab ? subject.preferredRoomType || 'Computer Lab' : 'Lecture Hall'),
      });
      Object.assign(request, { attendees: section.studentCount, roomType: doc.roomType, teacherId, sectionId: section._id });
    } else {
      const attendees = Number(body.attendees);
      if (!attendees || attendees < 1 || attendees > 200) throw new HttpError(400, 'Enter how many people will attend (1–200).');
      Object.assign(doc, {
        kind: 'faculty-meeting',
        title: String(body.title || 'Faculty meeting').trim().slice(0, 120),
        teacher: teacherId,
        attendees,
      });
      Object.assign(request, { attendees, teacherId });
    }
  }

  const result = await booking.allocate(request);
  if (!result.room) {
    throw new HttpError(409, result.reason, { suggestions: result.suggestions });
  }

  const { announcement, ...fields } = doc;
  const created = await RoomBooking.create({ ...fields, classroom: result.room._id, status: 'approved' });
  const room = result.room;
  const where = `${room.roomNumber} (${room.building}${room.floor ? `, floor ${room.floor}` : ''})`;

  await Notification.create({
    user: req.user._id,
    type: 'booking-confirmed',
    title: `${room.roomNumber} booked`,
    message: `${created.title}: ${when(created)} in ${where}.`,
    booking: created._id,
  });
  if (created.kind === 'extra-lecture') {
    await Notification.create({
      classSection: created.classSection,
      type: 'extra-lecture',
      title: created.title,
      message: `${announcement} on ${when(created)} in ${where}.`,
      booking: created._id,
    });
  }

  res.status(201).json({
    success: true,
    message: `${room.roomNumber} is booked for you: ${when(created)}.`,
    data: await populateBooking(RoomBooking.findById(created._id)),
  });
});

// GET /api/v1/bookings/availability?date&startTime&endTime|durationMinutes&attendees&roomType
exports.availability = asyncHandler(async (req, res) => {
  const q = req.query;
  const endTime = endFrom(q);
  booking.validateWhen({ date: q.date, startTime: q.startTime, endTime });
  const rooms = await booking.freeRooms({ date: q.date, startTime: q.startTime, endTime, attendees: Number(q.attendees) || 1, roomType: q.roomType || 'Any' });
  res.json({ success: true, data: rooms.map((r) => ({ _id: r._id, roomNumber: r.roomNumber, type: r.type, capacity: r.capacity, building: r.building })) });
});

// GET /api/v1/bookings/mine
exports.mine = asyncHandler(async (req, res) => {
  const list = await populateBooking(RoomBooking.find({ requestedBy: req.user._id }).sort({ date: -1, startTime: -1 }).limit(50));
  res.json({ success: true, data: list, today: booking.collegeNow().date });
});

// GET /api/v1/bookings/feed — approved upcoming bookings that belong on this user's timetable
exports.feed = asyncHandler(async (req, res) => {
  const from = booking.collegeNow().date;
  const or = [{ requestedBy: req.user._id }];
  if (req.user.role === 'student') {
    const s = await studentProfile(req.user);
    or.push({ classSection: s.classSection });
  }
  if (req.user.role === 'professor') or.push({ teacher: req.user.teacher });
  const list = await populateBooking(RoomBooking.find({ status: 'approved', date: { $gte: from }, $or: or }).sort({ date: 1, startTime: 1 }));
  res.json({ success: true, data: list, today: from });
});

// GET /api/v1/bookings — admin overview
exports.all = asyncHandler(async (req, res) => {
  const list = await populateBooking(RoomBooking.find().sort({ date: -1, startTime: -1 }).limit(200));
  res.json({ success: true, data: list, today: booking.collegeNow().date });
});

// GET /api/v1/bookings/my-divisions — divisions and subjects a professor teaches (for the extra lecture form)
exports.myDivisions = asyncHandler(async (req, res) => {
  const sections = await ClassSection.find({ 'courses.teacher': req.user.teacher }).populate('courses.subject', 'code name type');
  res.json({
    success: true,
    data: sections.map((s) => ({
      _id: s._id,
      label: `${s.name}, Sem ${s.semester} Div ${s.section}`,
      studentCount: s.studentCount,
      subjects: s.courses.filter((c) => String(c.teacher) === String(req.user.teacher) && c.subject).map((c) => c.subject),
    })),
  });
});

// PATCH /api/v1/bookings/:id/cancel — the requester or an admin
exports.cancel = asyncHandler(async (req, res) => {
  const b = await RoomBooking.findById(req.params.id);
  if (!b) throw new HttpError(404, 'Booking not found.');
  const isOwner = String(b.requestedBy) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new HttpError(403, 'You can only cancel your own bookings.');
  if (b.status === 'cancelled') throw new HttpError(400, 'This booking is already cancelled.');
  b.status = 'cancelled';
  b.cancelledBy = isOwner ? 'requester' : 'admin';
  await b.save();

  if (!isOwner) {
    await Notification.create({
      user: b.requestedBy, type: 'booking-cancelled', title: 'Booking cancelled by the office',
      message: `${b.title} on ${when(b)} was cancelled by the admin office.`, booking: b._id,
    });
  }
  if (b.kind === 'extra-lecture') {
    await Notification.create({
      classSection: b.classSection, type: 'booking-cancelled', title: `Cancelled: ${b.title}`,
      message: `${b.title} on ${when(b)} has been cancelled.`, booking: b._id,
    });
  }
  res.json({ success: true, message: 'Booking cancelled and the room released.' });
});

// ---------- Notifications ----------
async function notificationFilter(user) {
  const or = [{ user: user._id }];
  if (user.role === 'student' && user.student) {
    const s = await Student.findById(user.student).select('classSection');
    if (s) or.push({ classSection: s.classSection });
  }
  return { $or: or };
}

// GET /api/v1/notifications
exports.notifications = asyncHandler(async (req, res) => {
  const list = await Notification.find(await notificationFilter(req.user)).sort({ createdAt: -1 }).limit(30).lean();
  const me = String(req.user._id);
  const data = list.map((n) => ({ ...n, read: (n.readBy || []).some((u) => String(u) === me), readBy: undefined }));
  res.json({ success: true, data, unread: data.filter((n) => !n.read).length });
});

// PATCH /api/v1/notifications/read — mark everything as read
exports.markRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(await notificationFilter(req.user), { $addToSet: { readBy: req.user._id } });
  res.json({ success: true });
});
