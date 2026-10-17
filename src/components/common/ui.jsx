// Small shared UI building blocks.
import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose} role="presentation">
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </section>
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

// Photo banner used at the top of each dashboard
export function PhotoBanner({ image, title, subtitle, children }) {
  return (
    <section className="photo-banner" style={{ '--banner-img': `url("${image}")` }}>
      <div className="photo-banner-inner">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children && <div className="photo-banner-aside">{children}</div>}
      </div>
    </section>
  );
}

export function Field({ label, hint, children, span }) {
  return (
    <label className={`field ${span ? 'field-span' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="spinner" role="status">
      <Loader2 className="spin" size={22} />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={34} strokeWidth={1.5} />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <div className="error-note" role="alert">{error}</div>;
}

export function Stat({ icon: Icon, value, label, tone }) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ''}`}>
      {Icon && <span className="stat-icon"><Icon size={20} /></span>}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
