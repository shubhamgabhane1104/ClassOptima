import React, { useState } from 'react';
import '../../styles/resources.css';
export default function ClassroomManager() {
    const [rooms] = useState([
        { _id: '1', roomNumber: 'Room 402', type: 'Lecture Hall', capacity: 65 },
        { _id: '2', roomNumber: 'Advanced Lab 3', type: 'Computer Lab', capacity: 40 }
    ]);
    return (
        <div className="resource-page">
            <h2>Classrooms & Labs</h2>
            <div className="table-card">
                <table className="custom-table">
                    <thead><tr><th>Room</th><th>Type</th><th>Capacity</th></tr></thead>
                    <tbody>
                        {rooms.map(r => (
                            <tr key={r._id}><td>{r.roomNumber}</td><td><span className={r.type.includes('Lab') ? 'badge-lab' : 'badge-hall'}>{r.type}</span></td><td>{r.capacity}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}