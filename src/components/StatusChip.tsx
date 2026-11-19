interface StatusChipProps {
  variant: 'active' | 'revoked' | 'warning' | 'neutral';
  label: string;
}

export function StatusChip({ variant, label }: StatusChipProps) {
  const styles = {
    active: {
      container: 'bg-[#E6F6F4] text-[#0A685F] border-[#B7EAE3]',
      dot: 'bg-[#0F9D8F]',
    },
    revoked: {
      container: 'bg-[#FDE8E9] text-[#9C1C26] border-[#F8C6CA]',
      dot: 'bg-[#D64550]',
    },
    warning: {
      container: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
      dot: 'bg-[#D97706]',
    },
    neutral: {
      container: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
      dot: 'bg-[#6B7785]',
    },
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[11px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap shrink-0 ${styles.container}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
