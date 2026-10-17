const TimetableSlot = require('../models/TimetableSlot');
const { asyncHandler, HttpError } = require('../middleware/errorHandler');
const { blockTimes } = require('../config/constants');
const { runAllocation, getConflictReport, validateCandidate, populateSlot, bookingClashes } = require('../services/timetableService');

// POST /api/v1/allocation/generate
exports.generate = asyncHandler(async (req, res) => {
  const result = await runAllocation();
  if (result.message) throw new HttpError(400, result.message);
  const report = await getConflictReport();
  const clashes = await bookingClashes();
  res.json({
    success: true,
    complete: result.success,
    message: result.success
      ? `Timetable generated: all ${result.stats.placed} lectures placed with zero clashes.`
      : `Generated with ${result.unallocated.length} lecture(s) that could not be placed. See details.`,
    stats: result.stats,
    unallocated: result.unallocated,
    warnings: [...clashes, ...result.warnings, ...report.warnings.map((w) => w.message)],
    conflicts: report.conflicts,
  });
});

// GET /api/v1/allocation/timetable?section=&teacher=
exports.getTimetable = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.section) filter.classSection = req.query.section;
  if (req.query.teacher) filter.teacher = req.query.teacher;
  const slots = await populateSlot(TimetableSlot.find(filter).sort({ day: 1, slotIndex: 1 }));
  res.json({ success: true, data: slots });
});

// GET /api/v1/allocation/conflicts
exports.getConflicts = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await getConflictReport() });
});

function candidateFrom(existing, body) {
  const duration = body.duration || (existing && existing.duration) || 1;
  return {
    _id: existing ? existing._id : undefined,
    classSection: body.classSection || (existing && existing.classSection),
    subject: body.subject || (existing && existing.subject),
    teacher: body.teacher || (existing && existing.teacher),
    classroom: body.classroom || (existing && existing.classroom),
    day: body.day || (existing && existing.day),
    slotIndex: Number(body.slotIndex || (existing && existing.slotIndex)),
    duration,
  };
}

// POST /api/v1/allocation/validate  { slotId?, day, slotIndex, classroom?, teacher? ... }
// Used by drag-and-drop to check a move before saving it.
exports.validate = asyncHandler(async (req, res) => {
  const existing = req.body.slotId ? await TimetableSlot.findById(req.body.slotId).lean() : null;
  if (req.body.slotId && !existing) throw new HttpError(404, 'Slot not found.');
  const candidate = candidateFrom(existing, req.body);
  const result = await validateCandidate(candidate);
  res.json({ success: true, ...result });
});

// PATCH /api/v1/allocation/slots/:id  — move or edit a slot (validated)
exports.updateSlot = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findById(req.params.id);
  if (!slot) throw new HttpError(404, 'Slot not found.');
  const candidate = candidateFrom(slot.toObject(), req.body);
  const result = await validateCandidate(candidate);
  if (!result.valid && !req.body.force) {
    throw new HttpError(409, result.conflicts[0].message, { conflicts: result.conflicts, warnings: result.warnings });
  }
  Object.assign(slot, {
    day: candidate.day,
    slotIndex: candidate.slotIndex,
    classroom: candidate.classroom,
    teacher: candidate.teacher,
    ...blockTimes(candidate.slotIndex, candidate.duration),
    isPublished: false,
    // Manually placed slots are locked so the engine keeps them
    isLocked: req.body.isLocked !== undefined ? Boolean(req.body.isLocked) : true,
  });
  await slot.save();
  await TimetableSlot.updateMany({}, { $set: { isPublished: false } });
  res.json({ success: true, data: await populateSlot(TimetableSlot.findById(slot._id)), warnings: result.warnings });
});

// PATCH /api/v1/allocation/slots/:id/lock
exports.toggleLock = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findById(req.params.id);
  if (!slot) throw new HttpError(404, 'Slot not found.');
  slot.isLocked = req.body.isLocked !== undefined ? Boolean(req.body.isLocked) : !slot.isLocked;
  await slot.save();
  res.json({ success: true, data: { _id: slot._id, isLocked: slot.isLocked } });
});

// DELETE /api/v1/allocation/slots/:id
exports.deleteSlot = asyncHandler(async (req, res) => {
  const slot = await TimetableSlot.findByIdAndDelete(req.params.id);
  if (!slot) throw new HttpError(404, 'Slot not found.');
  res.json({ success: true, message: 'Slot removed.' });
});

// PATCH /api/v1/allocation/publish  { publish: true|false }
exports.publish = asyncHandler(async (req, res) => {
  const publish = req.body.publish !== false;
  const total = await TimetableSlot.countDocuments();
  if (!total) throw new HttpError(400, 'Nothing to publish yet. Generate a timetable first.');
  if (publish) {
    const report = await getConflictReport();
    if (report.conflicts.length && !req.body.force) {
      throw new HttpError(409, `Resolve ${report.conflicts.length} clash(es) before publishing.`, { conflicts: report.conflicts });
    }
  }
  await TimetableSlot.updateMany({}, { $set: { isPublished: publish } });
  res.json({
    success: true,
    message: publish ? 'Timetable published to all professors and students.' : 'Timetable withdrawn. Portals now show no timetable.',
    count: total,
  });
});
