import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import {
  arcChain,
  ARC_RPC_URL,
  HAS_WALLETCONNECT_PROJECT_ID,
  WALLETCONNECT_PROJECT_ID,
} from './chain';

const wallets = HAS_WALLETCONNECT_PROJECT_ID
  ? [injectedWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet]
  : [injectedWallet];

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets,
    },
  ],
  {
    appName: 'Zekferow',
    projectId: WALLETCONNECT_PROJECT_ID || 'zekferow-local',
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [arcChain],
  transports: {
    [arcChain.id]: http(ARC_RPC_URL),
  },
  ssr: false,
});
