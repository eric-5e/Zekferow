import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { AlertTriangle, ArrowDownToLine } from 'lucide-react';
import { CONTRACT_ADDRESS, getExplorerAddressUrl } from '../config/chain';
import { useMerchantMandates, type EnrichedMandate } from '../hooks/useMandateData';
import { useZekferowAbi } from '../hooks/useZekferowAbi';
import { useContractTx } from '../hooks/useContractTx';
import {
  computeQuotaMetrics,
  formatTokenAmount,
  parseTokenAmount,
  shortenAddress,
} from '../lib/mandateMath';
import { WalletGate } from '../components/WalletGate';
import { StatusChip } from '../components/StatusChip';
import { LinearQuotaBar } from '../components/LinearQuotaBar';
import { TxStatusPanel } from '../components/TxStatusPanel';

export function MerchantConsolePage() {
  const { address } = useAccount();
  const { data: mandates, isLoading, isError, refetch } = useMerchantMandates(address);
  const { abi, resolved } = useZekferowAbi();
  const { txState, executeTx, resetTx } = useContractTx();

  const [pullAmounts, setPullAmounts] = useState<Record<string, string>>({});

  const isBusy = txState.phase === 'pending' || txState.phase === 'confirming';

  const activeCount = mandates ? mandates.filter((m) => m.mandate.active).length : 0;
  const lowAllowanceCount = mandates
    ? mandates.filter(
        (m) => m.mandate.active && m.userAllowance < m.mandate.monthlyLimit
      ).length
    : 0;

  const handlePull = async (item: EnrichedMandate) => {
    if (!CONTRACT_ADDRESS) return;
    const key = item.mandate.id.toString();
    const rawInput = pullAmounts[key] ?? '';
    const parsedAmount = parseTokenAmount(rawInput, item.decimals);
    if (parsedAmount === null || parsedAmount <= 0n) return;

    const ok = await executeTx(
      `Pull ${rawInput} ${item.tokenSymbol} (Mandate #${key})`,
      {
        address: CONTRACT_ADDRESS,
        abi,
        functionName: resolved.pullPayment,
        args: [item.mandate.id, parsedAmount],
      }
    );

    if (ok) {
      setPullAmounts((prev) => ({ ...prev, [key]: '' }));
      await refetch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0F9D8F]">
          Merchant settlement
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1F2A37]">
          Merchant pull console
        </h1>
        <p className="mt-1.5 text-sm text-[#6B7785]">
          Only mandates where your connected wallet is the authorized merchant appear here. Pull payments inside each customer's remaining monthly limit.
        </p>
      </div>

      <WalletGate
        title="Connect merchant wallet"
        description="Connect your merchant wallet on Arc to view customer mandates and execute pull payments."
      >
        {/* Summary Strip from Real Contract Reads */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Customer Mandates
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#1F2A37] tabular-nums">
              {isLoading ? '...' : mandates ? mandates.length : 0}
            </p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Active Authorizations
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#0F9D8F] tabular-nums">
              {isLoading ? '...' : activeCount}
            </p>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Low Payer Allowance
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#1F2A37] tabular-nums">
              {isLoading ? '...' : lowAllowanceCount}
            </p>
          </div>
        </div>

        <TxStatusPanel txState={txState} onDismiss={resetTx} />

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse"
              >
                <div className="h-4 w-56 bg-[#E2E8F0] rounded" />
                <div className="mt-3 h-3 w-full bg-[#E9EEF3] rounded" />
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="bg-white border border-[#F8C6CA] rounded-xl p-8 text-center">
            <p className="text-sm font-semibold text-[#9C1C26]">
              Unable to load merchant mandates from Arc.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 h-9 px-4 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#1F2A37] hover:bg-[#F1F5F9] cursor-pointer"
            >
              Retry Read
            </button>
          </div>
        )}

        {!isLoading && !isError && (!mandates || mandates.length === 0) && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <h2 className="text-lg font-semibold text-[#1F2A37]">
              No customer mandates assigned to this wallet
            </h2>
            <p className="mt-2 text-sm text-[#6B7785] max-w-md mx-auto">
              Customers authorize your merchant address ({shortenAddress(address, 6)}) from the Authorize page before pulls become available here.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {mandates?.map((item) => {
            const key = item.mandate.id.toString();
            const metrics = computeQuotaMetrics(
              item.pulledThisMonth,
              item.mandate.monthlyLimit,
              item.userAllowance
            );

            const amountStr = pullAmounts[key] ?? '';
            const parsedAmount = parseTokenAmount(amountStr, item.decimals);

            // Max pullable given remaining cap, payer's ERC20 allowance, and payer's balance
            let maxPullable = metrics.remaining;
            if (item.userAllowance < maxPullable) maxPullable = item.userAllowance;
            if (item.userBalance < maxPullable) maxPullable = item.userBalance;

            const exceedsRemaining =
              parsedAmount !== null && parsedAmount > metrics.remaining;
            const exceedsAllowance =
              parsedAmount !== null && parsedAmount > item.userAllowance;
            const exceedsBalance =
              parsedAmount !== null && parsedAmount > item.userBalance;

            const canPull =
              item.mandate.active &&
              parsedAmount !== null &&
              parsedAmount > 0n &&
              !exceedsRemaining &&
              !exceedsAllowance &&
              !exceedsBalance &&
              !isBusy;

            const allowancePct =
              item.mandate.monthlyLimit > 0n
                ? Math.min(
                    100,
                    Number((item.userAllowance * 100n) / item.mandate.monthlyLimit)
                  )
                : 100;

            return (
              <div
                key={key}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#6B7785]">
                        Mandate #{key}
                      </span>
                      <StatusChip
                        variant={item.mandate.active ? 'active' : 'revoked'}
                        label={item.mandate.active ? 'Active' : 'Revoked'}
                      />
                      <span className="font-mono text-xs font-semibold text-[#1F2A37]">
                        {item.tokenSymbol}
                      </span>
                    </div>
                    <p className="text-sm text-[#1F2A37]">
                      Customer:{' '}
                      <a
                        href={getExplorerAddressUrl(item.mandate.user)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs sm:text-sm underline underline-offset-2 decoration-[#CBD5E1] hover:text-[#0F9D8F]"
                      >
                        {item.mandate.user}
                      </a>
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left lg:text-right">
                      <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                        Remaining This Month
                      </p>
                      <p className="font-mono text-lg font-semibold text-[#1F2A37] tabular-nums">
                        {formatTokenAmount(metrics.remaining, item.decimals)}{' '}
                        {item.tokenSymbol}
                      </p>
                    </div>
                    <Link
                      to={`/mandates/${key}`}
                      className="h-9 px-3.5 leading-9 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#1F2A37] hover:bg-[#F1F5F9] whitespace-nowrap"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>

                <LinearQuotaBar
                  utilizationPct={metrics.utilizationPct}
                  active={item.mandate.active}
                  allowancePct={allowancePct}
                />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-[#6B7785] tabular-nums">
                  <div>
                    Monthly Limit:{' '}
                    <strong className="text-[#1F2A37]">
                      {formatTokenAmount(item.mandate.monthlyLimit, item.decimals)}{' '}
                      {item.tokenSymbol}
                    </strong>
                  </div>
                  <div>
                    Payer Allowance:{' '}
                    <strong className="text-[#1F2A37]">
                      {formatTokenAmount(item.userAllowance, item.decimals)}{' '}
                      {item.tokenSymbol}
                    </strong>
                  </div>
                  <div>
                    Payer Balance:{' '}
                    <strong className="text-[#1F2A37]">
                      {formatTokenAmount(item.userBalance, item.decimals)}{' '}
                      {item.tokenSymbol}
                    </strong>
                  </div>
                </div>

                {item.mandate.active && metrics.isAllowanceLow && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Payer token allowance ({formatTokenAmount(item.userAllowance, item.decimals)} {item.tokenSymbol}) is lower than the monthly limit.
                    </span>
                  </div>
                )}

                {item.mandate.active && (
                  <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                    <div className="flex-1">
                      <label
                        htmlFor={`pull-amount-${key}`}
                        className="block font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]"
                      >
                        Pull Amount ({item.tokenSymbol})
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          id={`pull-amount-${key}`}
                          type="text"
                          inputMode="decimal"
                          value={amountStr}
                          onChange={(e) =>
                            setPullAmounts((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white font-mono text-sm text-[#1F2A37] tabular-nums focus:outline-none focus:border-2 focus:border-[#0F9D8F]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPullAmounts((prev) => ({
                              ...prev,
                              [key]: formatTokenAmount(maxPullable, item.decimals, item.decimals).replace(/,/g, ''),
                            }))
                          }
                          className="h-10 px-3 rounded-lg border border-[#CBD5E1] text-xs font-mono font-semibold text-[#1F2A37] hover:bg-[#F1F5F9] whitespace-nowrap cursor-pointer"
                        >
                          Max
                        </button>
                      </div>
                      {exceedsRemaining && (
                        <p className="mt-1 text-xs text-[#D64550]">
                          Exceeds remaining monthly mandate limit.
                        </p>
                      )}
                      {!exceedsRemaining && exceedsAllowance && (
                        <p className="mt-1 text-xs text-[#D64550]">
                          Exceeds customer ERC20 allowance.
                        </p>
                      )}
                      {!exceedsRemaining && !exceedsAllowance && exceedsBalance && (
                        <p className="mt-1 text-xs text-[#D64550]">
                          Exceeds customer wallet balance.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!canPull}
                      onClick={() => handlePull(item)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      Pull Payment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </WalletGate>
    </div>
  );
}
