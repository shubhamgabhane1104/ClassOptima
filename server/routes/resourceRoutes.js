const express = require('express');
const { getTeachers, addTeacher } = require('../controllers/teacherController');
const { getClassrooms, addClassroom } = require('../controllers/classroomController');
const router = express.Router();
router.route('/teachers').get(getTeachers).post(addTeacher);
router.route('/classrooms').get(getClassrooms).post(addClassroom);