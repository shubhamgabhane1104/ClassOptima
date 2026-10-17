/* eslint-disable no-console */
// Usage: npm run seed
// Clears the database, loads the sample college, generates and publishes a timetable.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const Subject = require('../models/Subject');
const ClassSection = require('../models/ClassSection');
const TimetableSlot = require('../models/TimetableSlot');
const { runAllocation } = require('../services/timetableService');
const data = require('./sampleCollegeData');

async function seed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/classoptima';
  await mongoose.connect(uri);
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  await Promise.all([
    User.deleteMany({}), Teacher.deleteMany({}), Student.deleteMany({}), Classroom.deleteMany({}),
    Subject.deleteMany({}), ClassSection.deleteMany({}), TimetableSlot.deleteMany({}),
  ]);
  console.log('Cleared old data');

  await User.create({ ...data.admin, password: data.DEMO_PASSWORDS.admin, role: 'admin' });

  const subjectByCode = {};
  for (const s of data.subjects) subjectByCode[s.code] = await Subject.create(s);

  const teacherByKey = {};
  for (const { key, ...t } of data.teachers) {
    const qualified = data.sections.flatMap((sec) => sec.courses.filter(([, tk]) => tk === key).map(([code]) => subjectByCode[code]._id));
    const teacher = await Teacher.create({ ...t, qualifiedSubjects: [...new Set(qualified.map(String))] });
    const user = await User.create({ name: t.name, email: t.email, password: data.DEMO_PASSWORDS.professor, role: 'professor', teacher: teacher._id });
    teacher.user = user._id;
    await teacher.save();
    teacherByKey[key] = teacher;
  }

  await Classroom.insertMany(data.classrooms);

  const sectionDocs = [];
  for (const s of data.sections) {
    sectionDocs.push(
      await ClassSection.create({
        ...s,
        classTeacher: teacherByKey[s.classTeacher]._id,
        courses: s.courses.map(([code, tk]) => ({ subject: subjectByCode[code]._id, teacher: teacherByKey[tk]._id })),
      })
    );
  }

  for (const [name, email, rollNumber, idx] of data.students) {
    const sec = sectionDocs[idx];
    const student = await Student.create({ name, email, rollNumber, department: sec.department, semester: sec.semester, classSection: sec._id });
    const user = await User.create({ name, email, password: data.DEMO_PASSWORDS.student, role: 'student', student: student._id });
    student.user = user._id;
    await student.save();
  }
  console.log(`Loaded ${data.teachers.length} teachers, ${data.classrooms.length} rooms, ${data.subjects.length} subjects, ${sectionDocs.length} divisions, ${data.students.length} students`);

  const result = await runAllocation();
  await TimetableSlot.updateMany({}, { $set: { isPublished: true } });
  console.log(`Timetable generated: ${result.stats.placed}/${result.stats.totalUnits} lectures placed in ${result.stats.durationMs} ms and published`);
  if (result.unallocated.length) console.log('Could not place:', result.unallocated);

  console.log('\nDemo logins:');
  console.log(`  Admin     ${data.admin.email} / ${data.DEMO_PASSWORDS.admin}`);
  console.log(`  Professor ${data.teachers[0].email} / ${data.DEMO_PASSWORDS.professor}`);
  console.log(`  Student   ${data.students[0][1]} / ${data.DEMO_PASSWORDS.student}`);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error('Seeding failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
