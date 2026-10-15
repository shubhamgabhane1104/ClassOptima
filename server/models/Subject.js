const mongoose = require('mongoose');
const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Theory', 'Practical/Lab'], default: 'Theory' },
  weeklyHours: { type: Number, required: true },
  semester: { type: Number, required: true }
});
module.exports = mongoose.model('Subject', subjectSchema);