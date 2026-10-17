import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { homeFor, useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ErrorNote } from '../../components/common/ui';
import { divisionLabel } from '../../config/schedule';
import { AuthLayout } from './Login';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', rollNumber: '', classSectionId: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/public/sections').then((d) => setSections(d.data)).catch((e) => setError(e.message));
  }, []);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await register(form);
      navigate(homeFor(u.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h2>Create a student account</h2>
        <p className="muted">You will see your division's timetable as soon as it is published.</p>
        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span className="field-label">Full name</span>
            <input required value={form.name} onChange={set('name')} />
          </label>
          <label className="field">
            <span className="field-label">College email</span>
            <input required type="email" value={form.email} onChange={set('email')} />
          </label>
          <div className="field-pair">
            <label className="field">
              <span className="field-label">Roll number</span>
              <input required value={form.rollNumber} onChange={set('rollNumber')} placeholder="CE5A-031" />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <input required type="password" minLength={6} value={form.password} onChange={set('password')} />
            </label>
          </div>
          <label className="field">
            <span className="field-label">Division</span>
            <select required value={form.classSectionId} onChange={set('classSectionId')}>
              <option value="">Select your division</option>
              {sections.map((s) => <option key={s._id} value={s._id}>{divisionLabel(s)}</option>)}
            </select>
          </label>
          <ErrorNote error={error} />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            <UserPlus size={18} /> {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </AuthLayout>
  );
}
