interface QuotaGaugeProps {
  mode: 'illustration' | 'live';
  utilizationPct?: number;
  pulledDisplay?: string;
  limitDisplay?: string;
  tokenSymbol?: string;
  active?: boolean;
  size?: number;
}

export function QuotaGauge({
  mode,
  utilizationPct = 0,
  pulledDisplay,
  limitDisplay,
  tokenSymbol,
  active = true,
  size = 188,
}: QuotaGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Illustration mode uses a clean geometric proportion without inventing any fake dollar/token figures
  const clampedPct =
    mode === 'illustration'
      ? 62
      : Math.min(100, Math.max(0, utilizationPct));

  const dashOffset = circumference - (clampedPct / 100) * circumference;
  const isWarningOrRevoked = !active || clampedPct >= 85;
  const strokeColor =
    mode === 'illustration'
      ? '#0F9D8F'
      : isWarningOrRevoked
      ? '#D64550'
      : '#0F9D8F';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.25s ease',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {mode === 'illustration' ? (
          <>
            <span className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Monthly Cap
            </span>
            <span className="mt-1 text-base font-semibold text-[#1F2A37]">
              Bounded Pull
            </span>
            <span className="mt-0.5 text-xs text-[#6B7785]">
              Self custody
            </span>
          </>
        ) : (
          <>
            <span className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              {active ? 'Used This Month' : 'Revoked'}
            </span>
            <span className="mt-1 font-mono text-2xl font-semibold text-[#1F2A37] tabular-nums">
              {pulledDisplay ?? '0'}
            </span>
            <span className="mt-0.5 font-mono text-xs text-[#6B7785] tabular-nums">
              of {limitDisplay ?? '0'} {tokenSymbol ?? ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
