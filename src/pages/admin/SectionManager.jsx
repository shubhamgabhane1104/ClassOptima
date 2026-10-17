import { useEffect, useState } from 'react';
import { GraduationCap, Plus, X } from 'lucide-react';
import CrudManager from './CrudManager';
import { Field } from '../../components/common/ui';
import { api } from '../../services/api';

const empty = { name: 'B.E. Computer', department: 'Computer Engineering', semester: 5, section: 'A', studentCount: 60, classTeacher: '', courses: [] };

const idOf = (v) => (v && v._id ? v._id : v || '');

export default function SectionManager() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    api.get('/subjects').then((d) => setSubjects(d.data)).catch(() => {});
    api.get('/teachers').then((d) => setTeachers(d.data)).catch(() => {});
  }, []);

  const hours = (courses) => courses.reduce((n, c) => n + (c.subject?.weeklyHours || 0), 0);

  return (
    <CrudManager
      title="Divisions"
      noun="Division"
      icon={GraduationCap}
      path="/sections"
      description="A division is one class of students. List the subjects it studies and who teaches each one; the engine schedules exactly these."
      emptyForm={empty}
      wideForm
      fromRow={(s) => ({
        ...s,
        classTeacher: idOf(s.classTeacher),
        courses: s.courses.map((c) => ({ subject: idOf(c.subject), teacher: idOf(c.teacher) })),
      })}
      toPayload={(f) => ({
        name: f.name,
        department: f.department,
        semester: Number(f.semester),
        section: f.section,
        studentCount: Number(f.studentCount),
        classTeacher: f.classTeacher || undefined,
        courses: f.courses.filter((c) => c.subject && c.teacher),
      })}
      searchText={(s) => `${s.name} ${s.department} ${s.section}`}
      columns={[
        { label: 'Division', render: (s) => <><strong>{s.name} Div {s.section}</strong><div className="muted small">{s.department}</div></> },
        { label: 'Semester', render: (s) => s.semester },
        { label: 'Students', render: (s) => s.studentCount },
        { label: 'Class teacher', render: (s) => s.classTeacher?.name || '—' },
        { label: 'Subjects', render: (s) => `${s.courses.length} subjects, ${hours(s.courses)} h/week` },
      ]}
      renderForm={(f, set) => {
        const on = (k) => (e) => set({ ...f, [k]: e.target.value });
        const setCourse = (i, k, v) => set({ ...f, courses: f.courses.map((c, j) => (j === i ? { ...c, [k]: v } : c)) });
        const semesterSubjects = subjects.filter((s) => Number(s.semester) === Number(f.semester) && (!s.department || s.department === f.department));
        const addSemester = () => {
          const have = new Set(f.courses.map((c) => c.subject));
          set({ ...f, courses: [...f.courses, ...semesterSubjects.filter((s) => !have.has(s._id)).map((s) => ({ subject: s._id, teacher: '' }))] });
        };
        return (
          <>
            <Field label="Programme name"><input required value={f.name} onChange={on('name')} placeholder="B.E. Computer" /></Field>
            <Field label="Department"><input required value={f.department} onChange={on('department')} /></Field>
            <Field label="Semester"><input required type="number" min="1" max="8" value={f.semester} onChange={on('semester')} /></Field>
            <Field label="Division"><input required value={f.section} onChange={on('section')} placeholder="A" maxLength={3} /></Field>
            <Field label="Number of students"><input required type="number" min="1" value={f.studentCount} onChange={on('studentCount')} /></Field>
            <Field label="Class teacher">
              <select value={f.classTeacher} onChange={on('classTeacher')}>
                <option value="">Not assigned</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </Field>

            <div className="field-span course-editor">
              <div className="course-editor-head">
                <span className="field-label">Subjects and teachers</span>
                <div>
                  {semesterSubjects.length > 0 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={addSemester}>Add all semester {f.semester} subjects</button>
                  )}
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => set({ ...f, courses: [...f.courses, { subject: '', teacher: '' }] })}>
                    <Plus size={14} /> Add subject
                  </button>
                </div>
              </div>
              {f.courses.length === 0 && <p className="muted small">No subjects yet. This division will have an empty timetable.</p>}
              {f.courses.map((c, i) => (
                <div className="course-row" key={i}>
                  <select aria-label="Subject" value={c.subject} onChange={(e) => setCourse(i, 'subject', e.target.value)}>
                    <option value="">Choose subject</option>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.code} {s.name} ({s.type === 'Theory' ? `${s.weeklyHours} lectures` : `${s.weeklyHours} h lab`})</option>)}
                  </select>
                  <select aria-label="Teacher" value={c.teacher} onChange={(e) => setCourse(i, 'teacher', e.target.value)}>
                    <option value="">Choose teacher</option>
                    {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                  <button type="button" className="icon-btn danger" aria-label="Remove subject" onClick={() => set({ ...f, courses: f.courses.filter((_, j) => j !== i) })}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        );
      }}
    />
  );
}
