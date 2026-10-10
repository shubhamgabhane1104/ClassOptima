import React from 'react';

export default function WorkloadGauge({ currentHours = 16, maxHours = 20 }) {
  const percentage = Math.min((currentHours / maxHours) * 100, 100);

  return (
    <div>
      <p>Teaching Workload</p>

      <div
        style={{
          width: '100%',
          height: '12px',
          background: '#1e293b',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: '#34d399',
            borderRadius: '10px',
          }}
        />
      </div>

      <p>
        {currentHours} / {maxHours} hrs
      </p>
    </div>
  );
}