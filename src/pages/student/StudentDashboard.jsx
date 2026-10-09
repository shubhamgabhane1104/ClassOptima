
import React from 'react';
import '../../styles/portals.css';

export default function StudentDashboard() {
  const student = {
    name: 'Rahul Sharma',
    course: 'B.Tech Information Technology',
    semester: 'Semester 5',
    rollNumber: 'IT2024-015',
  };

  return (
    <div style={{ padding: '24px', color: '#f8fafc' }}>
      <h1>Student Dashboard</h1>
      <p style={{ color: '#94a3b8' }}>
        Welcome back, {student.name}!
      </p>

      <div className="prof-card">
        <div>
          <h2>{student.name}</h2>
          <p style={{ color: '#94a3b8' }}>{student.course}</p>
          <p style={{ color: '#94a3b8' }}>{student.semester}</p>
          <p style={{ color: '#94a3b8' }}>
            Roll Number: {student.rollNumber}
          </p>
        </div>

        <div className="prof-avatar">RS</div>
      </div>

      <div className="live-hero">
        <div>
          <h2>Today's Schedule</h2>
          <p>Check your classes and upcoming lectures.</p>
        </div>
      </div>
    </div>
  );
}