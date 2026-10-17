// Glue between MongoDB and the pure allocation / conflict functions.
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const ClassSection = require('../models/ClassSection');
const TimetableSlot = require('../models/TimetableSlot');
const { solveTimetable } = require('./allocationEngine');
const { detectAllConflicts, validateSlot, id } = require('./conflictDetector');

async function loadResources() {
  const [teachers, rooms, subjects, sections] = await Promise.all([
    Teacher.find().lean(),
    Classroom.find().lean(),
    Subject.find().lean(),
    ClassSection.find().lean(),
  ]);
  return { teachers, rooms, subjects, sections };
}

function buildContext({ teachers, rooms, subjects, sections }) {
  return {
    teachers: new Map(teachers.map((x) => [id(x._id), x])),
    rooms: new Map(rooms.map((x) => [id(x._id), x])),
    subjects: new Map(subjects.map((x) => [id(x._id), x])),
    sections: new Map(sections.map((x) => [id(x._id), x])),
  };
}

// Runs the CSP engine for every division and replaces all unlocked slots.
async function runAllocation() {
  const resources = await loadResources();
  if (!resources.sections.length) {
    return { success: false, message: 'Add at least one class division with subjects before generating.', slots: [], unallocated: [], warnings: [], stats: {} };
  }
  const lockedSlots = await TimetableSlot.find({ isLocked: true }).lean();
  const result = solveTimetable({ ...resources, lockedSlots });

  await TimetableSlot.deleteMany({ isLocked: false });
  if (result.slots.length) {
    await TimetableSlot.insertMany(result.slots.map((s) => ({ ...s, isPublished: false, isLocked: false })));
  }
  // A regenerated timetable is a draft until the admin publishes it again
  await TimetableSlot.updateMany({}, { $set: { isPublished: false } });
  return result;
}

async function getConflictReport() {
  const resources = await loadResources();
  const slots = await TimetableSlot.find().lean();
  return detectAllConflicts(slots, buildContext(resources));
}

async function validateCandidate(candidate) {
  const resources = await loadResources();
  const slots = await TimetableSlot.find().lean();
  return validateSlot(candidate, slots, buildContext(resources));
}

const populateSlot = (query) =>
  query
    .populate('subject', 'code name type')
    .populate('teacher', 'name department cabinNumber')
    .populate('classroom', 'roomNumber building floor type capacity')
    .populate('classSection', 'name department semester section studentCount');

module.exports = { loadResources, buildContext, runAllocation, getConflictReport, validateCandidate, populateSlot };
