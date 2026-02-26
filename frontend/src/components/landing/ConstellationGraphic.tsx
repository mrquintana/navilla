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
      {/* ─── Connection lines ─── */}

      {/* Primary hub connections (thicker) */}
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round">
        <line x1="210" y1="205" x2="145" y2="165" />
        <line x1="210" y1="205" x2="270" y2="155" />
        <line x1="210" y1="205" x2="280" y2="240" />
        <line x1="210" y1="205" x2="175" y2="270" />
        <line x1="210" y1="205" x2="155" y2="225" />
        <line x1="210" y1="205" x2="240" y2="165" />
        <line x1="210" y1="205" x2="230" y2="260" />
      </g>

      {/* Central cluster connections */}
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round">
        <line x1="145" y1="165" x2="155" y2="225" />
        <line x1="145" y1="165" x2="190" y2="148" />
        <line x1="155" y1="225" x2="175" y2="270" />
        <line x1="270" y1="155" x2="280" y2="240" />
        <line x1="270" y1="155" x2="240" y2="165" />
        <line x1="280" y1="240" x2="230" y2="260" />
        <line x1="240" y1="165" x2="270" y2="155" />
        <line x1="175" y1="270" x2="230" y2="260" />
        <line x1="190" y1="148" x2="240" y2="165" />
        <line x1="155" y1="225" x2="175" y2="270" />
      </g>

      {/* Upper-left cluster */}
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round">
        <line x1="95" y1="115" x2="120" y2="85" />
        <line x1="95" y1="115" x2="70" y2="140" />
        <line x1="95" y1="115" x2="130" y2="140" />
        <line x1="120" y1="85" x2="155" y2="95" />
        <line x1="130" y1="140" x2="145" y2="165" />
        <line x1="95" y1="115" x2="145" y2="165" />
        <line x1="70" y1="140" x2="80" y2="180" />
        <line x1="80" y1="180" x2="155" y2="225" />
        <line x1="155" y1="95" x2="190" y2="148" />
        <line x1="120" y1="85" x2="75" y2="60" />
        <line x1="70" y1="140" x2="40" y2="165" />
      </g>

      {/* Lower-right cluster */}
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round">
        <line x1="320" y1="305" x2="350" y2="280" />
        <line x1="320" y1="305" x2="290" y2="330" />
        <line x1="320" y1="305" x2="355" y2="330" />
        <line x1="320" y1="305" x2="345" y2="350" />
        <line x1="350" y1="280" x2="280" y2="240" />
        <line x1="290" y1="330" x2="230" y2="260" />
        <line x1="290" y1="330" x2="175" y2="270" />
        <line x1="355" y1="330" x2="380" y2="350" />
        <line x1="345" y1="350" x2="380" y2="350" />
        <line x1="350" y1="280" x2="370" y2="255" />
      </g>

      {/* Bridge lines between clusters */}
      <g stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeLinecap="round">
        <line x1="270" y1="155" x2="310" y2="120" />
        <line x1="310" y1="120" x2="350" y2="100" />
        <line x1="310" y1="120" x2="340" y2="155" />
        <line x1="340" y1="155" x2="350" y2="280" />
        <line x1="280" y1="240" x2="320" y2="305" />
        <line x1="230" y1="260" x2="290" y2="330" />
        <line x1="145" y1="165" x2="95" y2="115" />
        <line x1="155" y1="225" x2="120" y2="290" />
        <line x1="120" y1="290" x2="175" y2="270" />
      </g>

      {/* Peripheral whisker lines */}
      <g stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round">
        <line x1="350" y1="100" x2="385" y2="75" />
        <line x1="370" y1="255" x2="400" y2="260" />
        <line x1="40" y1="165" x2="30" y2="200" />
        <line x1="120" y1="290" x2="90" y2="330" />
        <line x1="90" y1="330" x2="65" y2="355" />
        <line x1="190" y1="148" x2="195" y2="90" />
        <line x1="195" y1="90" x2="230" y2="60" />
      </g>

      {/* ─── Animated glow rings ─── */}
      <circle cx="210" cy="205" r="24" fill="rgba(255,255,255,0.08)" className="constellation-pulse" />
      <circle cx="95" cy="115" r="16" fill="rgba(255,255,255,0.06)" className="constellation-pulse-delay" />
      <circle cx="320" cy="305" r="16" fill="rgba(255,255,255,0.05)" className="constellation-pulse-delay-2" />

      {/* ─── Primary hub node ─── */}
      <circle cx="210" cy="205" r="10" fill="#ffffff" />

      {/* ─── Secondary hub nodes ─── */}
      <circle cx="95" cy="115" r="7" fill="#e0e7ff" />
      <circle cx="270" cy="155" r="6.5" fill="#e0e7ff" />
      <circle cx="155" cy="225" r="6.5" fill="#e0e7ff" />
      <circle cx="320" cy="305" r="7" fill="#e0e7ff" />
      <circle cx="280" cy="240" r="6" fill="#ddd6fe" />
      <circle cx="175" cy="270" r="6" fill="#ddd6fe" />

      {/* ─── Mid-range nodes ─── */}
      <circle cx="145" cy="165" r="5" fill="#c7d2fe" />
      <circle cx="240" cy="165" r="4.5" fill="#c7d2fe" />
      <circle cx="230" cy="260" r="4.5" fill="#c7d2fe" />
      <circle cx="190" cy="148" r="4" fill="#c7d2fe" />
      <circle cx="310" cy="120" r="4.5" fill="#c7d2fe" />
      <circle cx="350" cy="280" r="4" fill="#c7d2fe" />
      <circle cx="290" cy="330" r="4" fill="#c7d2fe" />
      <circle cx="130" cy="140" r="4" fill="rgba(255,255,255,0.6)" />
      <circle cx="120" cy="85" r="4.5" fill="#c7d2fe" />
      <circle cx="340" cy="155" r="3.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="355" cy="330" r="3.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="80" cy="180" r="3.5" fill="rgba(255,255,255,0.55)" />
      <circle cx="120" cy="290" r="3.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="345" cy="350" r="3.5" fill="rgba(255,255,255,0.5)" />
      <circle cx="155" cy="95" r="3.5" fill="rgba(255,255,255,0.5)" />

      {/* ─── Peripheral nodes ─── */}
      <circle cx="70" cy="140" r="3" fill="rgba(255,255,255,0.35)" />
      <circle cx="40" cy="165" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="30" cy="200" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="75" cy="60" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="350" cy="100" r="3" fill="rgba(255,255,255,0.35)" />
      <circle cx="385" cy="75" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="370" cy="255" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="400" cy="260" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="380" cy="350" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="90" cy="330" r="2.5" fill="rgba(255,255,255,0.25)" />
      <circle cx="65" cy="355" r="2" fill="rgba(255,255,255,0.2)" />
      <circle cx="195" cy="90" r="2.5" fill="rgba(255,255,255,0.3)" />
      <circle cx="230" cy="60" r="2" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}
