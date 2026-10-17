import { useCallback, useEffect, useMemo, useState } from 'react';
import { Zap, Send, Undo2, FileDown, AlertTriangle, Lock, Unlock, Trash2, CheckCircle2, Info } from 'lucide-react';
import { api, downloadFile } from '../../services/api';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import { ErrorNote, Modal, PageHeader, Spinner, EmptyState } from '../../components/common/ui';
import { useToast } from '../../components/common/Toast';
import { DAY_LABELS, divisionLabel, isLab, t12 } from '../../config/schedule';

export default function TimetableGenerator() {
  const notify = useToast();
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [slots, setSlots] = useState([]);
  const [report, setReport] = useState({ conflicts: [], warnings: [] });
  const [view, setView] = useState({ kind: 'section', id: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);

  const load = useCallback(async () => {
    try {
      const [sec, tch, rm, tt, cf] = await Promise.all([
        api.get('/sections'), api.get('/teachers'), api.get('/classrooms'),
        api.get('/allocation/timetable'), api.get('/allocation/conflicts'),
      ]);
      setSections(sec.data);
      setTeachers(tch.data);
      setRooms(rm.data);
      setSlots(tt.data);
      setReport(cf.data);
      setView((v) => (v.id ? v : { kind: 'section', id: sec.data[0]?._id || '' }));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching data on mount
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => slots.filter((s) => (view.kind === 'section'
    ? s.classSection?._id === view.id
    : s.teacher?._id === view.id)), [slots, view]);

  const published = slots.length > 0 && slots.every((s) => s.isPublished);
  const conflictIds = useMemo(() => new Set(report.conflicts.flatMap((c) => c.slotIds)), [report]);

  const generate = async () => {
    if (slots.some((s) => s.isPublished) && !window.confirm('Generating again replaces the current timetable (locked slots are kept) and unpublishes it until you publish again. Continue?')) return;
    setBusy('generate');
    try {
      const r = await api.post('/allocation/generate');
      setLastRun(r);
      notify(r.message, r.complete ? 'success' : 'error');
      await load();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const publish = async (on) => {
    setBusy('publish');
    try {
      const r = await api.patch('/allocation/publish', { publish: on });
      notify(r.message);
      await load();
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const exportPdf = async () => {
    try {
      if (view.kind === 'section') await downloadFile(`/export/pdf/${view.id}`, 'timetable.pdf');
      else await downloadFile(`/export/pdf/teacher/${view.id}`, 'timetable.pdf');
    } catch (e) {
      notify(e.message, 'error');
    }
  };

  const validateMove = (slot, day, slotIndex) => api.post('/allocation/validate', { slotId: slot._id, day, slotIndex }).then((r) => r);

  const saveMove = async (slot, changes, force = false) => {
    try {
      const r = await api.patch(`/allocation/slots/${slot._id}`, { ...changes, force });
      notify(`${slot.subject.name} saved: ${DAY_LABELS[r.data.day]} ${t12(r.data.startTime)} in ${r.data.classroom?.roomNumber}. Publish again to update the portals.`);
      setPendingMove(null);
      setSelected(null);
      await load();
    } catch (e) {
      if (e.status === 409 && e.details?.conflicts) setPendingMove({ slot, changes, conflicts: e.details.conflicts });
      else notify(e.message, 'error');
    }
  };

  const toggleLock = async (slot) => {
    await api.patch(`/allocation/slots/${slot._id}/lock`, { isLocked: !slot.isLocked });
    setSelected(null);
    load();
  };

  const removeSlot = async (slot) => {
    if (!window.confirm('Remove this lecture from the timetable?')) return;
    await api.del(`/allocation/slots/${slot._id}`);
    notify('Lecture removed. Generate again to place it automatically.');
    setSelected(null);
    load();
  };

  if (loading) return <div className="page"><Spinner /></div>;

  return (
    <div className="page">
      <PageHeader
        title="Timetable generator"
        description="Generate a clash-free timetable for every division, fine-tune it by dragging lectures, then publish it to the portals."
        actions={(
          <>
            <button type="button" className="btn btn-primary" onClick={generate} disabled={!!busy || !sections.length}>
              <Zap size={18} /> {busy === 'generate' ? 'Generating…' : slots.length ? 'Generate again' : 'Generate timetable'}
            </button>
            {published ? (
              <button type="button" className="btn btn-outline" onClick={() => publish(false)} disabled={!!busy}><Undo2 size={18} /> Unpublish</button>
            ) : (
              <button type="button" className="btn btn-gold" onClick={() => publish(true)} disabled={!!busy || !slots.length}><Send size={18} /> Publish</button>
            )}
          </>
        )}
      />
      <ErrorNote error={error} />

      {lastRun && (
        <div className={`run-summary ${lastRun.complete ? 'ok' : 'warn'}`}>
          {lastRun.complete ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <div>
            <strong>{lastRun.message}</strong>
            <p>
              Placed {lastRun.stats.placed} of {lastRun.stats.totalUnits} lecture blocks in {lastRun.stats.durationMs} ms
              ({lastRun.stats.steps} search steps, {lastRun.stats.backtracks} backtracks).
            </p>
            {lastRun.unallocated.length > 0 && (
              <ul>{lastRun.unallocated.map((u, i) => <li key={i}>{u.subject} for {u.section} ({u.teacher}): {u.reason}</li>)}</ul>
            )}
            {lastRun.warnings.length > 0 && (
              <details><summary>{lastRun.warnings.length} suggestion(s) to improve the timetable</summary><ul>{lastRun.warnings.map((w) => <li key={w}>{w}</li>)}</ul></details>
            )}
          </div>
        </div>
      )}

      {!sections.length ? (
        <EmptyState icon={Info} title="No divisions to schedule">Create divisions and assign their subjects and teachers first.</EmptyState>
      ) : (
        <section className="panel">
          <div className="panel-toolbar tt-toolbar">
            <div className="segmented" role="tablist" aria-label="View timetable by">
              <button type="button" role="tab" aria-selected={view.kind === 'section'} className={view.kind === 'section' ? 'on' : ''} onClick={() => setView({ kind: 'section', id: sections[0]?._id })}>By division</button>
              <button type="button" role="tab" aria-selected={view.kind === 'teacher'} className={view.kind === 'teacher' ? 'on' : ''} onClick={() => setView({ kind: 'teacher', id: teachers[0]?._id })}>By faculty</button>
            </div>
            <select value={view.id} onChange={(e) => setView({ ...view, id: e.target.value })} aria-label="Choose which timetable to show">
              {(view.kind === 'section' ? sections : teachers).map((x) => (
                <option key={x._id} value={x._id}>{view.kind === 'section' ? divisionLabel(x) : x.name}</option>
              ))}
            </select>
            <span className={`pill ${!slots.length ? '' : published ? 'pill-green' : 'pill-gold'}`}>
              {!slots.length ? 'Not generated' : published ? 'Published' : 'Draft'}
            </span>
            <span className={`pill ${report.conflicts.length ? 'pill-red' : 'pill-green'}`}>
              {report.conflicts.length ? `${report.conflicts.length} clash${report.conflicts.length > 1 ? 'es' : ''}` : 'No clashes'}
            </span>
            <button type="button" className="btn btn-outline btn-sm push-right" onClick={exportPdf} disabled={!visible.length}><FileDown size={16} /> PDF</button>
          </div>

          {report.conflicts.length > 0 && (
            <div className="conflict-list" role="alert">
              <AlertTriangle size={18} />
              <ul>{report.conflicts.map((c, i) => <li key={i}>{DAY_LABELS[c.day]} period {c.slotIndex}: {c.message}</li>)}</ul>
            </div>
          )}

          {slots.length === 0 ? (
            <EmptyState icon={Zap} title="No timetable yet" action={<button type="button" className="btn btn-primary" onClick={generate}><Zap size={16} /> Generate timetable</button>}>
              The engine will place every lecture and lab while avoiding teacher, room and division clashes.
            </EmptyState>
          ) : (
            <>
              <TimetableGrid
                slots={visible}
                perspective={view.kind}
                editable={view.kind === 'section'}
                validateMove={validateMove}
                onMove={(slot, day, slotIndex) => saveMove(slot, { day, slotIndex })}
                onSlotClick={setSelected}
                conflictIds={conflictIds}
              />
              <p className="muted small grid-legend">
                <span className="legend legend-theory" /> Theory <span className="legend legend-lab" /> Practical <Lock size={12} /> Locked (kept when you generate again).
                {view.kind === 'section' ? ' Drag a lecture to another period to move it.' : ' Switch to "By division" to move lectures.'}
              </p>
            </>
          )}
        </section>
      )}

      {selected && (
        <SlotDetails slot={selected} rooms={rooms} onClose={() => setSelected(null)}
          onLock={() => toggleLock(selected)} onRemove={() => removeSlot(selected)}
          onRoom={(classroom) => saveMove(selected, { classroom })} />
      )}

      {pendingMove && (
        <Modal title="This change causes a clash" onClose={() => setPendingMove(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setPendingMove(null)}>Keep the original time</button>
              <button type="button" className="btn btn-danger" onClick={() => saveMove(pendingMove.slot, pendingMove.changes, true)}>Save anyway</button>
            </>
          )}>
          <ul className="clash-list">{pendingMove.conflicts.map((c, i) => <li key={i}>{c.message}</li>)}</ul>
          <p className="muted small">Saving anyway marks the timetable as having clashes, and it cannot be published until they are fixed.</p>
        </Modal>
      )}
    </div>
  );
}

function SlotDetails({ slot, rooms, onClose, onLock, onRemove, onRoom }) {
  const lab = isLab(slot);
  const fitting = rooms.filter((r) => (lab ? r.type !== 'Lecture Hall' : r.type === 'Lecture Hall') && r.capacity >= (slot.classSection?.studentCount || 0));
  return (
    <Modal title={slot.subject?.name} onClose={onClose}
      footer={(
        <>
          <button type="button" className="btn btn-outline" onClick={onRemove}><Trash2 size={16} /> Remove</button>
          <button type="button" className="btn btn-primary" onClick={onLock}>{slot.isLocked ? <><Unlock size={16} /> Unlock</> : <><Lock size={16} /> Lock in place</>}</button>
        </>
      )}>
      <dl className="details">
        <dt>Code</dt><dd>{slot.subject?.code} ({lab ? 'Practical, 2-hour block' : 'Theory lecture'})</dd>
        <dt>Division</dt><dd>{divisionLabel(slot.classSection)} ({slot.classSection?.studentCount} students)</dd>
        <dt>Faculty</dt><dd>{slot.teacher?.name}</dd>
        <dt>When</dt><dd>{DAY_LABELS[slot.day]}, {t12(slot.startTime)} – {t12(slot.endTime)}</dd>
        <dt>Room</dt>
        <dd>
          <select value={slot.classroom?._id} onChange={(e) => onRoom(e.target.value)} aria-label="Change room">
            {fitting.map((r) => <option key={r._id} value={r._id}>{r.roomNumber} ({r.type}, {r.capacity} seats)</option>)}
          </select>
        </dd>
      </dl>
    </Modal>
  );
}
