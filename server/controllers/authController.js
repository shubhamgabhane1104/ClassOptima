const User = require('../models/User');
const Student = require('../models/Student');
const ClassSection = require('../models/ClassSection');
const { signToken } = require('../middleware/authMiddleware');
const { asyncHandler, HttpError } = require('../middleware/errorHandler');

async function profileFor(user) {
  const base = { _id: user._id, name: user.name, email: user.email, role: user.role };
  if (user.role === 'professor' && user.teacher) {
    await user.populate('teacher');
    base.teacher = user.teacher;
  }
  if (user.role === 'student' && user.student) {
    await user.populate({ path: 'student', populate: { path: 'classSection', select: 'name department semester section studentCount' } });
    base.student = user.student;
  }
  return base;
}

// POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  res.json({ success: true, token: signToken(user), user: await profileFor(user) });
});

// POST /api/v1/auth/register  — student self-registration
exports.registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber, classSectionId } = req.body || {};
  if (!name || !email || !password || !rollNumber || !classSectionId) {
    throw new HttpError(400, 'Name, email, password, roll number and division are required.');
  }
  if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  const section = await ClassSection.findById(classSectionId);
  if (!section) throw new HttpError(400, 'Selected division does not exist.');
  if (await User.exists({ email: String(email).toLowerCase().trim() })) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const student = await Student.create({
    name, email, rollNumber, department: section.department, semester: section.semester, classSection: section._id,
  });
  const user = await User.create({ name, email, password, role: 'student', student: student._id });
  student.user = user._id;
  await student.save();

  res.status(201).json({ success: true, token: signToken(user), user: await profileFor(user) });
});

// GET /api/v1/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: await profileFor(req.user) });
});

// PATCH /api/v1/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) throw new HttpError(400, 'New password must be at least 6 characters.');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) throw new HttpError(401, 'Current password is incorrect.');
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated.' });
});
