import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { ErrorNote, Field, PageHeader, Spinner } from '../../components/common/ui';
import AvailabilityPicker from '../../components/AvailabilityPicker';

export default function ProfessorProfile() {
  const { refresh } = useAuth();
  const notify = useToast();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/professor/profile').then((d) => setProfile(d.data)).catch((e) => setError(e.message));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/professor/profile', {
        cabinNumber: profile.cabinNumber, phone: profile.phone, availability: profile.availability,
      });
      notify(r.message);
      refresh();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="page"><ErrorNote error={error} /></div>;
  if (!profile) return <div className="page"><Spinner /></div>;

  return (
    <div className="page">
      <PageHeader title="Profile & availability" description="Tell the admin office where to find you and when you can teach." />
      <form className="panel form-grid form-medium" onSubmit={save}>
        <h2 className="panel-title field-span">{profile.name}</h2>
        <Field label="Department"><input value={profile.department} disabled /></Field>
        <Field label="Designation"><input value={profile.designation} disabled /></Field>
        <Field label="Cabin / office"><input value={profile.cabinNumber} onChange={(e) => setProfile({ ...profile, cabinNumber: e.target.value })} /></Field>
        <Field label="Phone"><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
        <Field label="When can you teach?" hint="Changes apply the next time the admin generates the timetable." span>
          <AvailabilityPicker availability={profile.availability} onChange={(availability) => setProfile({ ...profile, availability })} />
        </Field>
        <div className="field-span">
          <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </form>
    </div>
  );
}
