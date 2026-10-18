import college from '../../config/college';

// College logo.
// - If `logo` is set in src/config/college.js (e.g. '/images/logo.png'), that image is shown.
// - Otherwise this drawn seal is used: a lamp of learning (diya) above an open book,
//   inside a maroon ring with a marigold border.
export default function Crest({ size = 40 }) {
  if (college.logo) {
    return <img src={college.logo} alt="" width={size} height={size} className="crest crest-img" />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="crest">
      {/* outer ring */}
      <circle cx="24" cy="24" r="22.5" fill="var(--brand)" stroke="var(--accent)" strokeWidth="2" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="var(--accent)" strokeWidth="0.9" strokeDasharray="1.6 1.9" />
      {/* flame */}
      <path d="M24 9.5 C26.6 12.6 27.2 15 24 18.4 C20.8 15 21.4 12.6 24 9.5 Z" fill="var(--accent)" />
      <path d="M24 12.6 C25.1 14 25.2 15.2 24 16.6 C22.8 15.2 22.9 14 24 12.6 Z" fill="#fff4dc" />
      {/* diya (lamp) */}
      <path d="M17.5 19.6 H30.5 C30 22.6 27.4 24.4 24 24.4 C20.6 24.4 18 22.6 17.5 19.6 Z" fill="var(--accent)" />
      {/* open book */}
      <path d="M12.5 27 C16.5 25.6 20.6 26 24 28.4 C27.4 26 31.5 25.6 35.5 27 V36 C31.5 34.7 27.4 35 24 37.4 C20.6 35 16.5 34.7 12.5 36 Z" fill="#fff4dc" />
      <path d="M24 28.4 V37.4" stroke="var(--brand)" strokeWidth="1.1" />
      <path d="M15.2 29.6 C17.6 29 20 29.3 22 30.4 M15.2 32.4 C17.6 31.8 20 32.1 22 33.2 M26 30.4 C28 29.3 30.4 29 32.8 29.6 M26 33.2 C28 32.1 30.4 31.8 32.8 32.4"
        stroke="var(--brand)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}
