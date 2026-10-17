import { DoorOpen, Projector } from 'lucide-react';
import CrudManager from './CrudManager';
import { Field } from '../../components/common/ui';
import { ROOM_TYPES } from '../../config/schedule';

const empty = { roomNumber: '', building: 'Academic Block B', floor: 1, capacity: 60, type: 'Lecture Hall', hasProjector: true };

export default function ClassroomManager() {
  return (
    <CrudManager
      title="Classrooms & Labs"
      noun="Room"
      icon={DoorOpen}
      path="/classrooms"
      description="Theory lectures are placed in lecture halls and practicals in matching labs, only where every student has a seat."
      emptyForm={empty}
      toPayload={(f) => ({ ...f, capacity: Number(f.capacity), floor: Number(f.floor) })}
      searchText={(r) => `${r.roomNumber} ${r.building} ${r.type}`}
      columns={[
        { label: 'Room', render: (r) => <strong>{r.roomNumber}</strong> },
        { label: 'Type', render: (r) => <span className={`tag ${r.type === 'Lecture Hall' ? 'tag-blue' : 'tag-green'}`}>{r.type}</span> },
        { label: 'Seats', render: (r) => r.capacity },
        { label: 'Location', render: (r) => `${r.building}, floor ${r.floor}` },
        { label: 'Projector', render: (r) => (r.hasProjector ? <Projector size={17} aria-label="Yes" /> : <span className="muted">No</span>) },
      ]}
      renderForm={(f, set) => {
        const on = (k) => (e) => set({ ...f, [k]: e.target.value });
        return (
          <>
            <Field label="Room name or number"><input required value={f.roomNumber} onChange={on('roomNumber')} placeholder="Room 402" /></Field>
            <Field label="Type"><select value={f.type} onChange={on('type')}>{ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Seating capacity"><input required type="number" min="1" value={f.capacity} onChange={on('capacity')} /></Field>
            <Field label="Building"><input value={f.building} onChange={on('building')} /></Field>
            <Field label="Floor"><input type="number" min="0" value={f.floor} onChange={on('floor')} /></Field>
            <label className="check">
              <input type="checkbox" checked={f.hasProjector} onChange={(e) => set({ ...f, hasProjector: e.target.checked })} /> Has a projector
            </label>
          </>
        );
      }}
    />
  );
}
