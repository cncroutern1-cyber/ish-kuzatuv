// Round carved rosette used as the app mark.
export default function Mark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#c9a227" />
      <g fill="none" stroke="#2b1d12" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M24 6L42 24 24 42 6 24Z" />
        <circle cx="24" cy="24" r="10" />
        <path d="M24 14l7 3 3 7-3 7-7 3-7-3-3-7 3-7Z" />
      </g>
      <circle cx="24" cy="24" r="3" fill="#2b1d12" />
    </svg>
  );
}
