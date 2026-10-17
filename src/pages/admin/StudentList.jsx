import { Contact, Trash2 } from 'lucide-react';
import useResource from '../../components/common/useResource';
import { EmptyState, ErrorNote, PageHeader, Spinner } from '../../components/common/ui';
import { useToast } from '../../components/common/Toast';
import { api } from '../../services/api';
import { divisionLabel } from '../../config/schedule';

export default function StudentList() {
  const { data, loading, error, reload } = useResource('/students');
  const notify = useToast();

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
      <PageHeader title="Students" description="Students create their own accounts from the sign-in page by choosing their division." />
      <div className="panel">
        <ErrorNote error={error} />
        {loading ? <Spinner /> : data.length === 0 ? (
          <EmptyState icon={Contact} title="No students registered yet">Share the portal link; students sign up with their roll number and division.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Roll no.</th><th>Name</th><th>Division</th><th>Email</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s._id}>
                    <td data-label="Roll no."><strong>{s.rollNumber}</strong></td>
                    <td data-label="Name">{s.name}</td>
                    <td data-label="Division">{divisionLabel(s.classSection)}</td>
                    <td data-label="Email" className="muted small">{s.email}</td>
                    <td className="actions-col"><button type="button" className="icon-btn danger" aria-label="Remove student" onClick={() => remove(s)}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
