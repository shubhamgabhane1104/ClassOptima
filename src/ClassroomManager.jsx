import  { useState } from 'react';
export default function ClassroomManager() {
  const [classrooms, setClassrooms] = useState([
    { _id: '1', roomNumber: 'Room 402', building: 'Science Block', capacity: 65, type: 'Lecture Hall', hasProjector: true },
    { _id: '2', roomNumber: 'Room 403', building: 'Science Block', capacity: 60, type: 'Lecture Hall', hasProjector: true },
    { _id: '3', roomNumber: 'Advanced Lab 3', building: 'Tech Block', capacity: 40, type: 'Computer Lab', hasProjector: true },
    { _id: '4', roomNumber: 'OS & Systems Lab 1', building: 'Tech Block', capacity: 35, type: 'Computer Lab', hasProjector: true },
    { _id: '5', roomNumber: 'Seminar Hall 2', building: 'Admin Block', capacity: 120, type: 'Seminar Hall', hasProjector: true }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: 'Science Block',
    capacity: 60,
    type: 'Lecture Hall'
  });
  const handleSave = (e) => {
    e.preventDefault();
    setClassrooms([...classrooms, { ...formData, _id: Date.now().toString(), hasProjector: true }]);
    setShowModal(false);
    setFormData({ roomNumber: '', building: 'Science Block', capacity: 60, type: 'Lecture Hall' });
  };
  const handleDelete = (id) => {
    setClassrooms(classrooms.filter((c) => c._id !== id));
  };
  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Classrooms & Labs Infrastructure</h2>
          <p className="page-subtitle">Maintain physical rooms, seating limits, and distinguish lecture halls from computer labs.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Classroom / Lab
        </button>
      </div>
      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Room Number</th>
              <th>Building</th>
              <th>Room Type</th>
              <th>Capacity</th>
              <th>Equipment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map((c) => (
              <tr key={c._id}>
                <td className="font-bold text-indigo">📍 {c.roomNumber}</td>
                <td>{c.building}</td>
                <td>
                  <span className={`badge ${c.type.includes('Lab') ? 'badge-emerald' : 'badge-indigo'}`}>
                    {c.type}
                  </span>
                </td>
                <td className="text-green font-bold">{c.capacity} Students</td>
                <td className="text-muted">{c.hasProjector ? '✓ HD Projector & WiFi' : 'Standard'}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(c._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Add Room Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register Classroom or Lab</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Room Identifier / Lab Name</label>
                  <input
                    required
                    className="form-input"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. Room 405 or AI Lab 2"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Classification</label>
                    <select
                      className="form-input"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option>Lecture Hall</option>
                      <option>Computer Lab</option>
                      <option>Hardware Lab</option>
                      <option>Seminar Hall</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Seating Capacity</label>
                    <input
                      type="number"
                      required
                      min="10"
                      className="form-input"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Building / Block</label>
                  <input
                    className="form-input"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    placeholder="e.g. Main Science Block"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Classroom</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}