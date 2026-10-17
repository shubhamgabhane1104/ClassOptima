const mongoose = require('mongoose');
const { ROOM_TYPES } = require('../config/constants');

// A one-off room booking on a specific date: a student meeting/study session
// or an extra lecture by a professor.
const roomBookingSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterRole: { type: String, enum: ['student', 'professor'], required: true },
    requesterName: { type: String, required: true },

    kind: { type: String, enum: ['extra-lecture', 'student-activity', 'faculty-meeting'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },

    // Extra lectures: which division and subject
    classSection: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', index: true },

    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true }, // YYYY-MM-DD
    startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    attendees: { type: Number, required: true, min: 1 },
    roomType: { type: String, enum: ['Any', ...ROOM_TYPES], default: 'Any' },

    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
    status: { type: String, enum: ['approved', 'cancelled'], default: 'approved', index: true },
    cancelledBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RoomBooking', roomBookingSchema);
