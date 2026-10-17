import { useEffect, useState } from 'react';
import { FileDown, Printer, CalendarPlus } from 'lucide-react';
import { api, downloadFile } from '../../services/api';
import college from '../../config/college';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { EmptyState, ErrorNote, PhotoBanner, Spinner } from '../../components/common/ui';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import LiveClassBanner from '../../components/timetable/LiveClassBanner';
import { divisionLabel } from '../../config/schedule';
import { exportICS } from '../../services/calendarExport';

export default function StudentDashboard() {
  const { user } = useAuth();
  const notify = useToast();
  const own = user.student?.classSection;
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState(own?._id || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/public/sections').then((d) => {
      setSections(d.data);
      setSectionId((cur) => cur || d.data[0]?._id || '');
    }).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    api.get(`/student/timetable?section=${sectionId}`).then(setData).catch((e) => setError(e.message));
  }, [sectionId]);

  const section = data?.section;
  const isOwn = own && sectionId === own._id;

  return (
    <div className="page">
      <PhotoBanner
        image={college.images.students}
        title={`Welcome, ${user.name.split(' ')[0]}`}
        subtitle={own ? `${divisionLabel(own)}, roll no. ${user.student.rollNumber}` : 'Student portal'}
      />
      <ErrorNote error={error} />

      {data && isOwn && data.section?._id === sectionId && <LiveClassBanner slots={data.data} />}

      <section className="panel">
        <div className="panel-toolbar tt-toolbar">
          <label className="inline-field">
            <span>Division</span>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              {sections.map((s) => <option key={s._id} value={s._id}>{divisionLabel(s)}{own && s._id === own._id ? ' (mine)' : ''}</option>)}
            </select>
          </label>
          <div className="push-right toolbar-actions no-print">
            <button type="button" className="btn btn-outline btn-sm" disabled={!data?.data.length} onClick={() => exportICS(data.data, 'class-timetable')}>
              <CalendarPlus size={16} /> Add to calendar
            </button>
            <button type="button" className="btn btn-outline btn-sm" disabled={!data?.data.length} onClick={() => window.print()}>
              <Printer size={16} /> Print
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!data?.data.length}
              onClick={() => downloadFile(`/export/pdf/${sectionId}`, 'timetable.pdf').catch((e) => notify(e.message, 'error'))}>
              <FileDown size={16} /> Download PDF
            </button>
          </div>
        </div>

        {section && (
          <div className="print-head">
            <h2>{college.name}</h2>
            <p>Weekly timetable: {divisionLabel(section)}{section.classTeacher ? `. Class teacher: ${section.classTeacher.name}` : ''}</p>
          </div>
        )}

        {!data || data.section?._id !== sectionId ? <Spinner /> : data.data.length === 0 ? (
          <EmptyState title="Timetable not published yet">The college office has not released this division’s timetable. Check back soon.</EmptyState>
        ) : (
          <>
            <TimetableGrid slots={data.data} perspective="section" />
            <p className="muted small grid-legend"><span className="legend legend-theory" /> Theory <span className="legend legend-lab" /> Practical (2-hour lab)</p>
          </>
        )}
      </section>
    </div>
  );
}
