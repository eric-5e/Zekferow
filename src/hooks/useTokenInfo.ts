import { useReadContracts } from 'wagmi';
import { ARC_CHAIN_ID, CONTRACT_ADDRESS } from '../config/chain';
import { ERC20_ABI } from '../lib/abiAdapter';

export function useTokenInfo(
  tokenAddress?: `0x${string}`,
  ownerAddress?: `0x${string}`,
  spenderAddress: `0x${string}` | undefined = CONTRACT_ADDRESS
) {
  const hasToken = Boolean(tokenAddress);
  const hasOwner = Boolean(ownerAddress);
  const hasSpender = Boolean(spenderAddress);

  const contracts = [
    ...(hasToken
      ? [
          {
            address: tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'decimals' as const,
            chainId: ARC_CHAIN_ID,
          },
          {
            address: tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'symbol' as const,
            chainId: ARC_CHAIN_ID,
          },
        ]
      : []),
    ...(hasToken && hasOwner
      ? [
          {
            address: tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'balanceOf' as const,
            args: [ownerAddress!] as const,
            chainId: ARC_CHAIN_ID,
          },
        ]
      : []),
    ...(hasToken && hasOwner && hasSpender
      ? [
          {
            address: tokenAddress!,
            abi: ERC20_ABI,
            functionName: 'allowance' as const,
            args: [ownerAddress!, spenderAddress!] as const,
            chainId: ARC_CHAIN_ID,
          },
        ]
      : []),
  ];

  const result = useReadContracts({
    contracts,
    query: {
      enabled: contracts.length > 0,
    },
  });

  const decimalsRaw = result.data?.[0]?.result;
  const symbolRaw = result.data?.[1]?.result;
  const balanceRaw = hasOwner ? result.data?.[2]?.result : undefined;
  const allowanceRaw = hasOwner && hasSpender ? result.data?.[3]?.result : undefined;

  return {
    decimals: typeof decimalsRaw === 'number' ? decimalsRaw : undefined,
    symbol: typeof symbolRaw === 'string' ? symbolRaw : undefined,
    balance: typeof balanceRaw === 'bigint' ? balanceRaw : undefined,
    allowance: typeof allowanceRaw === 'bigint' ? allowanceRaw : undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    refetch: result.refetch,
  };
}
