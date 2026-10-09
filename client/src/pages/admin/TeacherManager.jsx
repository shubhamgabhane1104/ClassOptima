import React, { useState } from 'react';
import AvailabilityPicker from '../../components/AvailabilityPicker';
import '../../styles/resources.css';
export default function TeacherManager() {
    const [teachers, setTeachers] = useState([
        { _id: '1', name: 'Dr. Amit Sharma', email: 'sharma@college.edu', cabin: 'Room 304', maxHours: 20 },
        { _id: '2', name: 'Prof. Vikas Patil', email: 'patil@college.edu', cabin: 'Room 306', maxHours: 18 }
    ]);
    return (
        <div className="resource-page">
            <div className="page-header">
                <h2>Faculty Management</h2>
            </div>
            <div className="table-card">
                <table className="custom-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Cabin</th><th>Hours</th></tr></thead>
                    <tbody>
                        {teachers.map(t => (
                            <tr key={t._id}><td>{t.name}</td><td>{t.email}</td><td>{t.cabin}</td><td>{t.maxHours} hrs</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}