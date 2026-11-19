import type { ReactNode } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle, Wallet } from 'lucide-react';
import { ARC_CHAIN_ID, CONTRACT_ADDRESS } from '../config/chain';
import { ZekferowLogo } from './ZekferowLogo';

interface WalletGateProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function WalletGate({
  children,
  title = 'Connect your wallet to continue',
  description = 'Wallet-specific mandates, allowances, and actions only load for the connected address.',
}: WalletGateProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 md:p-12 text-center max-w-xl mx-auto my-8 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
        <div className="inline-flex items-center justify-center mb-5">
          <ZekferowLogo size={44} />
        </div>
        <h2 className="text-xl font-semibold text-[#1F2A37]">{title}</h2>
        <p className="mt-2 text-sm text-[#6B7785] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => openConnectModal?.()}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (chainId !== ARC_CHAIN_ID) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 md:p-10 text-center max-w-xl mx-auto my-8 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#FEF3C7] text-[#92400E] mb-4">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-[#1F2A37]">Switch network to Arc</h2>
        <p className="mt-2 text-sm text-[#6B7785] max-w-md mx-auto leading-relaxed">
          Your wallet is connected to another network. Switch to Arc (Chain ID 5042002) to read and sign mandates.
        </p>
        <div className="mt-6">
          <button
            type="button"
            disabled={isSwitching}
            onClick={() => switchChain({ chainId: ARC_CHAIN_ID })}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isSwitching ? 'Switching to Arc...' : 'Switch to Arc'}
          </button>
        </div>
      </div>
    );
  }

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 md:p-10 text-center max-w-xl mx-auto my-8 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
        <div className="inline-flex items-center justify-center mb-4">
          <ZekferowLogo size={40} />
        </div>
        <h2 className="text-xl font-semibold text-[#1F2A37]">Contract address not configured</h2>
        <p className="mt-2 text-sm text-[#6B7785] max-w-md mx-auto leading-relaxed">
          Set <code className="font-mono text-xs bg-[#E9EEF3] px-1.5 py-0.5 rounded text-[#1F2A37]">VITE_CONTRACT_ADDRESS</code> to your deployed Zekferow contract address on Arc to enable live reads and transactions.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
