// All REST routes, mounted under /api/v1
const express = require('express');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const auth = require('../controllers/authController');
const resources = require('../controllers/resourceController');
const allocation = require('../controllers/allocationController');
const portal = require('../controllers/portalController');
const exporter = require('../controllers/exportController');

const router = express.Router();
const adminOnly = [verifyToken, requireRole('admin')];

// ---- Auth ----
router.post('/auth/login', auth.login);
router.post('/auth/register', auth.registerStudent);
router.get('/auth/me', verifyToken, auth.me);
router.patch('/auth/password', verifyToken, auth.changePassword);

// ---- Public lookups ----
router.get('/public/sections', resources.listSectionsPublic);

// ---- Admin: academic resources ----
router.get('/stats', adminOnly, resources.stats);

router.route('/teachers').get(adminOnly, resources.listTeachers).post(adminOnly, resources.createTeacher);
router.route('/teachers/:id').put(adminOnly, resources.updateTeacher).delete(adminOnly, resources.deleteTeacher);

router.route('/classrooms').get(adminOnly, resources.listClassrooms).post(adminOnly, resources.createClassroom);
router.route('/classrooms/:id').put(adminOnly, resources.updateClassroom).delete(adminOnly, resources.deleteClassroom);

router.route('/subjects').get(adminOnly, resources.listSubjects).post(adminOnly, resources.createSubject);
router.route('/subjects/:id').put(adminOnly, resources.updateSubject).delete(adminOnly, resources.deleteSubject);

router.route('/sections').get(adminOnly, resources.listSections).post(adminOnly, resources.createSection);
router.route('/sections/:id').put(adminOnly, resources.updateSection).delete(adminOnly, resources.deleteSection);

router.get('/students', adminOnly, resources.listStudents);
router.delete('/students/:id', adminOnly, resources.deleteStudent);

// ---- Admin: allocation engine ----
router.post('/allocation/generate', adminOnly, allocation.generate);
router.get('/allocation/timetable', adminOnly, allocation.getTimetable);
router.get('/allocation/conflicts', adminOnly, allocation.getConflicts);
router.post('/allocation/validate', adminOnly, allocation.validate);
router.patch('/allocation/publish', adminOnly, allocation.publish);
router.patch('/allocation/slots/:id', adminOnly, allocation.updateSlot);
router.patch('/allocation/slots/:id/lock', adminOnly, allocation.toggleLock);
router.delete('/allocation/slots/:id', adminOnly, allocation.deleteSlot);

// ---- Professor portal ----
const professorOnly = [verifyToken, requireRole('professor')];
router.get('/professor/schedule', professorOnly, portal.professorSchedule);
router.get('/professor/workload', professorOnly, portal.professorWorkload);
router.route('/professor/profile').get(professorOnly, portal.professorProfile).put(professorOnly, portal.updateProfessorProfile);

// ---- Student portal (any logged-in user can view a division's published timetable) ----
router.get('/student/timetable', verifyToken, portal.studentTimetable);

// ---- Room bookings & notifications ----
const booking = require('../controllers/bookingController');
const requester = [verifyToken, requireRole('student', 'professor')];
router.get('/bookings', adminOnly, booking.all);
router.post('/bookings', requester, booking.create);
router.get('/bookings/mine', requester, booking.mine);
router.get('/bookings/feed', requester, booking.feed);
router.get('/bookings/availability', verifyToken, booking.availability);
router.get('/bookings/my-divisions', professorOnly, booking.myDivisions);
router.patch('/bookings/:id/cancel', verifyToken, booking.cancel);
router.get('/notifications', verifyToken, booking.notifications);
router.patch('/notifications/read', verifyToken, booking.markRead);

// ---- PDF export ----
router.get('/export/pdf/teacher/:teacherId', verifyToken, exporter.teacherPdf);
router.get('/export/pdf/:sectionId', verifyToken, exporter.sectionPdf);

module.exports = router;
