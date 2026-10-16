const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ClassOptima API is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/teachers', require('./routes/teacherRoutes'));
app.use('/api/classrooms', require('./routes/classroomRoutes'));
app.use('/api/curriculum', require('./routes/curriculumRoutes'));
app.use('/api/v1/allocation', require('./routes/allocationRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ClassOptima Server running on port ${PORT}`));
