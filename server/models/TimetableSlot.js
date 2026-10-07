const mongoose = require("mongoose");

const timetableSlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY"
        ],
        required: true
    },

    slotIndex: {
        type: Number,
        required: true
    },

    subjectName: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model(
    "TimetableSlot",
    timetableSlotSchema
);