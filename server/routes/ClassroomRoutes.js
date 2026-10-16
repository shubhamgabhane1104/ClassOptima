const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');

// GET all classrooms (populating assigned teacher details)
router.get('/', async (req, res) => {
  try {
    const classrooms = await Classroom.find().populate('inChargeTeacher', 'name email department');
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a classroom
router.post('/', async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    res.status(201).json(classroom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;