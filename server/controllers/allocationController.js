const { randomUUID } = require('crypto');
const { solveTimetable } = require('../services/allocationEngine');
const { checkClash } = require('../services/conflictDetector');
const TimetableSlot = require('../models/TimetableSlot');

exports.generateSchedule = async (req, res) => {
  try {
    const samplePool = [
      {
        subjectName: 'Database Systems',
        teacher: 'Dr. Amit Sharma',
        type: 'theory'
      },
      {
        subjectName: 'Operating Systems',
        teacher: 'Prof. Vikas Patil',
        type: 'theory'
      }
    ];

    const sampleRooms = [
      { roomNumber: 'Room 402' },
      { roomNumber: 'Lab 3' }
    ];

    const result = solveTimetable(samplePool, sampleRooms);

    return res.json({
      success: result.success,
      count: result.allocated.length,
      data: result.allocated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.publishTimetable = async (req, res) => {
  try {
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide a non-empty slots array.'
      });
    }

    const validDays = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY'
    ];

    const validatedSlots = [];

    for (const slot of slots) {
      if (!slot || typeof slot !== 'object' || Array.isArray(slot)) {
        return res.status(400).json({
          success: false,
          message: 'Each slot must be an object.'
        });
      }

      const { day, slotIndex, subjectName, teacherName, roomNumber } = slot;

      if (
        !validDays.includes(day) ||
        !Number.isInteger(slotIndex) ||
        slotIndex < 1 ||
        slotIndex > 6 ||
        typeof subjectName !== 'string' ||
        !subjectName.trim() ||
        typeof teacherName !== 'string' ||
        !teacherName.trim() ||
        typeof roomNumber !== 'string' ||
        !roomNumber.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Each slot needs a valid day, slotIndex (1-6), subjectName, teacherName and roomNumber.'
        });
      }

      const normalizedSlot = {
        day,
        slotIndex,
        subjectName: subjectName.trim(),
        teacherName: teacherName.trim(),
        roomNumber: roomNumber.trim()
      };

      const clash = checkClash({
        teacher: normalizedSlot.teacherName,
        room: normalizedSlot.roomNumber,
        day: normalizedSlot.day,
        slotIndex: normalizedSlot.slotIndex,
        existingSlots: validatedSlots
      });

      if (!clash.valid) {
        return res.status(409).json({
          success: false,
          message: clash.error
        });
      }

      validatedSlots.push(normalizedSlot);
    }

    const timetableId = randomUUID();

    const documents = validatedSlots.map((slot) => ({
      ...slot,
      timetableId,
      isPublished: true
    }));

    const createdSlots = await TimetableSlot.insertMany(documents);

    return res.status(201).json({
      success: true,
      message: 'Timetable published successfully.',
      timetableId,
      count: createdSlots.length,
      data: createdSlots
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.unpublishTimetable = async (req, res) => {
  try {
    const { timetableId } = req.params;

    if (!timetableId) {
      return res.status(400).json({
        success: false,
        message: 'Timetable ID is required.'
      });
    }

    const result = await TimetableSlot.updateMany(
      { timetableId, isPublished: true },
      { $set: { isPublished: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No published timetable found for this ID.'
      });
    }

    return res.json({
      success: true,
      message: 'Timetable unpublished successfully.',
      timetableId,
      count: result.modifiedCount
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
