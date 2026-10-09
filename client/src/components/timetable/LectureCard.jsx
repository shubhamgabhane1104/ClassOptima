import React from 'react';

export default function LectureCard({ slot, onClick }) {
  const isLab = slot.type === 'lab';

  return (
    <div
      className="lecture-card"
      onClick={() => onClick && onClick(slot)}
    >
      <div>
        <div className="card-title">
          {slot.subject}
        </div>

        <span className={isLab ? 'badge-theory' : 'badge-theory'}>
          {isLab ? 'Lab' : 'Theory'}
        </span>
      </div>
    </div>
  );
}