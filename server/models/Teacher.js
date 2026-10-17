const mongoose = require('mongoose');
const { DAYS } = require('../config/constants');

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    // Period numbers (1-7) the teacher is available on that day
    availableSlots: [{ type: Number, min: 1, max: 7 }],
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    designation: { type: String, default: 'Assistant Professor', trim: true },
    cabinNumber: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    maxHoursPerWeek: { type: Number, default: 20, min: 1 },
    maxHoursPerDay: { type: Number, default: 5, min: 1 },
    // Empty array = available at all times
    availability: [availabilitySchema],
    qualifiedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Returns true when the teacher can teach `day` at `period`.
teacherSchema.methods.isAvailable = function isAvailable(day, period) {
  return isTeacherAvailable(this, day, period);
};

function isTeacherAvailable(teacher, day, period) {
  if (!teacher.availability || teacher.availability.length === 0) return true;
  const entry = teacher.availability.find((a) => a.day === day);
  if (!entry) return true; // day not configured → available
  return entry.availableSlots.includes(period);
}

const Teacher = mongoose.model('Teacher', teacherSchema);
Teacher.isTeacherAvailable = isTeacherAvailable;

module.exports = Teacher;
