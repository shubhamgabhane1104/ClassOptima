import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Presentation, GraduationCap } from 'lucide-react';
import { homeFor, useAuth } from '../../context/AuthContext';
import college from '../../config/college';
import Crest from '../../components/layout/Crest';
import { ErrorNote } from '../../components/common/ui';

// Accounts created by `npm run seed` (server/seed/sampleCollegeData.js)
const DEMO = [
  { role: 'Admin', icon: ShieldCheck, email: 'admin@classoptima.edu.in', password: 'admin123' },
  { role: 'Professor', icon: Presentation, email: 'amit.sharma@classoptima.edu.in', password: 'prof123' },
  { role: 'Student', icon: GraduationCap, email: 'rahul.verma@classoptima.edu.in', password: 'student123' },
];

export function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <aside className="auth-photo" style={{ '--banner-img': `url("${college.images.campus}")` }}>
        <div className="auth-photo-text">
          <Crest size={56} />
          <h1>{college.name}</h1>
          <p>{college.tagline}</p>
          <p className="auth-photo-note">
            Lecture timetables, classroom allocation and faculty schedules for every division, in one place.
          </p>
        </div>
      </aside>
      <main className="auth-panel">{children}</main>
    </div>
  );
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const signIn = async (e, creds) => {
    e?.preventDefault();
    const em = creds ? creds.email : email;
    const pw = creds ? creds.password : password;
    if (!em || !pw) {
      setError('Enter your college email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const u = await login(em, pw);
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
        <h2>Sign in to the portal</h2>
        <p className="muted">Use the email address issued by the college office.</p>

        <form onSubmit={signIn} className="auth-form">
          <label className="field">
            <span className="field-label">College email</span>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@classoptima.edu.in" />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <ErrorNote error={error} />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            <LogIn size={18} /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-logins">
          <p>Demo accounts for the project presentation</p>
          <div className="demo-row">
            {DEMO.map((d) => (
              <button key={d.role} type="button" className="btn btn-outline" disabled={busy} onClick={(e) => signIn(e, d)}>
                <d.icon size={16} /> {d.role}
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch">
          New student? <Link to="/register">Create your account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
