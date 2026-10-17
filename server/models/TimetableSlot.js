const mongoose = require('mongoose');
const { DAYS } = require('../config/constants');

const timetableSlotSchema = new mongoose.Schema(
  {
    classSection: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    day: { type: String, enum: DAYS, required: true },
    // First period of the block (1-7)
    slotIndex: { type: Number, min: 1, max: 7, required: true },
    // Number of consecutive periods (1 for theory, 2 for a lab block)
    duration: { type: Number, min: 1, max: 3, default: 1 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    // Locked slots are kept when the engine is re-run
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);
