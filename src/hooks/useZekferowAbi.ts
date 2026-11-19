import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ARC_EXPLORER_URL, CONTRACT_ADDRESS } from '../config/chain';
import {
  DEFAULT_ZEKFEROW_ABI,
  fetchVerifiedAbiFromExplorer,
  resolveContractFunctions,
} from '../lib/abiAdapter';

import type { Abi } from 'viem';

export function useZekferowAbi() {
  const query = useQuery({
    queryKey: ['zekferow-abi', CONTRACT_ADDRESS],
    enabled: Boolean(CONTRACT_ADDRESS),
    staleTime: 1000 * 60 * 30,
    retry: 1,
    queryFn: async () => {
      if (!CONTRACT_ADDRESS) return null;
      return fetchVerifiedAbiFromExplorer(CONTRACT_ADDRESS, ARC_EXPLORER_URL);
    },
  });

  const abi: Abi = (query.data ?? DEFAULT_ZEKFEROW_ABI) as Abi;
  const resolved = useMemo(() => resolveContractFunctions(abi), [abi]);

  return {
    abi,
    resolved,
    isLoadingAbi: query.isLoading,
    abiSource: query.data ? ('explorer' as const) : ('default' as const),
  };
}
