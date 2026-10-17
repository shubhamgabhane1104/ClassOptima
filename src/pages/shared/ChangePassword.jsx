import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { ErrorNote, Field, PageHeader } from '../../components/common/ui';

// Own page for changing the password (professors and students).
export default function ChangePassword() {
  const notify = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [pw, setPw] = useState(empty);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setPw({ ...pw, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.newPassword !== pw.confirm) {
      setError('The new passwords do not match.');
      return;
    }
    if (pw.newPassword === pw.currentPassword) {
      setError('Choose a new password that is different from the current one.');
      return;
    }
    setBusy(true);
    try {
      await api.patch('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      notify('Password changed. Use the new password next time you sign in.');
      setPw(empty);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <div className="page">
      <PageHeader title="Change password" description="Use at least 6 characters. You stay signed in on this device after changing it." />
      <form className="panel form-grid form-narrow form-medium" onSubmit={submit}>
        <Field label="Current password" span>
          <input type={type} required autoComplete="current-password" value={pw.currentPassword} onChange={set('currentPassword')} />
        </Field>
        <Field label="New password" hint="At least 6 characters" span>
          <input type={type} required minLength={6} autoComplete="new-password" value={pw.newPassword} onChange={set('newPassword')} />
        </Field>
        <Field label="Confirm new password" span>
          <input type={type} required minLength={6} autoComplete="new-password" value={pw.confirm} onChange={set('confirm')} />
        </Field>
        <label className="check field-span">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          {show ? <EyeOff size={15} /> : <Eye size={15} />} Show passwords
        </label>
        <ErrorNote error={error} />
        <div className="field-span">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <KeyRound size={16} /> {busy ? 'Changing…' : 'Change password'}
          </button>
        </div>
      </form>
    </div>
  );
}
