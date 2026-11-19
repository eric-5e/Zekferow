import { defineChain } from 'viem';

export const ARC_CHAIN_ID = 5042002;
export const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
export const ARC_EXPLORER_URL = 'https://testnet.arcscan.app';

export const arcChain = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
    public: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: ARC_EXPLORER_URL,
    },
  },
});

export interface SupportedToken {
  symbol: 'USDC' | 'EURC';
  name: string;
  address: `0x${string}`;
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x3600000000000000000000000000000000000000',
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  },
];

export function getTokenByAddress(address?: string): SupportedToken | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === lower);
}

function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return '';
  }
  return trimmed;
}

const rawContract = cleanEnvValue(import.meta.env?.VITE_CONTRACT_ADDRESS);
const rawWalletConnectId = cleanEnvValue(import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID);
const rawAdminWallet = cleanEnvValue(import.meta.env?.VITE_ADMIN_WALLET);

export const CONTRACT_ADDRESS = /^0x[a-fA-F0-9]{40}$/.test(rawContract)
  ? (rawContract as `0x${string}`)
  : undefined;

export const HAS_WALLETCONNECT_PROJECT_ID = Boolean(rawWalletConnectId);

export const WALLETCONNECT_PROJECT_ID = rawWalletConnectId;

export const ADMIN_WALLET = /^0x[a-fA-F0-9]{40}$/.test(rawAdminWallet)
  ? (rawAdminWallet as `0x${string}`)
  : undefined;

export function getExplorerTxUrl(hash: string): string {
  return `${ARC_EXPLORER_URL}/tx/${hash}`;
}

export function getExplorerAddressUrl(address: string): string {
  return `${ARC_EXPLORER_URL}/address/${address}`;
}
