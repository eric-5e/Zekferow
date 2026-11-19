import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { usePublicClient, useWriteContract } from 'wagmi';
import { ARC_CHAIN_ID } from '../config/chain';

export type TxPhase = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'error';

export interface TxState {
  phase: TxPhase;
  actionLabel: string;
  hash?: `0x${string}`;
  errorMessage?: string;
}

function extractReadableError(err: unknown): string {
  if (!err) return 'Transaction failed';
  if (typeof err === 'string') return err;
  const anyErr = err as { shortMessage?: string; message?: string };
  if (anyErr.shortMessage) return anyErr.shortMessage;
  if (anyErr.message) {
    if (anyErr.message.includes('User rejected')) {
      return 'Transaction signature was rejected in your wallet';
    }
    return anyErr.message.slice(0, 180);
  }
  return 'Transaction failed';
}

export function useContractTx() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ARC_CHAIN_ID });
  const queryClient = useQueryClient();

  const [txState, setTxState] = useState<TxState>({
    phase: 'idle',
    actionLabel: '',
  });

  const resetTx = useCallback(() => {
    setTxState({ phase: 'idle', actionLabel: '' });
  }, []);

  const executeTx = useCallback(
    async (
      actionLabel: string,
      params: Parameters<typeof writeContractAsync>[0]
    ): Promise<boolean> => {
      try {
        setTxState({ phase: 'pending', actionLabel });
        const hash = await writeContractAsync(params);
        setTxState({ phase: 'confirming', actionLabel, hash });

        if (!publicClient) {
          throw new Error('Arc RPC client unavailable');
        }
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== 'success') {
          throw new Error('Transaction reverted on chain');
        }

        setTxState({ phase: 'confirmed', actionLabel, hash });
        await queryClient.invalidateQueries();
        return true;
      } catch (err) {
        setTxState({
          phase: 'error',
          actionLabel,
          errorMessage: extractReadableError(err),
        });
        return false;
      }
    },
    [publicClient, queryClient, writeContractAsync]
  );

  return {
    txState,
    executeTx,
    resetTx,
  };
}
