import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../../services/api';
import useResource from '../../components/common/useResource';
import { EmptyState, ErrorNote, Modal, PageHeader, Spinner } from '../../components/common/ui';
import { useToast } from '../../components/common/Toast';

/**
 * Generic list + add/edit/delete page used by the admin resource screens.
 *  columns:    [{ label, render(row) }]
 *  renderForm: (form, setForm) => JSX
 *  toPayload:  (form) => body sent to the API
 */
export default function CrudManager({
  title, description, path, noun, icon, columns, emptyForm, renderForm, toPayload = (f) => f, fromRow = (r) => r,
  searchText = (r) => JSON.stringify(r), wideForm, extraActions,
}) {
  const { data, loading, error, reload } = useResource(path);
  const notify = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  const open = (row) => {
    setEditing(row || 'new');
    setForm(row ? fromRow(row) : emptyForm);
    setFormError('');
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = toPayload(form);
      const res = editing === 'new' ? await api.post(path, body) : await api.put(`${path}/${editing._id}`, body);
      notify(res.message || `${noun} ${editing === 'new' ? 'added' : 'updated'}.`);
      setEditing(null);
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${noun.toLowerCase()}? This cannot be undone.`)) return;
    try {
      const res = await api.del(`${path}/${row._id}`);
      notify(res.message || `${noun} deleted.`);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const rows = query ? data.filter((r) => searchText(r).toLowerCase().includes(query.toLowerCase())) : data;

  return (
    <div className="page">
      <PageHeader
        title={title}
        description={description}
        actions={(
          <>
            {extraActions}
            <button type="button" className="btn btn-primary" onClick={() => open(null)}><Plus size={18} /> Add {noun.toLowerCase()}</button>
          </>
        )}
      />

      <div className="panel">
        <div className="panel-toolbar">
          <label className="search">
            <Search size={16} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} aria-label="Search" />
          </label>
          <span className="muted">{data.length} total</span>
        </div>
        <ErrorNote error={error} />
        {loading ? <Spinner /> : rows.length === 0 ? (
          <EmptyState icon={icon} title={query ? 'Nothing matches your search' : `No ${title.toLowerCase()} yet`}
            action={!query && <button type="button" className="btn btn-primary" onClick={() => open(null)}><Plus size={16} /> Add the first one</button>} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((c) => <th key={c.label} scope="col">{c.label}</th>)}
                  <th scope="col" className="actions-col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    {columns.map((c) => <td key={c.label} data-label={c.label}>{c.render(row)}</td>)}
                    <td className="actions-col">
                      <button type="button" className="icon-btn" onClick={() => open(row)} aria-label={`Edit ${noun}`}><Pencil size={16} /></button>
                      <button type="button" className="icon-btn danger" onClick={() => remove(row)} aria-label={`Delete ${noun}`}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? `Add ${noun.toLowerCase()}` : `Edit ${noun.toLowerCase()}`}
          onClose={() => setEditing(null)}
          wide={wideForm}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" form="crud-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          )}
        >
          <form id="crud-form" className="form-grid" onSubmit={save}>
            {renderForm(form, setForm)}
            <ErrorNote error={formError} />
          </form>
        </Modal>
      )}
    </div>
  );
}
