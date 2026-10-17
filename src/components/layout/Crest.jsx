// College crest: a shield with an open book. Replace with your college logo
// by swapping this component for <img src="/images/logo.png" alt="" />.
export default function Crest({ size = 40 }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" aria-hidden="true" className="crest">
      <path d="M20 1 L38 6 V22 C38 34 30 41 20 45 C10 41 2 34 2 22 V6 Z" fill="var(--navy)" stroke="var(--gold)" strokeWidth="2" />
      <path d="M8 17 C13 15 17 16 20 18.5 C23 16 27 15 32 17 V30 C27 28 23 29 20 31.5 C17 29 13 28 8 30 Z" fill="var(--gold)" />
      <path d="M20 18.5 V31.5" stroke="var(--navy)" strokeWidth="1.4" />
      <circle cx="20" cy="10" r="2.4" fill="var(--gold)" />
    </svg>
  );
}
