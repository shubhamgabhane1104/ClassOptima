const mongoose = require('mongoose');
const { ROOM_TYPES } = require('../config/constants');

const classroomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    building: { type: String, default: 'Main Block', trim: true },
    floor: { type: Number, default: 0 },
    capacity: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ROOM_TYPES, default: 'Lecture Hall' },
    hasProjector: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Classroom', classroomSchema);
