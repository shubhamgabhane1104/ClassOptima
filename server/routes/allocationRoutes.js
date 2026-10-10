
const express = require('express');

const { generateSchedule } = require('../controllers/allocationController');

const router = express.Router();

router.post('/generate', generateSchedule);

module.exports = router;
