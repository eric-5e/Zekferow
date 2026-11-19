import { formatUnits, parseUnits } from 'viem';

export interface QuotaMetrics {
  remaining: bigint;
  utilizationPct: number;
  isOverThreshold: boolean;
  isAllowanceLow: boolean;
  allowanceShortfall: bigint;
}

export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function shortenAddress(address?: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 4) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTokenAmount(
  raw: bigint,
  decimals: number,
  maxFractionDigits = 2
): string {
  const formatted = formatUnits(raw, decimals);
  const [intPart, fracPart = ''] = formatted.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (maxFractionDigits <= 0) {
    return withCommas;
  }

  const trimmedFrac = fracPart.slice(0, maxFractionDigits).replace(/0+$/, '');
  if (!trimmedFrac) {
    return withCommas;
  }
  return `${withCommas}.${trimmedFrac}`;
}

export function parseTokenAmount(input: string, decimals: number): bigint | null {
  const cleaned = input.trim().replace(/,/g, '');
  if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) {
    return null;
  }
  const parts = cleaned.split('.');
  if (parts[1] && parts[1].length > decimals) {
    return null;
  }
  try {
    const parsed = parseUnits(cleaned, decimals);
    return parsed >= 0n ? parsed : null;
  } catch {
    return null;
  }
}

export function computeQuotaMetrics(
  pulled: bigint,
  limit: bigint,
  allowance: bigint
): QuotaMetrics {
  const remaining = limit > pulled ? limit - pulled : 0n;
  let utilizationPct = 0;
  if (limit > 0n) {
    const scaled = Number((pulled * 10000n) / limit) / 100;
    utilizationPct = Math.min(100, Math.max(0, scaled));
  }
  const isOverThreshold = utilizationPct >= 85;
  const isAllowanceLow = allowance < limit;
  const allowanceShortfall = allowance < limit ? limit - allowance : 0n;

  return {
    remaining,
    utilizationPct,
    isOverThreshold,
    isAllowanceLow,
    allowanceShortfall,
  };
}

export function getNextMonthResetInfo(now = new Date()): {
  resetDateLabel: string;
  daysRemaining: number;
} {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const nextReset = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  const diffMs = nextReset.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const resetDateLabel = nextReset.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return { resetDateLabel, daysRemaining };
}
