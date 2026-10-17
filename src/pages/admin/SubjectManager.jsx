import { BookOpen } from 'lucide-react';
import CrudManager from './CrudManager';
import { Field } from '../../components/common/ui';
import { ROOM_TYPES } from '../../config/schedule';

const empty = { code: '', name: '', type: 'Theory', weeklyHours: 3, semester: 5, department: 'Computer Engineering', credits: 3, preferredRoomType: '' };

export default function SubjectManager() {
  return (
    <CrudManager
      title="Subjects"
      noun="Subject"
      icon={BookOpen}
      path="/subjects"
      description="Theory subjects are scheduled as 1-hour lectures. Practicals are scheduled as 2-hour lab blocks."
      emptyForm={empty}
      toPayload={(f) => ({
        ...f,
        weeklyHours: Number(f.weeklyHours),
        semester: Number(f.semester),
        credits: Number(f.credits),
        preferredRoomType: f.type === 'Practical/Lab' ? f.preferredRoomType : '',
      })}
      searchText={(s) => `${s.code} ${s.name} ${s.department}`}
      columns={[
        { label: 'Code', render: (s) => <strong>{s.code}</strong> },
        { label: 'Subject', render: (s) => s.name },
        { label: 'Type', render: (s) => <span className={`tag ${s.type === 'Theory' ? 'tag-blue' : 'tag-green'}`}>{s.type === 'Theory' ? 'Theory' : 'Practical'}</span> },
        { label: 'Hours/week', render: (s) => (s.type === 'Theory' ? `${s.weeklyHours} lectures` : `${s.weeklyHours} h (${Math.ceil(s.weeklyHours / 2)} lab block${s.weeklyHours > 2 ? 's' : ''})`) },
        { label: 'Semester', render: (s) => s.semester },
        { label: 'Department', render: (s) => s.department },
      ]}
      renderForm={(f, set) => {
        const on = (k) => (e) => set({ ...f, [k]: e.target.value });
        return (
          <>
            <Field label="Subject code"><input required value={f.code} onChange={on('code')} placeholder="CE501" /></Field>
            <Field label="Subject name"><input required value={f.name} onChange={on('name')} /></Field>
            <Field label="Type">
              <select value={f.type} onChange={on('type')}>
                <option value="Theory">Theory</option>
                <option value="Practical/Lab">Practical / Lab</option>
              </select>
            </Field>
            <Field label="Hours per week" hint={f.type === 'Theory' ? 'One lecture per hour' : 'Even numbers work best (2-hour lab blocks)'}>
              <input required type="number" min="1" max="10" value={f.weeklyHours} onChange={on('weeklyHours')} />
            </Field>
            {f.type === 'Practical/Lab' && (
              <Field label="Lab type needed">
                <select value={f.preferredRoomType} onChange={on('preferredRoomType')}>
                  <option value="">Any lab</option>
                  {ROOM_TYPES.filter((t) => t !== 'Lecture Hall').map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            )}
            <Field label="Semester"><input required type="number" min="1" max="8" value={f.semester} onChange={on('semester')} /></Field>
            <Field label="Department"><input value={f.department} onChange={on('department')} /></Field>
            <Field label="Credits"><input type="number" min="0" max="10" value={f.credits} onChange={on('credits')} /></Field>
          </>
        );
      }}
    />
  );
}
