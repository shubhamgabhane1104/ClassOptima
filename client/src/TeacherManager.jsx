import  { useState } from 'react';
import AvailabilityPicker from './AvailabilityPicker';
export default function TeacherManager() {
  const [teachers, setTeachers] = useState([
    { _id: '1', name: 'Dr. Amit Sharma', email: 'sharma@college.edu', department: 'Computer Science', cabin: 'Room 304', maxHours: 20 },
    { _id: '2', name: 'Prof. Vikas Patil', email: 'patil@college.edu', department: 'Computer Science', cabin: 'Room 306', maxHours: 18 },
    { _id: '3', name: 'Dr. Meera Iyer', email: 'iyer@college.edu', department: 'Information Tech', cabin: 'Room 202', maxHours: 20 },
    { _id: '4', name: 'Prof. K. Joshi', email: 'joshi@college.edu', department: 'Computer Science', cabin: 'Room 305', maxHours: 16 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    cabin: '',
    maxHours: 20,
    availability: []
  });
  const handleSave = (e) => {
    e.preventDefault();
    setTeachers([...teachers, { ...formData, _id: Date.now().toString() }]);
    setShowModal(false);
    setFormData({ name: '', email: '', department: 'Computer Science', cabin: '', maxHours: 20, availability: [] });
  };
  const handleDelete = (id) => {
    setTeachers(teachers.filter((t) => t._id !== id));
  };
  return (
    <div className="resource-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Management</h2>
          <p className="page-subtitle">Configure teachers, office locations, and working availability matrices.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add New Faculty
        </button>
      </div>
      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Faculty Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Cabin / Office</th>
              <th>Max Hours / Wk</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t._id}>
                <td className="font-bold">{t.name}</td>
                <td className="text-muted">{t.email}</td>
                <td><span className="badge badge-indigo">{t.department}</span></td>
                <td>{t.cabin}</td>
                <td className="text-green font-bold">{t.maxHours} hrs</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(t._id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Add Teacher Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Faculty Member</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    required
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kumar"
                  />
                </div>
                <div className="form-group">
                  <label>College Email</label>
                  <input
                    required
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="faculty@college.edu"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Office / Cabin</label>
                    <input
                      className="form-input"
                      value={formData.cabin}
                      onChange={(e) => setFormData({ ...formData, cabin: e.target.value })}
                      placeholder="e.g. Room 302 Block B"
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Weekly Hours</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.maxHours}
                      onChange={(e) => setFormData({ ...formData, maxHours: Number(e.target.value) })}
                    />
                  </div>
                </div>
                {/* Interactive Availability Component */}
                <AvailabilityPicker
                  availability={formData.availability}
                  onChange={(availability) => setFormData({ ...formData, availability })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}