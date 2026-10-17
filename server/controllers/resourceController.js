// CRUD for the academic resources managed by the admin:
// teachers, classrooms, subjects, class sections (divisions) and students.
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const ClassSection = require('../models/ClassSection');
const TimetableSlot = require('../models/TimetableSlot');
const { asyncHandler, HttpError } = require('../middleware/errorHandler');

const DEFAULT_PROFESSOR_PASSWORD = 'prof123';

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// ---------- Teachers ----------
const TEACHER_FIELDS = ['name', 'email', 'department', 'designation', 'cabinNumber', 'phone', 'maxHoursPerWeek', 'maxHoursPerDay', 'availability', 'qualifiedSubjects'];

exports.listTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().sort({ name: 1 }).populate('qualifiedSubjects', 'code name');
  res.json({ success: true, data: teachers });
});

exports.createTeacher = asyncHandler(async (req, res) => {
  const body = pick(req.body, TEACHER_FIELDS);
  if (await User.exists({ email: String(body.email || '').toLowerCase() })) {
    throw new HttpError(409, 'A user with this email already exists.');
  }
  const teacher = await Teacher.create(body);
  const password = req.body.password || DEFAULT_PROFESSOR_PASSWORD;
  const user = await User.create({ name: teacher.name, email: teacher.email, password, role: 'professor', teacher: teacher._id });
  teacher.user = user._id;
  await teacher.save();
  res.status(201).json({ success: true, data: teacher, message: `Login created for ${teacher.email} (password: ${password})` });
});

exports.updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, pick(req.body, TEACHER_FIELDS), { new: true, runValidators: true });
  if (!teacher) throw new HttpError(404, 'Teacher not found.');
  if (teacher.user) await User.findByIdAndUpdate(teacher.user, { name: teacher.name, email: teacher.email });
  res.json({ success: true, data: teacher });
});

exports.deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) throw new HttpError(404, 'Teacher not found.');
  const used = await ClassSection.exists({ 'courses.teacher': teacher._id });
  if (used) throw new HttpError(409, 'This teacher is assigned to a division. Reassign their subjects in Divisions first.');
  await TimetableSlot.deleteMany({ teacher: teacher._id });
  if (teacher.user) await User.findByIdAndDelete(teacher.user);
  await teacher.deleteOne();
  res.json({ success: true, message: 'Teacher removed.' });
});

// ---------- Classrooms ----------
const ROOM_FIELDS = ['roomNumber', 'building', 'floor', 'capacity', 'type', 'hasProjector'];

exports.listClassrooms = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Classroom.find().sort({ type: 1, roomNumber: 1 }) });
});

exports.createClassroom = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await Classroom.create(pick(req.body, ROOM_FIELDS)) });
});

exports.updateClassroom = asyncHandler(async (req, res) => {
  const room = await Classroom.findByIdAndUpdate(req.params.id, pick(req.body, ROOM_FIELDS), { new: true, runValidators: true });
  if (!room) throw new HttpError(404, 'Classroom not found.');
  res.json({ success: true, data: room });
});

exports.deleteClassroom = asyncHandler(async (req, res) => {
  const room = await Classroom.findByIdAndDelete(req.params.id);
  if (!room) throw new HttpError(404, 'Classroom not found.');
  const removed = await TimetableSlot.deleteMany({ classroom: room._id });
  res.json({ success: true, message: `Room removed${removed.deletedCount ? ` along with ${removed.deletedCount} timetable slot(s). Re-run allocation.` : '.'}` });
});

// ---------- Subjects ----------
const SUBJECT_FIELDS = ['code', 'name', 'type', 'weeklyHours', 'semester', 'department', 'credits', 'preferredRoomType'];

exports.listSubjects = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await Subject.find().sort({ semester: 1, code: 1 }) });
});

