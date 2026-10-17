const mongoose = require('mongoose');
const { SUBJECT_TYPES, ROOM_TYPES } = require('../config/constants');

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: SUBJECT_TYPES, default: 'Theory' },
    // Theory: number of 1-hour lectures per week.
    // Practical/Lab: total lab hours per week, scheduled as 2-hour blocks.
    weeklyHours: { type: Number, required: true, min: 1, max: 10 },
    semester: { type: Number, required: true, min: 1, max: 8 },
    department: { type: String, default: '', trim: true },
    credits: { type: Number, default: 3 },
    // For labs: which kind of lab room is needed (e.g. "Computer Lab")
    preferredRoomType: { type: String, enum: [...ROOM_TYPES, ''], default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
