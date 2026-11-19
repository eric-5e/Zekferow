import { AlertCircle, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { getExplorerTxUrl } from '../config/chain';
import type { TxState } from '../hooks/useContractTx';

interface TxStatusPanelProps {
  txState: TxState;
  onDismiss?: () => void;
}

export function TxStatusPanel({ txState, onDismiss }: TxStatusPanelProps) {
  if (txState.phase === 'idle') return null;

  const isError = txState.phase === 'error';
  const isConfirmed = txState.phase === 'confirmed';

  const containerStyle = isError
    ? 'bg-[#FDE8E9] border-[#F8C6CA] text-[#9C1C26]'
    : isConfirmed
    ? 'bg-[#E6F6F4] border-[#B7EAE3] text-[#0A685F]'
    : 'bg-white border-[#CBD5E1] text-[#1F2A37]';

  return (
    <div className={`rounded-lg border p-4 text-sm ${containerStyle}`} role="status">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {isError ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#D64550]" />
          ) : isConfirmed ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#0F9D8F]" />
          ) : (
            <Loader2 className="w-4 h-4 mt-0.5 shrink-0 text-[#0F9D8F] animate-spin" />
          )}
          <div>
            <p className="font-semibold">
              {txState.phase === 'pending' && `Awaiting wallet signature for ${txState.actionLabel}`}
              {txState.phase === 'confirming' && `Confirming ${txState.actionLabel} on Arc`}
              {txState.phase === 'confirmed' && `${txState.actionLabel} confirmed on Arc`}
              {txState.phase === 'error' && `${txState.actionLabel} failed`}
            </p>
            {txState.errorMessage && (
              <p className="mt-1 text-xs opacity-90">{txState.errorMessage}</p>
            )}
            {txState.hash && (
              <a
                href={getExplorerTxUrl(txState.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 font-mono text-xs underline underline-offset-2 hover:opacity-80"
              >
                View transaction on ArcScan
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        {onDismiss && (isConfirmed || isError) && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium underline underline-offset-2 opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
