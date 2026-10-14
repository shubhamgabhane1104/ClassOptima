import React, { useState } from 'react';
import '../../styles/curriculum.css';

export default function SectionManager() {
  const [sections] = useState([
    { _id: '1', name: 'B.Tech CSE Year 3', section: 'Div A', studentCount: 60 }
  ]);

  return (
    <div className="curriculum-page">
      <h2>Class Sections & Cohorts</h2>
      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr><th>Class</th><th>Division</th><th>Strength</th></tr>
          </thead>
          <tbody>
            {sections.map(sec => (
              <tr key={sec._id}>
                <td>{sec.name}</td>
                <td>{sec.section}</td>
                <td>{sec.studentCount} Students</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}