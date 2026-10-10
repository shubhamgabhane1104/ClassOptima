const Classroom = require('../models/Classroom');
exports.getClassrooms = async (req, res) => {
  const classrooms = await Classroom.find();
  res.json({ success: true, data: classrooms });
};
exports.addClassroom = async (req, res) => {
  const classroom = await Classroom.create(req.body);
  res.status(201).json({ success: true, data: classroom });
};