interface LinearQuotaBarProps {
  utilizationPct: number;
  active?: boolean;
  allowancePct?: number;
}

export function LinearQuotaBar({
  utilizationPct,
  active = true,
  allowancePct,
}: LinearQuotaBarProps) {
  const clamped = Math.min(100, Math.max(0, utilizationPct));
  const fillColor = !active || clamped >= 85 ? 'bg-[#D64550]' : 'bg-[#0F9D8F]';
  const clampedAllowance =
    typeof allowancePct === 'number'
      ? Math.min(100, Math.max(0, allowancePct))
      : null;

  return (
    <div className="relative w-full h-2 bg-[#E2E8F0] rounded-full overflow-visible">
      <div
        className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
        style={{ width: `${clamped}%` }}
      />
      {clampedAllowance !== null && clampedAllowance < 100 && (
        <div
          className="absolute -top-1 w-0.5 h-4 bg-[#1F2A37] rounded-full"
          style={{ left: `${clampedAllowance}%` }}
          title="Current ERC20 allowance level"
        />
      )}
    </div>
  );
}
