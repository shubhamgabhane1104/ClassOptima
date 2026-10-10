const mongoose = require('mongoose');
const classroomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  building: { type: String, default: 'Science Block' },
  capacity: { type: Number, required: true },
  type: { type: String, enum: ['Lecture Hall', 'Computer Lab', 'Hardware Lab'], default: 'Lecture Hall' },
  inChargeTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }
});
module.exports = mongoose.model('Classroom', classroomSchema);