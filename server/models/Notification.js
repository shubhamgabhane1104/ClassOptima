const mongoose = require('mongoose');

// A notification goes either to one user, or to every student of a division.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    classSection: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', index: true },
    type: { type: String, enum: ['booking-confirmed', 'extra-lecture', 'booking-cancelled', 'general'], default: 'general' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomBooking' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
