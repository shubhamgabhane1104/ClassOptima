import { Users } from 'lucide-react';
import CrudManager from './CrudManager';
import { Field } from '../../components/common/ui';
import AvailabilityPicker from '../../components/AvailabilityPicker';

const empty = {
  name: '', email: '', department: 'Computer Engineering', designation: 'Assistant Professor',
  cabinNumber: '', phone: '', maxHoursPerWeek: 18, maxHoursPerDay: 4, availability: [], password: '',
};

const restricted = (t) => t.availability?.reduce((n, a) => n + (7 - a.availableSlots.length), 0) || 0;

export default function TeacherManager() {
  return (
    <CrudManager
      title="Faculty"
      noun="Faculty member"
      icon={Users}
      path="/teachers"
      description="Each faculty member gets a professor login. Availability limits are respected by the timetable engine."
      emptyForm={empty}
      wideForm
      fromRow={(t) => ({ ...empty, ...t, password: '' })}
      toPayload={({ password, ...f }) => ({
        ...f,
        maxHoursPerWeek: Number(f.maxHoursPerWeek),
        maxHoursPerDay: Number(f.maxHoursPerDay),
        qualifiedSubjects: (f.qualifiedSubjects || []).map((s) => s._id || s),
        ...(password ? { password } : {}),
      })}
      searchText={(t) => `${t.name} ${t.email} ${t.department}`}
      columns={[
        { label: 'Name', render: (t) => <><strong>{t.name}</strong><div className="muted small">{t.designation}</div></> },
        { label: 'Department', render: (t) => t.department },
        { label: 'Cabin', render: (t) => t.cabinNumber || '—' },
        { label: 'Load limit', render: (t) => `${t.maxHoursPerWeek} h/week, ${t.maxHoursPerDay} h/day` },
        { label: 'Availability', render: (t) => (restricted(t) ? <span className="tag tag-gold">{restricted(t)} periods blocked</span> : <span className="tag">All week</span>) },
        { label: 'Login', render: (t) => <span className="muted small">{t.email}</span> },
      ]}
      renderForm={(f, set) => {
        const on = (k) => (e) => set({ ...f, [k]: e.target.value });
        return (
          <>
            <Field label="Full name"><input required value={f.name} onChange={on('name')} placeholder="Dr. Firstname Lastname" /></Field>
            <Field label="College email (login)"><input required type="email" value={f.email} onChange={on('email')} /></Field>
            <Field label="Department"><input required value={f.department} onChange={on('department')} /></Field>
            <Field label="Designation">
              <select value={f.designation} onChange={on('designation')}>
                {['Professor & HOD', 'Professor', 'Associate Professor', 'Assistant Professor', 'Visiting Faculty', 'Lab Instructor'].map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Cabin"><input value={f.cabinNumber} onChange={on('cabinNumber')} placeholder="Cabin 304, Block B" /></Field>
            <Field label="Phone"><input value={f.phone} onChange={on('phone')} /></Field>
            <Field label="Max hours per week"><input type="number" min="1" max="40" value={f.maxHoursPerWeek} onChange={on('maxHoursPerWeek')} /></Field>
            <Field label="Max hours per day"><input type="number" min="1" max="7" value={f.maxHoursPerDay} onChange={on('maxHoursPerDay')} /></Field>
            {!f._id && <Field label="Initial password" hint="Leave blank to use prof123" span><input value={f.password} onChange={on('password')} /></Field>}
            <Field label="Weekly availability" span>
              <AvailabilityPicker availability={f.availability} onChange={(availability) => set({ ...f, availability })} />
            </Field>
          </>
        );
      }}
    />
  );
}
