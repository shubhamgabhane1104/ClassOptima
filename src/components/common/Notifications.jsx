import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CalendarPlus, CheckCircle2, XCircle, Megaphone } from 'lucide-react';
import { api } from '../../services/api';

const ICONS = {
  'extra-lecture': CalendarPlus,
  'booking-confirmed': CheckCircle2,
  'booking-cancelled': XCircle,
  general: Megaphone,
};

const ago = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Shared hook: loads notifications and refreshes every minute
// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(() => api.get('/notifications').then((d) => {
    setItems(d.data);
    setUnread(d.unread);
  }).catch(() => {}), []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    // keep the bell and the dashboard notices in sync
    const onRead = () => {
      setUnread(0);
      setItems((list) => list.map((n) => ({ ...n, read: true })));
    };
    window.addEventListener('notifications-read', onRead);
    return () => {
      clearInterval(t);
      window.removeEventListener('notifications-read', onRead);
    };
  }, [load]);

  const markRead = useCallback(async () => {
    await api.patch('/notifications/read').catch(() => {});
    window.dispatchEvent(new Event('notifications-read'));
  }, []);

  return { items, unread, markRead, reload: load };
}

function NotificationList({ items, limit }) {
  if (!items.length) return <p className="muted small notif-empty">No notifications yet.</p>;
  return (
    <ul className="notif-list">
      {items.slice(0, limit).map((n) => {
        const Icon = ICONS[n.type] || Megaphone;
        return (
          <li key={n._id} className={`notif notif-${n.type} ${n.read ? '' : 'unread'}`}>
            <span className="notif-icon"><Icon size={17} /></span>
            <div>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <span className="notif-time">{ago(n.createdAt)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// Bell in the top bar with an unread badge and a dropdown
export function NotificationBell() {
  const { items, unread, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open && unread) markRead();
  };

  return (
    <div className="bell" ref={ref}>
      <button type="button" className="bell-btn" onClick={toggle} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell size={19} />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="bell-panel" role="dialog" aria-label="Notifications">
          <h3>Notifications</h3>
          <NotificationList items={items} limit={12} />
        </div>
      )}
    </div>
  );
}

// Card on the dashboard showing the latest notices
export function NoticesPanel({ title = 'Notices' }) {
  const { items } = useNotifications();
  if (!items.length) return null;
  return (
    <section className="panel notices">
      <h2 className="panel-title">{title}</h2>
      <NotificationList items={items} limit={4} />
    </section>
  );
}
