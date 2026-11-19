import type { Abi, AbiFunction } from 'viem';

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const satisfies Abi;

export const DEFAULT_ZEKFEROW_ABI = [
  {
    type: 'function',
    name: 'createMandate',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'merchant', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'monthlyLimit', type: 'uint256' },
    ],
    outputs: [{ name: 'mandateId', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'updateLimit',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'mandateId', type: 'uint256' },
      { name: 'newMonthlyLimit', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'revokeMandate',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'mandateId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'pullPayment',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'mandateId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getMandate',
    stateMutability: 'view',
    inputs: [{ name: 'mandateId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'user', type: 'address' },
          { name: 'merchant', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'monthlyLimit', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'createdAt', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getMandatesByUser',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getMandatesByMerchant',
    stateMutability: 'view',
    inputs: [{ name: 'merchant', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getPulledThisMonth',
    stateMutability: 'view',
    inputs: [{ name: 'mandateId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPullHistory',
    stateMutability: 'view',
    inputs: [{ name: 'mandateId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'mandateId', type: 'uint256' },
          { name: 'merchant', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getPlatformStats',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalMandates', type: 'uint256' },
      { name: 'activeMandates', type: 'uint256' },
      { name: 'totalPulls', type: 'uint256' },
    ],
  },
] as const satisfies Abi;

export interface ResolvedContractFunctions {
  createMandate: string;
  updateLimit: string;
  revokeMandate: string;
  pullPayment: string;
  getMandate: string;
  getMandatesByUser: string;
  getMandatesByMerchant: string;
  getPulledThisMonth: string;
  getPullHistory: string;
  getPlatformStats: string;
}

export interface MandateRecord {
  id: bigint;
  user: `0x${string}`;
  merchant: `0x${string}`;
  token: `0x${string}`;
  monthlyLimit: bigint;
  active: boolean;
  createdAt: bigint;
}

export interface PullHistoryRecord {
  mandateId: bigint;
  merchant: `0x${string}`;
  amount: bigint;
  timestamp: bigint;
}

export interface PlatformStatsRecord {
  totalMandates: bigint;
  activeMandates: bigint;
  totalPulls: bigint;
}

function findAbiFunction(
  abi: Abi,
  candidates: string[],
  fallback: string
): string {
  const fns = abi.filter((item): item is AbiFunction => item.type === 'function');
  for (const candidate of candidates) {
    const exact = fns.find((fn) => fn.name.toLowerCase() === candidate.toLowerCase());
    if (exact) return exact.name;
  }
  for (const candidate of candidates) {
    const partial = fns.find((fn) =>
      fn.name.toLowerCase().includes(candidate.toLowerCase())
    );
    if (partial) return partial.name;
  }
  return fallback;
}

export function resolveContractFunctions(abi: Abi): ResolvedContractFunctions {
  return {
    createMandate: findAbiFunction(
      abi,
      ['createMandate', 'authorizeMerchant', 'newMandate'],
      'createMandate'
    ),
    updateLimit: findAbiFunction(
      abi,
      ['updateLimit', 'changeLimit', 'setMonthlyLimit', 'updateMandateLimit'],
      'updateLimit'
    ),
    revokeMandate: findAbiFunction(
      abi,
      ['revokeMandate', 'revoke', 'cancelMandate'],
      'revokeMandate'
    ),
    pullPayment: findAbiFunction(
      abi,
      ['pullPayment', 'pull', 'chargeMandate'],
      'pullPayment'
    ),
    getMandate: findAbiFunction(
      abi,
      ['getMandate', 'mandates', 'mandate'],
      'getMandate'
    ),
    getMandatesByUser: findAbiFunction(
      abi,
      ['getMandatesByUser', 'getUserMandates', 'userMandates'],
      'getMandatesByUser'
    ),
    getMandatesByMerchant: findAbiFunction(
      abi,
      ['getMandatesByMerchant', 'getMerchantMandates', 'merchantMandates'],
      'getMandatesByMerchant'
    ),
    getPulledThisMonth: findAbiFunction(
      abi,
      ['getPulledThisMonth', 'pulledThisMonth', 'getMonthlyPulled'],
      'getPulledThisMonth'
    ),
    getPullHistory: findAbiFunction(
      abi,
      ['getPullHistory', 'pullHistory', 'getMandatePulls'],
      'getPullHistory'
    ),
    getPlatformStats: findAbiFunction(
      abi,
      ['getPlatformStats', 'platformStats', 'getStats'],
      'getPlatformStats'
    ),
  };
}

export function normalizeMandateResult(
  raw: unknown,
  fallbackId?: bigint
): MandateRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  if (Array.isArray(raw)) {
    if (raw.length < 6) return null;
    // Handle tuple either starting with id or user address
    const firstIsAddress = typeof raw[0] === 'string' && raw[0].startsWith('0x');
    if (firstIsAddress) {
      return {
        id: fallbackId ?? 0n,
        user: raw[0] as `0x${string}`,
        merchant: raw[1] as `0x${string}`,
        token: raw[2] as `0x${string}`,
        monthlyLimit: BigInt(raw[3] ?? 0),
        active: Boolean(raw[4]),
        createdAt: BigInt(raw[5] ?? 0),
      };
    }
    return {
      id: BigInt(raw[0] ?? fallbackId ?? 0),
      user: raw[1] as `0x${string}`,
      merchant: raw[2] as `0x${string}`,
      token: raw[3] as `0x${string}`,
      monthlyLimit: BigInt(raw[4] ?? 0),
      active: Boolean(raw[5]),
      createdAt: BigInt(raw[6] ?? 0),
    };
  }

  const obj = raw as Record<string, unknown>;
  const user = (obj.user ?? obj.payer ?? obj.owner) as `0x${string}` | undefined;
  const merchant = (obj.merchant ?? obj.recipient ?? obj.payee) as `0x${string}` | undefined;
  const token = (obj.token ?? obj.asset) as `0x${string}` | undefined;
  if (!user || !merchant || !token) return null;

  return {
    id: BigInt((obj.id ?? obj.mandateId ?? fallbackId ?? 0) as string | number | bigint),
    user,
    merchant,
    token,
    monthlyLimit: BigInt((obj.monthlyLimit ?? obj.limit ?? 0) as string | number | bigint),
    active: Boolean(obj.active ?? obj.isActive ?? !(obj.revoked ?? false)),
    createdAt: BigInt((obj.createdAt ?? obj.timestamp ?? 0) as string | number | bigint),
  };
}

export function normalizePullHistoryResult(raw: unknown): PullHistoryRecord[] {
  if (!Array.isArray(raw)) return [];
  const results: PullHistoryRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    if (Array.isArray(item)) {
      if (item.length < 3) continue;
      const firstIsAddress = typeof item[0] === 'string' && item[0].startsWith('0x');
      if (firstIsAddress) {
        results.push({
          mandateId: 0n,
          merchant: item[0] as `0x${string}`,
          amount: BigInt(item[1] ?? 0),
          timestamp: BigInt(item[2] ?? 0),
        });
      } else {
        results.push({
          mandateId: BigInt(item[0] ?? 0),
          merchant: item[1] as `0x${string}`,
          amount: BigInt(item[2] ?? 0),
          timestamp: BigInt(item[3] ?? 0),
        });
      }
    } else {
      const obj = item as Record<string, unknown>;
      results.push({
        mandateId: BigInt((obj.mandateId ?? 0) as string | number | bigint),
        merchant: (obj.merchant ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
        amount: BigInt((obj.amount ?? 0) as string | number | bigint),
        timestamp: BigInt((obj.timestamp ?? obj.pulledAt ?? 0) as string | number | bigint),
      });
    }
  }
  return results;
}

export function normalizePlatformStats(raw: unknown): PlatformStatsRecord | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    if (raw.length < 3) return null;
    return {
      totalMandates: BigInt(raw[0] ?? 0),
      activeMandates: BigInt(raw[1] ?? 0),
      totalPulls: BigInt(raw[2] ?? 0),
    };
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      totalMandates: BigInt((obj.totalMandates ?? 0) as string | number | bigint),
      activeMandates: BigInt((obj.activeMandates ?? 0) as string | number | bigint),
      totalPulls: BigInt((obj.totalPulls ?? 0) as string | number | bigint),
    };
  }
  return null;
}

export async function fetchVerifiedAbiFromExplorer(
  contractAddress: `0x${string}`,
  explorerBaseUrl: string
): Promise<Abi | null> {
  try {
    const v2Res = await fetch(
      `${explorerBaseUrl}/api/v2/smart-contracts/${contractAddress}`,
      { headers: { Accept: 'application/json' } }
    );
    if (v2Res.ok) {
      const v2Json = (await v2Res.json()) as { abi?: unknown };
      if (Array.isArray(v2Json.abi) && v2Json.abi.length > 0) {
        return v2Json.abi as Abi;
      }
    }
  } catch {
    // Fall through to legacy Etherscan-compatible endpoint
  }

  try {
    const v1Res = await fetch(
      `${explorerBaseUrl}/api?module=contract&action=getabi&address=${contractAddress}`
    );
    if (v1Res.ok) {
      const v1Json = (await v1Res.json()) as { status?: string; result?: string };
      if (v1Json.status === '1' && typeof v1Json.result === 'string') {
        const parsed = JSON.parse(v1Json.result) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Abi;
        }
      }
    }
  } catch {
    // Ignore explorer network failure
  }

  return null;
}
