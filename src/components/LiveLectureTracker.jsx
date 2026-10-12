
import React, { useState, useEffect } from 'react';
import '../styles/portals.css';

export default function LiveLectureTracker() {
  const [lecture] = useState({
    subject: 'Data Structures',
    professor: 'Dr. Amit Sharma',
    room: 'Room 304',
    endTime: Date.now() + 45 * 60 * 1000,
  });

  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, lecture.endTime - Date.now())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, lecture.endTime - Date.now()));
    }, 1000);

    return () => clearInterval(timer);
  }, [lecture.endTime]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="live-hero">
      <div>
        <h2>{lecture.subject}</h2>
        <p>{lecture.professor}</p>
        <p>{lecture.room}</p>

        {timeLeft > 0 ? (
          <p>
            Lecture ends in: {minutes}:
            {String(seconds).padStart(2, '0')}
          </p>
        ) : (
          <p>Lecture ended</p>
        )}
      </div>

      <div className="prof-avatar">
        <span>LIVE</span>
      </div>
    </div>
  );
}