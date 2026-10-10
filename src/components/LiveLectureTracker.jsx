
import React, { useState } from 'react';
import '../styles/portals.css';

export default function LiveLectureTracker() {
  const [lecture] = useState({
    subject: 'Data Structures',
    professor: 'Dr. Amit Sharma',
    room: 'Room 304',
    status: 'Live Now',
  });

  return (
    <div className="live-hero">
      <div>
        <h2>{lecture.subject}</h2>
        <p>{lecture.professor}</p>
        <p>{lecture.room}</p>
        <strong>{lecture.status}</strong>
      </div>

      <div className="prof-avatar">
        <span>LIVE</span>
      </div>
    </div>
  );
}