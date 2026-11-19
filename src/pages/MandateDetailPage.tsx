import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import { CONTRACT_ADDRESS, getExplorerAddressUrl } from '../config/chain';
import { useMandateDetail } from '../hooks/useMandateData';
import { useZekferowAbi } from '../hooks/useZekferowAbi';
import { useContractTx } from '../hooks/useContractTx';
import { ERC20_ABI } from '../lib/abiAdapter';
import {
  computeQuotaMetrics,
  formatTokenAmount,
  parseTokenAmount,
  shortenAddress,
} from '../lib/mandateMath';
import { WalletGate } from '../components/WalletGate';
import { StatusChip } from '../components/StatusChip';
import { QuotaGauge } from '../components/QuotaGauge';
import { LinearQuotaBar } from '../components/LinearQuotaBar';
import { RevokeButton } from '../components/RevokeButton';
import { TxStatusPanel } from '../components/TxStatusPanel';

export function MandateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const { data, isLoading, isError, refetch } = useMandateDetail(id);
  const { abi, resolved } = useZekferowAbi();
  const { txState, executeTx, resetTx } = useContractTx();

  const [newLimitInput, setNewLimitInput] = useState('');

  const enriched = data?.enriched;
  const pullHistory = data?.pullHistory ?? [];

  const isUserOwner =
    Boolean(address) &&
    Boolean(enriched) &&
    address!.toLowerCase() === enriched!.mandate.user.toLowerCase();

  const isMerchantOwner =
    Boolean(address) &&
    Boolean(enriched) &&
    address!.toLowerCase() === enriched!.mandate.merchant.toLowerCase();

  const parsedNewLimit = useMemo(() => {
    if (!enriched || !newLimitInput.trim()) return null;
    return parseTokenAmount(newLimitInput, enriched.decimals);
  }, [enriched, newLimitInput]);

  const needsApprovalForNewLimit =
    Boolean(enriched) &&
    parsedNewLimit !== null &&
    parsedNewLimit > 0n &&
    enriched!.userAllowance < parsedNewLimit;

  const isBusy = txState.phase === 'pending' || txState.phase === 'confirming';

  const handleApproveCurrentLimit = async () => {
    if (!CONTRACT_ADDRESS || !enriched) return;
    const ok = await executeTx(`Approve ${enriched.tokenSymbol} Allowance`, {
      address: enriched.mandate.token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, enriched.mandate.monthlyLimit],
    });
    if (ok) await refetch();
  };

  const handleApproveNewLimit = async () => {
    if (!CONTRACT_ADDRESS || !enriched || parsedNewLimit === null) return;
    const ok = await executeTx(`Approve ${enriched.tokenSymbol} Allowance`, {
      address: enriched.mandate.token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, parsedNewLimit],
    });
    if (ok) await refetch();
  };

  const handleUpdateLimit = async () => {
    if (
      !CONTRACT_ADDRESS ||
      !enriched ||
      !isUserOwner ||
      parsedNewLimit === null ||
      parsedNewLimit <= 0n ||
      needsApprovalForNewLimit
    ) {
      return;
    }
    const ok = await executeTx('Update Monthly Limit', {
      address: CONTRACT_ADDRESS,
      abi,
      functionName: resolved.updateLimit,
      args: [enriched.mandate.id, parsedNewLimit],
    });
    if (ok) {
      setNewLimitInput('');
      await refetch();
    }
  };

  const handleRevoke = async () => {
    if (!CONTRACT_ADDRESS || !enriched || !isUserOwner) return;
    const ok = await executeTx('Revoke Mandate', {
      address: CONTRACT_ADDRESS,
      abi,
      functionName: resolved.revokeMandate,
      args: [enriched.mandate.id],
    });
    if (ok) await refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/mandates"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7785] hover:text-[#1F2A37]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to My Mandates
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1F2A37]">
            Mandate policy details
          </h1>
        </div>
      </div>

      <WalletGate
        title="Connect wallet to inspect mandate"
        description="Mandate records, allowances, and controls only display when connected on Arc."
      >
        {isLoading && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 animate-pulse space-y-4">
            <div className="h-5 w-40 bg-[#E2E8F0] rounded" />
            <div className="h-24 w-full bg-[#E9EEF3] rounded" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="bg-white border border-[#F8C6CA] rounded-xl p-8 text-center">
            <p className="text-sm font-semibold text-[#9C1C26]">
              Could not load mandate #{id} from the contract.
            </p>
          </div>
        )}

        {!isLoading && !isError && !enriched && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
            <p className="text-sm font-semibold text-[#1F2A37]">
              Mandate #{id} was not found on-chain.
            </p>
          </div>
        )}

        {!isLoading && !isError && enriched && !isUserOwner && !isMerchantOwner && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
            <h2 className="text-lg font-semibold text-[#1F2A37]">
              This mandate belongs to another wallet
            </h2>
            <p className="mt-2 text-sm text-[#6B7785]">
              Wallet-specific mandate data is restricted to the payer or authorized merchant.
            </p>
          </div>
        )}

        {!isLoading && !isError && enriched && (isUserOwner || isMerchantOwner) && (() => {
          const metrics = computeQuotaMetrics(
            enriched.pulledThisMonth,
            enriched.mandate.monthlyLimit,
            enriched.userAllowance
          );
          const allowancePct =
            enriched.mandate.monthlyLimit > 0n
              ? Math.min(
                  100,
                  Number((enriched.userAllowance * 100n) / enriched.mandate.monthlyLimit)
                )
              : 100;

          return (
            <div className="space-y-6">
              <TxStatusPanel txState={txState} onDismiss={resetTx} />

              {/* Top Summary Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-[#6B7785]">
                      Mandate #{enriched.mandate.id.toString()}
                    </span>
                    <StatusChip
                      variant={enriched.mandate.active ? 'active' : 'revoked'}
                      label={enriched.mandate.active ? 'Active' : 'Revoked'}
                    />
                    <span className="font-mono text-xs font-semibold text-[#1F2A37]">
                      {enriched.tokenSymbol}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-y border-[#E2E8F0] py-4">
                    <div>
                      <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                        Payer Wallet
                      </p>
                      <a
                        href={getExplorerAddressUrl(enriched.mandate.user)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-[#1F2A37] hover:text-[#0F9D8F]"
                      >
                        {shortenAddress(enriched.mandate.user, 6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div>
                      <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                        Authorized Merchant
                      </p>
                      <a
                        href={getExplorerAddressUrl(enriched.mandate.merchant)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-[#1F2A37] hover:text-[#0F9D8F]"
                      >
                        {shortenAddress(enriched.mandate.merchant, 6)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div>
                      <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                        Remaining Monthly Limit
                      </p>
                      <p className="mt-1 font-mono text-base font-semibold text-[#1F2A37] tabular-nums">
                        {formatTokenAmount(metrics.remaining, enriched.decimals)}{' '}
                        {enriched.tokenSymbol}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                        Current Token Allowance
                      </p>
                      <p className="mt-1 font-mono text-base font-semibold text-[#1F2A37] tabular-nums">
                        {formatTokenAmount(enriched.userAllowance, enriched.decimals)}{' '}
                        {enriched.tokenSymbol}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs text-[#6B7785] tabular-nums">
                      <span>Monthly quota usage</span>
                      <span>{metrics.utilizationPct.toFixed(1)}%</span>
                    </div>
                    <LinearQuotaBar
                      utilizationPct={metrics.utilizationPct}
                      active={enriched.mandate.active}
                      allowancePct={allowancePct}
                    />
                  </div>

                  {enriched.mandate.active && metrics.isAllowanceLow && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Your ERC20 allowance ({formatTokenAmount(enriched.userAllowance, enriched.decimals)} {enriched.tokenSymbol}) is lower than this mandate's monthly limit ({formatTokenAmount(enriched.mandate.monthlyLimit, enriched.decimals)} {enriched.tokenSymbol}). Pulls exceeding the allowance will fail.
                        </span>
                      </div>
                      {isUserOwner && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={handleApproveCurrentLimit}
                          className="h-8 px-3 rounded-md bg-[#1F2A37] hover:bg-[#2E3B4B] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Approve Full Limit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 flex justify-center">
                  <QuotaGauge
                    mode="live"
                    utilizationPct={metrics.utilizationPct}
                    pulledDisplay={formatTokenAmount(enriched.pulledThisMonth, enriched.decimals)}
                    limitDisplay={formatTokenAmount(enriched.mandate.monthlyLimit, enriched.decimals)}
                    tokenSymbol={enriched.tokenSymbol}
                    active={enriched.mandate.active}
                    size={200}
                  />
                </div>
              </div>

              {/* User Policy Controls */}
              {isUserOwner && enriched.mandate.active && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] space-y-4">
                    <h2 className="text-lg font-semibold text-[#1F2A37]">
                      Change monthly limit
                    </h2>
                    <p className="text-xs text-[#6B7785]">
                      Raise or lower the monthly cap. Increasing above your current allowance requires an ERC20 approval first.
                    </p>
                    <div>
                      <label
                        htmlFor="update-limit-input"
                        className="block font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]"
                      >
                        New Monthly Limit ({enriched.tokenSymbol})
                      </label>
                      <input
                        id="update-limit-input"
                        type="text"
                        inputMode="decimal"
                        value={newLimitInput}
                        onChange={(e) => setNewLimitInput(e.target.value)}
                        placeholder={formatTokenAmount(
                          enriched.mandate.monthlyLimit,
                          enriched.decimals
                        )}
                        className="mt-2 w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white font-mono text-sm text-[#1F2A37] focus:outline-none focus:border-2 focus:border-[#0F9D8F]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {needsApprovalForNewLimit && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={handleApproveNewLimit}
                          className="h-10 px-4 rounded-lg bg-[#1F2A37] hover:bg-[#2E3B4B] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Approve {enriched.tokenSymbol} First
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={
                          isBusy ||
                          parsedNewLimit === null ||
                          parsedNewLimit <= 0n ||
                          needsApprovalForNewLimit
                        }
                        onClick={handleUpdateLimit}
                        className="h-10 px-4 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update Limit
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] flex flex-col justify-between space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1F2A37]">
                        Revoke authorization
                      </h2>
                      <p className="mt-1 text-xs text-[#6B7785] leading-relaxed">
                        Permanently terminate this mandate on Arc. Once revoked, the merchant can no longer pull payments against this mandate.
                      </p>
                    </div>
                    <div>
                      <RevokeButton
                        onConfirmRevoke={handleRevoke}
                        isLoading={isBusy}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pull History Table */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E2E8F0]">
                  <h2 className="text-lg font-semibold text-[#1F2A37]">
                    Pull history
                  </h2>
                </div>

                {pullHistory.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#6B7785]">
                    No payments pulled on this mandate yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F7F9FF]">
                          <th className="py-3 px-6 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                            Timestamp
                          </th>
                          <th className="py-3 px-6 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                            Merchant
                          </th>
                          <th className="py-3 px-6 font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785] text-right">
                            Amount Pulled
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] text-sm">
                        {pullHistory.map((pull, index) => {
                          const tsNum = Number(pull.timestamp);
                          const dateStr =
                            tsNum > 0
                              ? new Date(tsNum * 1000).toLocaleString('en-US', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })
                              : '—';
                          return (
                            <tr key={`${pull.timestamp.toString()}-${index}`} className="hover:bg-[#F7F9FF]">
                              <td className="py-3.5 px-6 font-mono text-xs text-[#1F2A37] tabular-nums">
                                {dateStr}
                              </td>
                              <td className="py-3.5 px-6 font-mono text-xs text-[#6B7785]">
                                {shortenAddress(pull.merchant, 6)}
                              </td>
                              <td className="py-3.5 px-6 font-mono text-sm font-semibold text-[#1F2A37] text-right tabular-nums">
                                {formatTokenAmount(pull.amount, enriched.decimals)}{' '}
                                {enriched.tokenSymbol}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </WalletGate>
    </div>
  );
}
