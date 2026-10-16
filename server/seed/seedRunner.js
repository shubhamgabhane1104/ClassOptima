const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Teacher = require('../models/Teacher');
const Classroom = require('../models/Classroom');
const seedData = require('./resourceSeed');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing
    await Teacher.deleteMany({});
    await Classroom.deleteMany({});

    // Insert seeds
    await Teacher.insertMany(seedData.teachers);
    await Classroom.insertMany(seedData.classrooms);

    console.log('Database successfully seeded with demo teachers and classrooms!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();
