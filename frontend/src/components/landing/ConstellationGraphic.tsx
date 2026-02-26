interface ConstellationGraphicProps {
  className?: string;
}

export function ConstellationGraphic({ className }: ConstellationGraphicProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
    >
      {/* Connection lines — light so they glow on dark plum background */}
      <g stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="90" y1="210" x2="170" y2="130" />
        <line x1="90" y1="210" x2="180" y2="290" />
        <line x1="170" y1="130" x2="270" y2="150" />
        <line x1="170" y1="130" x2="210" y2="210" />
        <line x1="180" y1="290" x2="210" y2="210" />
        <line x1="180" y1="290" x2="295" y2="310" />
        <line x1="210" y1="210" x2="270" y2="150" />
        <line x1="210" y1="210" x2="295" y2="310" />
        <line x1="270" y1="150" x2="340" y2="190" />
        <line x1="295" y1="310" x2="340" y2="190" />
        <line x1="340" y1="190" x2="210" y2="210" />
        <line x1="90" y1="210" x2="130" y2="105" />
        <line x1="130" y1="105" x2="170" y2="130" />
        <line x1="270" y1="150" x2="355" y2="108" />
        <line x1="295" y1="310" x2="360" y2="350" />
      </g>

      {/* Animated glow rings on primary nodes */}
      <circle cx="210" cy="210" r="22" fill="rgba(255,255,255,0.08)" className="constellation-pulse" />
      <circle cx="90" cy="210" r="14" fill="rgba(255,255,255,0.06)" className="constellation-pulse-delay" />
      <circle cx="340" cy="190" r="14" fill="rgba(255,255,255,0.05)" className="constellation-pulse-delay-2" />

      {/* Primary hub node */}
      <circle cx="210" cy="210" r="9" fill="#ffffff" />

      {/* Secondary nodes */}
      <circle cx="90" cy="210" r="6.5" fill="#e0e7ff" />
      <circle cx="170" cy="130" r="5.5" fill="#c7d2fe" />
      <circle cx="180" cy="290" r="5.5" fill="#c7d2fe" />
      <circle cx="270" cy="150" r="7" fill="#e0e7ff" />
      <circle cx="295" cy="310" r="5" fill="#c7d2fe" />
      <circle cx="340" cy="190" r="6" fill="#c7d2fe" />

      {/* Tertiary nodes */}
      <circle cx="130" cy="105" r="4" fill="rgba(255,255,255,0.55)" />
      <circle cx="355" cy="108" r="3.5" fill="rgba(255,255,255,0.45)" />
      <circle cx="360" cy="350" r="3.5" fill="rgba(255,255,255,0.45)" />
      <circle cx="55" cy="150" r="3" fill="rgba(255,255,255,0.3)" />
      <circle cx="60" cy="320" r="2.5" fill="rgba(255,255,255,0.3)" />
      <circle cx="380" cy="270" r="2.5" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}
