import { useMemo, useState } from 'react';
import { Contact, Trash2, Search } from 'lucide-react';
import useResource from '../../components/common/useResource';
import { EmptyState, ErrorNote, PageHeader, Spinner } from '../../components/common/ui';
import { useToast } from '../../components/common/Toast';
import { api } from '../../services/api';
import { divisionLabel } from '../../config/schedule';

const ALL = '';

export default function StudentList() {
  const { data, loading, error, reload } = useResource('/students');
  const notify = useToast();
  const [program, setProgram] = useState(ALL);
  const [semester, setSemester] = useState(ALL);
  const [division, setDivision] = useState(ALL);
  const [query, setQuery] = useState('');

  // Divisions that have students, with their counts
  const divisions = useMemo(() => {
    const map = new Map();
    for (const s of data) {
      const d = s.classSection;
      if (!d) continue;
      const entry = map.get(d._id) || { ...d, count: 0 };
      entry.count += 1;
      map.set(d._id, entry);
    }
    return [...map.values()].sort((a, b) => divisionLabel(a).localeCompare(divisionLabel(b)));
  }, [data]);

  const programs = useMemo(() => [...new Set(divisions.map((d) => d.name))].sort(), [divisions]);
  const semesters = useMemo(
    () => [...new Set(divisions.filter((d) => !program || d.name === program).map((d) => d.semester))].sort((a, b) => a - b),
    [divisions, program],
  );
  const divisionOptions = divisions.filter((d) => (!program || d.name === program) && (!semester || String(d.semester) === semester));

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data
      .filter((s) => {
        const d = s.classSection || {};
        if (program && d.name !== program) return false;
        if (semester && String(d.semester) !== semester) return false;
        if (division && d._id !== division) return false;
        if (q && !`${s.name} ${s.rollNumber} ${s.email}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => divisionLabel(a.classSection).localeCompare(divisionLabel(b.classSection)) || a.rollNumber.localeCompare(b.rollNumber));
  }, [data, program, semester, division, query]);

  const changeProgram = (v) => { setProgram(v); setSemester(ALL); setDivision(ALL); };
  const changeSemester = (v) => { setSemester(v); setDivision(ALL); };
  const clear = () => { setProgram(ALL); setSemester(ALL); setDivision(ALL); setQuery(''); };
  const filtered = program || semester || division || query;

  const remove = async (s) => {
    if (!window.confirm(`Remove ${s.name} and their login?`)) return;
    try {
      await api.del(`/students/${s._id}`);
      notify('Student removed.');
      reload();
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  return (
    <div className="page">
      <PageHeader title="Students" description="Students create their own accounts from the sign-in page by choosing their division. Filter by programme, semester or division." />
      <div className="panel">
        <ErrorNote error={error} />
        {loading ? <Spinner /> : data.length === 0 ? (
          <EmptyState icon={Contact} title="No students registered yet">Share the portal link; students sign up with their roll number and division.</EmptyState>
        ) : (
          <>
            <div className="filter-bar">
              <label className="field">
                <span className="field-label">Programme</span>
                <select value={program} onChange={(e) => changeProgram(e.target.value)}>
                  <option value={ALL}>All programmes</option>
                  {programs.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Semester</span>
                <select value={semester} onChange={(e) => changeSemester(e.target.value)}>
                  <option value={ALL}>All semesters</option>
                  {semesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Division</span>
                <select value={division} onChange={(e) => setDivision(e.target.value)}>
                  <option value={ALL}>All divisions</option>
                  {divisionOptions.map((d) => <option key={d._id} value={d._id}>{divisionLabel(d)}</option>)}
                </select>
              </label>
              <label className="search">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, roll no. or email" aria-label="Search students" />
              </label>
              {filtered && <button type="button" className="btn btn-outline btn-sm" onClick={clear}>Clear filters</button>}
            </div>

            <div className="filter-chips" role="group" aria-label="Students per division">
              {divisionOptions.map((d) => (
                <button key={d._id} type="button" className={`chip ${division === d._id ? 'on' : ''}`} aria-pressed={division === d._id}
                  onClick={() => setDivision(division === d._id ? ALL : d._id)}>
                  {d.name} Sem {d.semester} Div {d.section}<strong>{d.count}</strong>
                </button>
              ))}
            </div>

            <p className="muted small">Showing {rows.length} of {data.length} students</p>

            {rows.length === 0 ? (
              <EmptyState icon={Contact} title="No students match these filters" action={<button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>} />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Roll no.</th><th>Name</th><th>Programme</th><th>Semester</th><th>Division</th><th>Email</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s._id}>
                        <td data-label="Roll no."><strong>{s.rollNumber}</strong></td>
                        <td data-label="Name">{s.name}</td>
                        <td data-label="Programme">{s.classSection?.name}</td>
                        <td data-label="Semester">{s.classSection?.semester}</td>
                        <td data-label="Division">{s.classSection?.section}</td>
                        <td data-label="Email" className="muted small">{s.email}</td>
                        <td className="actions-col"><button type="button" className="icon-btn danger" aria-label={`Remove ${s.name}`} onClick={() => remove(s)}><Trash2 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
