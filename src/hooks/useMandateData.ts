import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { ARC_CHAIN_ID, CONTRACT_ADDRESS, getTokenByAddress } from '../config/chain';
import {
  ERC20_ABI,
  type MandateRecord,
  normalizeMandateResult,
  normalizePlatformStats,
  normalizePullHistoryResult,
  type PlatformStatsRecord,
  type PullHistoryRecord,
} from '../lib/abiAdapter';
import { useZekferowAbi } from './useZekferowAbi';

export interface EnrichedMandate {
  mandate: MandateRecord;
  pulledThisMonth: bigint;
  decimals: number;
  tokenSymbol: string;
  userAllowance: bigint;
  userBalance: bigint;
}

export function usePlatformStats() {
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { abi, resolved } = useZekferowAbi();

  return useQuery<PlatformStatsRecord | null>({
    queryKey: ['platform-stats', CONTRACT_ADDRESS, resolved.getPlatformStats],
    enabled: Boolean(CONTRACT_ADDRESS && publicClient),
    staleTime: 15_000,
    retry: 1,
    queryFn: async () => {
      if (!CONTRACT_ADDRESS || !publicClient) return null;
      const raw = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: resolved.getPlatformStats,
      });
      return normalizePlatformStats(raw);
    },
  });
}

async function hydrateMandateList(
  ids: bigint[],
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  abi: ReturnType<typeof useZekferowAbi>['abi'],
  resolved: ReturnType<typeof useZekferowAbi>['resolved']
): Promise<EnrichedMandate[]> {
  if (!CONTRACT_ADDRESS || ids.length === 0) return [];

  const mandateReads = await Promise.all(
    ids.map(async (id) => {
      const [rawMandate, rawPulled] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS!,
          abi,
          functionName: resolved.getMandate,
          args: [id],
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS!,
          abi,
          functionName: resolved.getPulledThisMonth,
          args: [id],
        }),
      ]);
      const mandate = normalizeMandateResult(rawMandate, id);
      if (!mandate) return null;
      return {
        mandate,
        pulledThisMonth: typeof rawPulled === 'bigint' ? rawPulled : BigInt(String(rawPulled ?? 0)),
      };
    })
  );

  const valid = mandateReads.filter((item): item is NonNullable<typeof item> => item !== null);
  const uniqueTokens = Array.from(new Set(valid.map((v) => v.mandate.token.toLowerCase())));

  const tokenMetaMap = new Map<string, { decimals: number; symbol: string }>();
  await Promise.all(
    uniqueTokens.map(async (tokenLower) => {
      const tokenAddr = valid.find((v) => v.mandate.token.toLowerCase() === tokenLower)!.mandate.token;
      const known = getTokenByAddress(tokenAddr);
      try {
        const [dec, sym] = await Promise.all([
          publicClient.readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }),
          publicClient.readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: 'symbol',
          }),
        ]);
        tokenMetaMap.set(tokenLower, {
          decimals: Number(dec),
          symbol: String(sym || known?.symbol || 'TOKEN'),
        });
      } catch {
        tokenMetaMap.set(tokenLower, {
          decimals: 6,
          symbol: known?.symbol || 'TOKEN',
        });
      }
    })
  );

  const enriched = await Promise.all(
    valid.map(async ({ mandate, pulledThisMonth }) => {
      const meta = tokenMetaMap.get(mandate.token.toLowerCase()) ?? {
        decimals: 6,
        symbol: getTokenByAddress(mandate.token)?.symbol || 'TOKEN',
      };

      const [allowanceRaw, balanceRaw] = await Promise.all([
        publicClient.readContract({
          address: mandate.token,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [mandate.user, CONTRACT_ADDRESS!],
        }),
        publicClient.readContract({
          address: mandate.token,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [mandate.user],
        }),
      ]);

      return {
        mandate,
        pulledThisMonth,
        decimals: meta.decimals,
        tokenSymbol: meta.symbol,
        userAllowance: typeof allowanceRaw === 'bigint' ? allowanceRaw : 0n,
        userBalance: typeof balanceRaw === 'bigint' ? balanceRaw : 0n,
      };
    })
  );

  return enriched;
}

export function useUserMandates(userAddress?: `0x${string}`) {
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { abi, resolved } = useZekferowAbi();

  return useQuery<EnrichedMandate[]>({
    queryKey: ['user-mandates', CONTRACT_ADDRESS, userAddress, resolved.getMandatesByUser],
    enabled: Boolean(CONTRACT_ADDRESS && userAddress && publicClient),
    staleTime: 10_000,
    queryFn: async () => {
      if (!CONTRACT_ADDRESS || !userAddress || !publicClient) return [];
      const rawIds = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: resolved.getMandatesByUser,
        args: [userAddress],
      });
      const ids = Array.isArray(rawIds) ? rawIds.map((id) => BigInt(id)) : [];
      return hydrateMandateList(ids, publicClient, abi, resolved);
    },
  });
}

export function useMerchantMandates(merchantAddress?: `0x${string}`) {
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { abi, resolved } = useZekferowAbi();

  return useQuery<EnrichedMandate[]>({
    queryKey: ['merchant-mandates', CONTRACT_ADDRESS, merchantAddress, resolved.getMandatesByMerchant],
    enabled: Boolean(CONTRACT_ADDRESS && merchantAddress && publicClient),
    staleTime: 10_000,
    queryFn: async () => {
      if (!CONTRACT_ADDRESS || !merchantAddress || !publicClient) return [];
      const rawIds = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: resolved.getMandatesByMerchant,
        args: [merchantAddress],
      });
      const ids = Array.isArray(rawIds) ? rawIds.map((id) => BigInt(id)) : [];
      const list = await hydrateMandateList(ids, publicClient, abi, resolved);
      // Enforce strictly displaying mandates where connected wallet is the merchant
      return list.filter(
        (item) => item.mandate.merchant.toLowerCase() === merchantAddress.toLowerCase()
      );
    },
  });
}

export interface MandateDetailData {
  enriched: EnrichedMandate;
  pullHistory: PullHistoryRecord[];
}

export function useMandateDetail(mandateIdRaw?: string) {
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const { abi, resolved } = useZekferowAbi();

  let parsedId: bigint | null = null;
  if (mandateIdRaw && /^\d+$/.test(mandateIdRaw)) {
    parsedId = BigInt(mandateIdRaw);
  }

  return useQuery<MandateDetailData | null>({
    queryKey: ['mandate-detail', CONTRACT_ADDRESS, parsedId?.toString(), resolved.getMandate],
    enabled: Boolean(CONTRACT_ADDRESS && parsedId !== null && publicClient),
    staleTime: 10_000,
    queryFn: async () => {
      if (!CONTRACT_ADDRESS || parsedId === null || !publicClient) return null;
      const list = await hydrateMandateList([parsedId], publicClient, abi, resolved);
      if (list.length === 0) return null;

      let pullHistory: PullHistoryRecord[] = [];
      try {
        const rawHistory = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi,
          functionName: resolved.getPullHistory,
          args: [parsedId],
        });
        pullHistory = normalizePullHistoryResult(rawHistory);
      } catch {
        pullHistory = [];
      }

      return {
        enriched: list[0],
        pullHistory,
      };
    },
  });
}
