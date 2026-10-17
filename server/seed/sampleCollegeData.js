// Sample college dataset used by `npm run seed`.
// Edit freely: names, rooms and subjects here are what the demo starts with.

const DEMO_PASSWORDS = {
  admin: 'admin123',
  professor: 'prof123',
  student: 'student123',
};

const admin = { name: 'Admin Office', email: 'admin@classoptima.edu.in' };

const teachers = [
  { key: 'sharma', name: 'Dr. Amit Sharma', email: 'amit.sharma@classoptima.edu.in', department: 'Computer Engineering', designation: 'Professor & HOD', cabinNumber: 'Cabin 304, Block B', maxHoursPerWeek: 18, maxHoursPerDay: 4 },
  { key: 'iyer', name: 'Dr. Meera Iyer', email: 'meera.iyer@classoptima.edu.in', department: 'Computer Engineering', designation: 'Associate Professor', cabinNumber: 'Cabin 305, Block B', maxHoursPerWeek: 16, maxHoursPerDay: 4,
    // Not available Monday periods 1-2 (example availability restriction)
    availability: [{ day: 'MON', availableSlots: [3, 4, 5, 6, 7] }] },
  { key: 'patil', name: 'Prof. Vikas Patil', email: 'vikas.patil@classoptima.edu.in', department: 'Computer Engineering', designation: 'Assistant Professor', cabinNumber: 'Cabin 306, Block B', maxHoursPerWeek: 18, maxHoursPerDay: 4,
    // Does not work Saturdays
    availability: [{ day: 'SAT', availableSlots: [] }] },
  { key: 'kulkarni', name: 'Dr. Sneha Kulkarni', email: 'sneha.kulkarni@classoptima.edu.in', department: 'Computer Engineering', designation: 'Associate Professor', cabinNumber: 'Cabin 307, Block B', maxHoursPerWeek: 18, maxHoursPerDay: 4 },
  { key: 'joshi', name: 'Prof. Kiran Joshi', email: 'kiran.joshi@classoptima.edu.in', department: 'Computer Engineering', designation: 'Assistant Professor', cabinNumber: 'Cabin 210, Block A', maxHoursPerWeek: 16, maxHoursPerDay: 4 },
  { key: 'deshpande', name: 'Prof. Rohan Deshpande', email: 'rohan.deshpande@classoptima.edu.in', department: 'Information Technology', designation: 'Assistant Professor', cabinNumber: 'Cabin 212, Block A', maxHoursPerWeek: 18, maxHoursPerDay: 5 },
  { key: 'deshmukh', name: 'Dr. Priya Deshmukh', email: 'priya.deshmukh@classoptima.edu.in', department: 'Information Technology', designation: 'Associate Professor', cabinNumber: 'Cabin 214, Block A', maxHoursPerWeek: 16, maxHoursPerDay: 4 },
  { key: 'rao', name: 'Prof. Anil Rao', email: 'anil.rao@classoptima.edu.in', department: 'Information Technology', designation: 'Assistant Professor', cabinNumber: 'Cabin 215, Block A', maxHoursPerWeek: 16, maxHoursPerDay: 4 },
  { key: 'gokhale', name: 'Dr. Neha Gokhale', email: 'neha.gokhale@classoptima.edu.in', department: 'Information Technology', designation: 'Professor', cabinNumber: 'Cabin 216, Block A', maxHoursPerWeek: 16, maxHoursPerDay: 4 },
];

const classrooms = [
  { roomNumber: 'Room 301', building: 'Academic Block B', floor: 3, capacity: 72, type: 'Lecture Hall', hasProjector: true },
  { roomNumber: 'Room 302', building: 'Academic Block B', floor: 3, capacity: 72, type: 'Lecture Hall', hasProjector: true },
  { roomNumber: 'Room 402', building: 'Academic Block B', floor: 4, capacity: 66, type: 'Lecture Hall', hasProjector: true },
  { roomNumber: 'Room 105', building: 'Academic Block A', floor: 1, capacity: 40, type: 'Lecture Hall', hasProjector: false },
  { roomNumber: 'Seminar Hall', building: 'Main Building', floor: 0, capacity: 150, type: 'Lecture Hall', hasProjector: true },
  { roomNumber: 'Computer Lab 1', building: 'Academic Block B', floor: 2, capacity: 70, type: 'Computer Lab', hasProjector: true },
  { roomNumber: 'Computer Lab 2', building: 'Academic Block B', floor: 2, capacity: 70, type: 'Computer Lab', hasProjector: true },
  { roomNumber: 'Electronics Lab', building: 'Academic Block A', floor: 1, capacity: 70, type: 'Hardware Lab', hasProjector: false },
];

