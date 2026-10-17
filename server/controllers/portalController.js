// Professor and student portal endpoints.
const Teacher = require('../models/Teacher');
const ClassSection = require('../models/ClassSection');
const TimetableSlot = require('../models/TimetableSlot');
const { asyncHandler, HttpError } = require('../middleware/errorHandler');
const { populateSlot } = require('../services/timetableService');
const { DAYS } = require('../config/constants');

const TZ = () => process.env.TIMEZONE || 'Asia/Kolkata';

// Current day code (MON..SUN) and "HH:MM" in the college's time zone
function nowInCollege() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ(), weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return { day: get('weekday').toUpperCase().slice(0, 3), time: `${get('hour')}:${get('minute')}` };
}

function liveStatus(slots) {
  const { day, time } = nowInCollege();
  const today = slots.filter((s) => s.day === day).sort((a, b) => a.slotIndex - b.slotIndex);
  const current = today.find((s) => s.startTime <= time && time < s.endTime) || null;
  const next = today.find((s) => s.startTime > time) || null;
  return { day, time, isWorkingDay: DAYS.includes(day), current, next, todayCount: today.length };
}

async function teacherFor(req) {
  const teacher = await Teacher.findById(req.user.teacher).populate('qualifiedSubjects', 'code name type');
  if (!teacher) throw new HttpError(404, 'No faculty profile is linked to this account.');
  return teacher;
}

// GET /api/v1/professor/schedule
exports.professorSchedule = asyncHandler(async (req, res) => {
  const teacher = await teacherFor(req);
  const slots = await populateSlot(TimetableSlot.find({ teacher: teacher._id, isPublished: true }));
  res.json({ success: true, published: slots.length > 0, data: slots, live: liveStatus(slots) });
});

// GET /api/v1/professor/workload
exports.professorWorkload = asyncHandler(async (req, res) => {
  const teacher = await teacherFor(req);
  const slots = await populateSlot(TimetableSlot.find({ teacher: teacher._id, isPublished: true }));
  const sections = await ClassSection.find({ 'courses.teacher': teacher._id })
    .populate('courses.subject', 'code name type weeklyHours');

  const byDay = Object.fromEntries(DAYS.map((d) => [d, 0]));
  let theoryHours = 0;
  let labHours = 0;
  for (const s of slots) {
    byDay[s.day] += s.duration;
    if (s.subject && s.subject.type === 'Practical/Lab') labHours += s.duration;
    else theoryHours += s.duration;
  }
  const assignments = [];
  for (const sec of sections) {
    for (const c of sec.courses) {
      if (String(c.teacher) === String(teacher._id) && c.subject) {
        assignments.push({
          division: `${sec.name} Sem ${sec.semester} Div ${sec.section}`,
          subject: c.subject,
        });
      }
    }
  }
  res.json({
    success: true,
    data: {
      assignedHours: theoryHours + labHours,
      maxHoursPerWeek: teacher.maxHoursPerWeek,
      theoryHours,
      labHours,
      divisions: new Set(slots.map((s) => String(s.classSection && s.classSection._id))).size,
      byDay,
      assignments,
    },
  });
});

// GET /api/v1/professor/profile
exports.professorProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await teacherFor(req) });
});

// PUT /api/v1/professor/profile — a professor can update cabin, phone and availability
exports.updateProfessorProfile = asyncHandler(async (req, res) => {
  const teacher = await teacherFor(req);
  ['cabinNumber', 'phone', 'availability'].forEach((k) => {
    if (req.body[k] !== undefined) teacher[k] = req.body[k];
  });
  await teacher.save();
  res.json({ success: true, data: teacher, message: 'Profile updated. Availability changes apply at the next timetable generation.' });
});

// GET /api/v1/student/timetable?section=<id>
// Students see their own division by default; anyone may pass ?section to view another division.
exports.studentTimetable = asyncHandler(async (req, res) => {
  let sectionId = req.query.section;
  if (!sectionId && req.user && req.user.role === 'student') {
    await req.user.populate('student');
    sectionId = req.user.student && req.user.student.classSection;
  }
  if (!sectionId) throw new HttpError(400, 'Choose a division to view its timetable.');
  const section = await ClassSection.findById(sectionId).populate('classTeacher', 'name cabinNumber');
  if (!section) throw new HttpError(404, 'Division not found.');
  const slots = await populateSlot(TimetableSlot.find({ classSection: section._id, isPublished: true }));
  res.json({ success: true, published: slots.length > 0, section, data: slots, live: liveStatus(slots) });
});

exports.liveStatus = liveStatus;
