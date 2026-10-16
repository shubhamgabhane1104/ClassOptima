
import React, { useEffect } from 'react';
import '../../styles/modal.css';

export default function SlotModal({ slot, onClose }) {
  useEffect(() => {
    if (!slot) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [slot, onClose]);

  if (!slot) return null;

  const subject =
    slot.subject || slot.subjectName || slot.courseName || 'Untitled class';

  const teacher = slot.teacher || slot.teacherName || 'Not specified';
  const room = slot.room || slot.classroom || slot.roomName || 'Not specified';
  const type = slot.isLab || slot.type === 'Lab' ? 'Lab' : 'Theory';

  return (
    <div
      className="slot-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="slot-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="slot-modal-header">
          <h2 id="slot-modal-title" className="slot-modal-title">
            Class Details
          </h2>

          <button
            type="button"
            className="slot-modal-close"
            onClick={onClose}
            aria-label="Close class details"
          >
            &times;
          </button>
        </header>

        <div className="slot-modal-details">
          <div className="slot-modal-detail">
            <span className="slot-modal-label">Subject</span>
            <span className="slot-modal-value">{subject}</span>
          </div>

          <div className="slot-modal-detail">
            <span className="slot-modal-label">Class type</span>
            <span className={`slot-modal-badge ${type.toLowerCase()}`}>
              {type}
            </span>
          </div>

          <div className="slot-modal-detail">
            <span className="slot-modal-label">Teacher</span>
            <span className="slot-modal-value">{teacher}</span>
          </div>

          <div className="slot-modal-detail">
            <span className="slot-modal-label">Room</span>
            <span className="slot-modal-value">{room}</span>
          </div>

          {slot.day && (
            <div className="slot-modal-detail">
              <span className="slot-modal-label">Day</span>
              <span className="slot-modal-value">{slot.day}</span>
            </div>
          )}

          {slot.time && (
            <div className="slot-modal-detail">
              <span className="slot-modal-label">Time</span>
              <span className="slot-modal-value">{slot.time}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