const subjects = [
  // Computer Engineering — Semester 5
  { code: 'CE501', name: 'Database Management Systems', type: 'Theory', weeklyHours: 3, semester: 5, department: 'Computer Engineering', credits: 3 },
  { code: 'CE502', name: 'Theory of Computation', type: 'Theory', weeklyHours: 3, semester: 5, department: 'Computer Engineering', credits: 3 },
  { code: 'CE503', name: 'Operating Systems', type: 'Theory', weeklyHours: 3, semester: 5, department: 'Computer Engineering', credits: 3 },
  { code: 'CE504', name: 'Computer Networks', type: 'Theory', weeklyHours: 3, semester: 5, department: 'Computer Engineering', credits: 3 },
  { code: 'CE505', name: 'Software Engineering', type: 'Theory', weeklyHours: 2, semester: 5, department: 'Computer Engineering', credits: 2 },
  { code: 'CE506L', name: 'DBMS Laboratory', type: 'Practical/Lab', weeklyHours: 2, semester: 5, department: 'Computer Engineering', credits: 1, preferredRoomType: 'Computer Lab' },
  { code: 'CE507L', name: 'Computer Networks Laboratory', type: 'Practical/Lab', weeklyHours: 2, semester: 5, department: 'Computer Engineering', credits: 1, preferredRoomType: 'Computer Lab' },
  // Information Technology — Semester 3
  { code: 'IT301', name: 'Data Structures', type: 'Theory', weeklyHours: 3, semester: 3, department: 'Information Technology', credits: 3 },
  { code: 'IT302', name: 'Discrete Mathematics', type: 'Theory', weeklyHours: 3, semester: 3, department: 'Information Technology', credits: 3 },
  { code: 'IT303', name: 'Digital Electronics', type: 'Theory', weeklyHours: 3, semester: 3, department: 'Information Technology', credits: 3 },
  { code: 'IT304', name: 'Object Oriented Programming', type: 'Theory', weeklyHours: 3, semester: 3, department: 'Information Technology', credits: 3 },
  { code: 'IT305', name: 'Engineering Economics', type: 'Theory', weeklyHours: 2, semester: 3, department: 'Information Technology', credits: 2 },
  { code: 'IT306L', name: 'Data Structures Laboratory', type: 'Practical/Lab', weeklyHours: 2, semester: 3, department: 'Information Technology', credits: 1, preferredRoomType: 'Computer Lab' },
  { code: 'IT307L', name: 'Digital Electronics Laboratory', type: 'Practical/Lab', weeklyHours: 2, semester: 3, department: 'Information Technology', credits: 1, preferredRoomType: 'Hardware Lab' },
];

// courses: [subjectCode, teacherKey]
const sections = [
  {
    name: 'B.E. Computer', department: 'Computer Engineering', semester: 5, section: 'A', studentCount: 64, classTeacher: 'sharma',
    courses: [['CE501', 'sharma'], ['CE502', 'iyer'], ['CE503', 'patil'], ['CE504', 'kulkarni'], ['CE505', 'joshi'], ['CE506L', 'sharma'], ['CE507L', 'kulkarni']],
  },
  {
    name: 'B.E. Computer', department: 'Computer Engineering', semester: 5, section: 'B', studentCount: 62, classTeacher: 'kulkarni',
    courses: [['CE501', 'sharma'], ['CE502', 'iyer'], ['CE503', 'patil'], ['CE504', 'kulkarni'], ['CE505', 'joshi'], ['CE506L', 'deshpande'], ['CE507L', 'deshpande']],
  },
  {
    name: 'S.E. Information Technology', department: 'Information Technology', semester: 3, section: 'A', studentCount: 60, classTeacher: 'deshmukh',
    courses: [['IT301', 'deshmukh'], ['IT302', 'rao'], ['IT303', 'gokhale'], ['IT304', 'deshpande'], ['IT305', 'joshi'], ['IT306L', 'deshmukh'], ['IT307L', 'gokhale']],
  },
];

// [name, email, rollNumber, sectionIndex]
const students = [
  ['Rahul Verma', 'rahul.verma@classoptima.edu.in', 'CE5A-012', 0],
  ['Ananya Kulkarni', 'ananya.k@classoptima.edu.in', 'CE5A-027', 0],
  ['Siddharth Pawar', 'siddharth.pawar@classoptima.edu.in', 'CE5B-008', 1],
  ['Sakshi Jadhav', 'sakshi.jadhav@classoptima.edu.in', 'IT3A-015', 2],
];

module.exports = { DEMO_PASSWORDS, admin, teachers, classrooms, subjects, sections, students };
