import React from 'react';
import '../../styles/portals.css';

export default function ProfessorDashboard() {
  const currentHours = 16;
  const maxHours = 20;

  return (
    <div>
      <div className="prof-card">
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div className="prof-avatar">AS</div>

          <div>
            <h2>Dr. Amit Sharma</h2>
            <p style={{ color: '#94a3b8' }}>
              Computer Science • Cabin: Room 304
            </p>
          </div>
        </div>

        <div>
          <p>Teaching Workload</p>
          <span className="workload-stat">
            {currentHours} / {maxHours} hrs
          </span>
        </div>
      </div>
    </div>
  );
}