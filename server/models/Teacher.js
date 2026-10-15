const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    cabinNumber: {
      type: String,
      default: 'Room 304',
      trim: true,
    },
    maxHoursPerWeek: {
      type: Number,
      default: 20,
      min: 0,
    },
    availability: [
      {
        day: {
          type: String,
          enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
          required: true,
        },
        availableSlots: [
          {
            type: Number,
          },
        ],
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt timestamps
  }
);

module.exports = mongoose.model('Teacher', teacherSchema);