exports.createSubject = asyncHandler(async (req, res) => {
  res.status(201).json({ success: true, data: await Subject.create(pick(req.body, SUBJECT_FIELDS)) });
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, pick(req.body, SUBJECT_FIELDS), { new: true, runValidators: true });
  if (!subject) throw new HttpError(404, 'Subject not found.');
  res.json({ success: true, data: subject });
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) throw new HttpError(404, 'Subject not found.');
  await ClassSection.updateMany({}, { $pull: { courses: { subject: subject._id } } });
  await Teacher.updateMany({}, { $pull: { qualifiedSubjects: subject._id } });
  await TimetableSlot.deleteMany({ subject: subject._id });
  res.json({ success: true, message: 'Subject removed from catalog, divisions and timetable.' });
});

// ---------- Class sections (divisions) ----------
const SECTION_FIELDS = ['name', 'department', 'semester', 'section', 'studentCount', 'classTeacher', 'courses'];

const populateSection = (q) =>
  q.populate('courses.subject', 'code name type weeklyHours').populate('courses.teacher', 'name').populate('classTeacher', 'name');

exports.listSections = asyncHandler(async (req, res) => {
  const sections = await populateSection(ClassSection.find().sort({ department: 1, semester: 1, section: 1 }));
  res.json({ success: true, data: sections });
});

// Public: minimal list for the student division picker / registration
exports.listSectionsPublic = asyncHandler(async (req, res) => {
  const sections = await ClassSection.find().select('name department semester section').sort({ department: 1, semester: 1, section: 1 });
  res.json({ success: true, data: sections });
});

exports.createSection = asyncHandler(async (req, res) => {
  const section = await ClassSection.create(pick(req.body, SECTION_FIELDS));
  res.status(201).json({ success: true, data: await populateSection(ClassSection.findById(section._id)) });
});

exports.updateSection = asyncHandler(async (req, res) => {
  const section = await ClassSection.findByIdAndUpdate(req.params.id, pick(req.body, SECTION_FIELDS), { new: true, runValidators: true });
  if (!section) throw new HttpError(404, 'Division not found.');
  // Keep teacher "qualified subjects" in sync with course assignments
  for (const c of section.courses) {
    await Teacher.updateOne({ _id: c.teacher }, { $addToSet: { qualifiedSubjects: c.subject } });
  }
  res.json({ success: true, data: await populateSection(ClassSection.findById(section._id)) });
});

exports.deleteSection = asyncHandler(async (req, res) => {
  const count = await Student.countDocuments({ classSection: req.params.id });
  if (count) throw new HttpError(409, `${count} student(s) belong to this division. Move or remove them first.`);
  const section = await ClassSection.findByIdAndDelete(req.params.id);
  if (!section) throw new HttpError(404, 'Division not found.');
  await TimetableSlot.deleteMany({ classSection: section._id });
  res.json({ success: true, message: 'Division removed.' });
});

// ---------- Students ----------
exports.listStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().sort({ rollNumber: 1 }).populate('classSection', 'name department semester section');
  res.json({ success: true, data: students });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new HttpError(404, 'Student not found.');
  if (student.user) await User.findByIdAndDelete(student.user);
  res.json({ success: true, message: 'Student removed.' });
});

// ---------- Dashboard stats ----------
exports.stats = asyncHandler(async (req, res) => {
  const [teachers, classrooms, labs, subjects, sections, students, slots, published, locked] = await Promise.all([
    Teacher.countDocuments(),
    Classroom.countDocuments(),
    Classroom.countDocuments({ type: { $ne: 'Lecture Hall' } }),
    Subject.countDocuments(),
    ClassSection.countDocuments(),
    Student.countDocuments(),
    TimetableSlot.countDocuments(),
    TimetableSlot.countDocuments({ isPublished: true }),
    TimetableSlot.countDocuments({ isLocked: true }),
  ]);
  const lastSlot = await TimetableSlot.findOne().sort({ updatedAt: -1 }).select('updatedAt');
  res.json({
    success: true,
    data: {
      teachers, classrooms, labs, subjects, sections, students, slots, locked,
      status: slots === 0 ? 'empty' : published === slots ? 'published' : 'draft',
      lastUpdated: lastSlot ? lastSlot.updatedAt : null,
    },
  });
});
