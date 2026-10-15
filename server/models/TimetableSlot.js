
const mongoose = require('mongoose');

const timetableSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    required: true
  },
  slotIndex: {
    type: Number,
    min: 1,
    max: 6,
    required: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  timetableId: {
    type: String,
    required: true,
    index: true
  },
  teacherName: {
    type: String,
    required: true,
    trim: true
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);
