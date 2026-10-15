const Teacher = require('../models/Teacher');
exports.getTeachers = async (req, res) => {
  const teachers = await Teacher.find();
  res.json({ success: true, data: teachers });
};
exports.addTeacher = async (req, res) => {
  const teacher = await Teacher.create(req.body);
  res.status(201).json({ success: true, data: teacher });
};