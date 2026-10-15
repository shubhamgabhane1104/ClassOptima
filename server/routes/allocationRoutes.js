
const express = require('express');

const {
  generateSchedule,
  publishTimetable,
  unpublishTimetable
} = require('../controllers/allocationController');

const router = express.Router();

router.post('/generate', generateSchedule);
router.post('/publish', publishTimetable);
router.patch('/:timetableId/unpublish', unpublishTimetable);

module.exports = router;
