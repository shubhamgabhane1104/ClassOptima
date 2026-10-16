const express = require('express');
const { getSubjects, addSubject } = require('../controllers/subjectController');
const { getSections, addSection } = require('../controllers/sectionController');

const router = express.Router();

router.route('/subjects').get(getSubjects).post(addSubject);
router.route('/sections').get(getSections).post(addSection);

module.exports = router;
