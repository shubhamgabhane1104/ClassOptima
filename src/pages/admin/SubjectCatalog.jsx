import React, { useState } from 'react';
import '../../styles/curriculum.css';

export default function SubjectCatalog() {
  const [subjects] = useState([
    { _id: '1', code: 'CS501', name: 'Database Systems', type: 'Theory', weeklyHours: 4 },
    { _id: '2', code: 'CS508L', name: 'DBMS Lab', type: 'Practical/Lab', weeklyHours: 2 }
  ]);

  return (
    <div className="curriculum-page">
      <h2>Curriculum Catalog</h2>
      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr><th>Code</th><th>Course</th><th>Type</th><th>Hours</th></tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s._id}>
                <td className="badge-code">{s.code}</td>
                <td>{s.name}</td>
                <td>{s.type}</td>
                <td className="hours-pill">{s.weeklyHours} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}