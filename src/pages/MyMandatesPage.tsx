import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { AlertTriangle, ArrowRight, Plus, Search } from 'lucide-react';
import { CONTRACT_ADDRESS, getExplorerAddressUrl } from '../config/chain';
import { useUserMandates, type EnrichedMandate } from '../hooks/useMandateData';
import { useContractTx } from '../hooks/useContractTx';
import { ERC20_ABI } from '../lib/abiAdapter';
import {
  computeQuotaMetrics,
  formatTokenAmount,
  shortenAddress,
} from '../lib/mandateMath';
import { WalletGate } from '../components/WalletGate';
import { StatusChip } from '../components/StatusChip';
import { LinearQuotaBar } from '../components/LinearQuotaBar';
import { TxStatusPanel } from '../components/TxStatusPanel';

export function MyMandatesPage() {
  const { address } = useAccount();
  const { data: mandates, isLoading, isError, refetch } = useUserMandates(address);
  const { txState, executeTx, resetTx } = useContractTx();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [tokenFilter, setTokenFilter] = useState<'all' | 'USDC' | 'EURC'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMandates = useMemo(() => {
    if (!mandates) return [];
    return mandates.filter((item) => {
      if (statusFilter === 'active' && !item.mandate.active) return false;
      if (statusFilter === 'revoked' && item.mandate.active) return false;
      if (tokenFilter !== 'all' && item.tokenSymbol !== tokenFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesId = item.mandate.id.toString().includes(q);
        const matchesMerchant = item.mandate.merchant.toLowerCase().includes(q);
        if (!matchesId && !matchesMerchant) return false;
      }
      return true;
    });
  }, [mandates, statusFilter, tokenFilter, searchQuery]);

  const handleQuickApprove = async (item: EnrichedMandate) => {
    if (!CONTRACT_ADDRESS) return;
    const ok = await executeTx(`Approve ${item.tokenSymbol} Allowance`, {
      address: item.mandate.token,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, item.mandate.monthlyLimit],
    });
    if (ok) {
      await refetch();
    }
  };

  const isBusy = txState.phase === 'pending' || txState.phase === 'confirming';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
            Payer ledger
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1F2A37]">
            My mandates
          </h1>
          <p className="mt-1.5 text-sm text-[#6B7785]">
            Review active authorizations, check your ERC20 token allowances, and adjust or revoke limits.
          </p>
        </div>

        <Link
          to="/authorize"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Authorize a Merchant
        </Link>
      </div>

      <WalletGate
        title="Connect wallet to view your mandates"
        description="Mandates are private to the connected wallet address. Connect on Arc to load your authorizations."
      >
        <TxStatusPanel txState={txState} onDismiss={resetTx} />

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 p-1 bg-[#E9EEF3] rounded-lg">
              {(['all', 'active', 'revoked'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white text-[#1F2A37] shadow-xs'
                      : 'text-[#6B7785] hover:text-[#1F2A37]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-[#E9EEF3] rounded-lg">
              {(['all', 'USDC', 'EURC'] as const).map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => setTokenFilter(tok)}
                  className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold transition-colors cursor-pointer ${
                    tokenFilter === tok
                      ? 'bg-white text-[#1F2A37] shadow-xs'
                      : 'text-[#6B7785] hover:text-[#1F2A37]'
                  }`}
                >
                  {tok === 'all' ? 'All Tokens' : tok}
                </button>
              ))}
            </div>
          </div>

          <div className="relative md:w-72">
            <Search className="w-4 h-4 text-[#6B7785] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by merchant or ID"
              aria-label="Filter mandates by merchant address or ID"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#1F2A37] placeholder:text-[#94A3B8] focus:outline-none focus:border-2 focus:border-[#0F9D8F]"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse"
              >
                <div className="h-4 w-48 bg-[#E2E8F0] rounded" />
                <div className="mt-3 h-3 w-full bg-[#E9EEF3] rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="bg-white border border-[#F8C6CA] rounded-xl p-8 text-center">
            <p className="text-sm font-semibold text-[#9C1C26]">
              Unable to load mandates from the Arc contract
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

        {/* Empty State */}
        {!isLoading && !isError && (!mandates || mandates.length === 0) && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <h2 className="text-lg font-semibold text-[#1F2A37]">
              No mandates found for this wallet
            </h2>
            <p className="mt-2 text-sm text-[#6B7785] max-w-md mx-auto">
              You have not authorized any merchants on Arc with {shortenAddress(address, 6)} yet.
            </p>
            <div className="mt-6">
              <Link
                to="/authorize"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors"
              >
                Authorize Your First Merchant
              </Link>
            </div>
          </div>
        )}

        {/* Populated List */}
        {!isLoading && !isError && mandates && mandates.length > 0 && filteredMandates.length === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-[#6B7785]">
              No mandates match the current filters.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {filteredMandates.map((item) => {
            const metrics = computeQuotaMetrics(
              item.pulledThisMonth,
              item.mandate.monthlyLimit,
              item.userAllowance
            );

            const allowancePct =
              item.mandate.monthlyLimit > 0n
                ? Math.min(
                    100,
                    Number((item.userAllowance * 100n) / item.mandate.monthlyLimit)
                  )
                : 100;

            return (
              <div
                key={item.mandate.id.toString()}
                className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl p-5 sm:p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] transition-colors space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#6B7785]">
                        Mandate #{item.mandate.id.toString()}
                      </span>
                      <StatusChip
                        variant={item.mandate.active ? 'active' : 'revoked'}
                        label={item.mandate.active ? 'Active' : 'Revoked'}
                      />
                      <span className="font-mono text-xs font-semibold text-[#1F2A37]">
                        {item.tokenSymbol}
                      </span>
                    </div>
                    <div className="text-sm text-[#1F2A37]">
                      Merchant:{' '}
                      <a
                        href={getExplorerAddressUrl(item.mandate.merchant)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs sm:text-sm underline underline-offset-2 decoration-[#CBD5E1] hover:text-[#0F9D8F]"
                      >
                        {item.mandate.merchant}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left lg:text-right">
                      <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                        Pulled / Monthly Limit
                      </p>
                      <p className="font-mono text-base font-semibold text-[#1F2A37] tabular-nums">
                        {formatTokenAmount(item.pulledThisMonth, item.decimals)} /{' '}
                        {formatTokenAmount(item.mandate.monthlyLimit, item.decimals)}{' '}
                        {item.tokenSymbol}
                      </p>
                    </div>

                    <Link
                      to={`/mandates/${item.mandate.id.toString()}`}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#CBD5E1] text-[#1F2A37] hover:bg-[#F1F5F9] text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Manage
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <LinearQuotaBar
                  utilizationPct={metrics.utilizationPct}
                  active={item.mandate.active}
                  allowancePct={allowancePct}
                />

                {/* Token Allowance Display & Low-Allowance Warning */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-[#6B7785] font-mono tabular-nums">
                    <span>
                      Remaining: {formatTokenAmount(metrics.remaining, item.decimals)}{' '}
                      {item.tokenSymbol}
                    </span>
                    <span>
                      Current Allowance:{' '}
                      <strong className="text-[#1F2A37]">
                        {formatTokenAmount(item.userAllowance, item.decimals)}{' '}
                        {item.tokenSymbol}
                      </strong>
                    </span>
                  </div>

                  {item.mandate.active && metrics.isAllowanceLow && (
                    <div className="flex flex-wrap items-center gap-2.5 px-3 py-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="font-medium">
                        Allowance is below the monthly limit
                      </span>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickApprove(item)}
                        className="h-7 px-2.5 rounded bg-[#1F2A37] hover:bg-[#2E3B4B] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        Approve {formatTokenAmount(item.mandate.monthlyLimit, item.decimals)}{' '}
                        {item.tokenSymbol}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </WalletGate>
    </div>
  );
}
