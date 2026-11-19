import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Lock, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { CONTRACT_ADDRESS, getExplorerAddressUrl } from '../config/chain';
import { usePlatformStats } from '../hooks/useMandateData';
import { QuotaGauge } from '../components/QuotaGauge';

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    title: 'Core mandates live',
    status: 'Live',
    description:
      'Authorize a merchant with a monthly USDC or EURC cap, adjust limits at any time, revoke in one transaction, and inspect real token allowances.',
  },
  {
    phase: 'Phase 2',
    title: 'Per pull caps',
    status: 'Planned',
    description:
      'Add an optional per-transaction ceiling alongside the monthly budget so no single pull can exceed a fixed invoice size.',
  },
  {
    phase: 'Phase 3',
    title: 'Expiry dates',
    status: 'Planned',
    description:
      'Set an explicit end timestamp on any mandate so seasonal or trial authorizations close automatically without a manual revoke.',
  },
  {
    phase: 'Phase 4',
    title: 'Merchant verification',
    status: 'Planned',
    description:
      'Link verified legal names and domains to merchant addresses so payers see clear counterparty identity before signing.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can a merchant take more than my limit',
    answer:
      'No. The Zekferow contract tracks the cumulative amount pulled during the current monthly window on-chain. Any pull request that would push total pulls above your monthly limit reverts automatically.',
  },
  {
    question: 'How do I stop a merchant',
    answer:
      'Open My Mandates, select the mandate you want to end, and click Revoke Mandate. Once confirmed on Arc, the merchant can never pull again under that mandate. You can also lower your ERC20 token allowance to zero at any time.',
  },
  {
    question: 'When does the monthly limit reset',
    answer:
      'Each mandate resets its monthly pulled counter on the new monthly billing period enforced by the contract. Unused capacity does not roll over into the next month.',
  },
  {
    question: 'What happens if my balance is too low',
    answer:
      'Your funds stay in your own wallet until a merchant pulls a payment. If your wallet balance or token allowance is lower than the requested pull amount, the pull transaction fails on-chain and nothing is deducted.',
  },
];

export function HomePage() {
  const { data: stats, isLoading: isLoadingStats, isError: isStatsError } = usePlatformStats();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 space-y-14">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center">
          <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0F9D8F]">
            Built on Arc
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-[-0.015em] text-[#1F2A37] leading-[1.16] text-balance">
            Monthly pull mandates on Arc
          </h1>
          <p className="mt-4 text-base text-[#6B7785] max-w-2xl leading-relaxed">
            Authorize a merchant to pull USDC or EURC up to a monthly limit. Your money stays in your wallet until pulled, and you can change the limit or revoke access at any time.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              to="/authorize"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Authorize a Merchant
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/mandates"
              className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#1F2A37] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              My Mandates
            </Link>
          </div>
        </div>

        {/* Layout Illustration Gauge Card (strictly illustrative, zero invented figures) */}
        <div className="lg:col-span-5">
          <div className="h-full bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-7 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                  Policy Architecture
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#1F2A37]">
                  Mandate Quota Model
                </p>
              </div>
              <span className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                Layout Illustration
              </span>
            </div>

            <div className="py-6 flex flex-col items-center justify-center">
              <QuotaGauge mode="illustration" size={184} />
            </div>

            <div className="border-t border-[#E2E8F0] pt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                  Custody
                </p>
                <p className="mt-1 text-xs font-semibold text-[#1F2A37]">
                  User Wallet
                </p>
              </div>
              <div className="border-x border-[#E2E8F0] px-2">
                <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                  Guardrail
                </p>
                <p className="mt-1 text-xs font-semibold text-[#1F2A37]">
                  Monthly Ceiling
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                  Control
                </p>
                <p className="mt-1 text-xs font-semibold text-[#1F2A37]">
                  Instant Revoke
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Platform Stats (Real Contract Read Only) */}
      <section aria-labelledby="stats-heading">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              On-chain telemetry
            </p>
            <h2 id="stats-heading" className="mt-1 text-2xl font-semibold text-[#1F2A37]">
              Live protocol overview
            </h2>
          </div>
          {CONTRACT_ADDRESS && (
            <a
              href={getExplorerAddressUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[#0F9D8F] hover:underline"
            >
              Contract on ArcScan
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Total Mandates
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#1F2A37] tabular-nums">
              {!CONTRACT_ADDRESS
                ? '—'
                : isLoadingStats
                ? '...'
                : isStatsError || !stats
                ? '—'
                : stats.totalMandates.toString()}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Active Mandates
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#0F9D8F] tabular-nums">
              {!CONTRACT_ADDRESS
                ? '—'
                : isLoadingStats
                ? '...'
                : isStatsError || !stats
                ? '—'
                : stats.activeMandates.toString()}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Total Pulls
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold text-[#1F2A37] tabular-nums">
              {!CONTRACT_ADDRESS
                ? '—'
                : isLoadingStats
                ? '...'
                : isStatsError || !stats
                ? '—'
                : stats.totalPulls.toString()}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Deployment Status
            </p>
            <p className="mt-2 text-base font-semibold text-[#1F2A37]">
              {CONTRACT_ADDRESS ? 'Available on Arc' : 'Awaiting contract'}
            </p>
          </div>
        </div>
      </section>

      {/* About Section: Mandate vs Prepaid Balance */}
      <section aria-labelledby="about-heading" className="space-y-6">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
            How it works
          </p>
          <h2 id="about-heading" className="mt-1 text-2xl font-semibold text-[#1F2A37]">
            Why funds stay in your wallet until pulled
          </h2>
          <p className="mt-2 text-sm text-[#6B7785] max-w-3xl leading-relaxed">
            A Zekferow mandate is a permission rule, not a deposit account. Unlike prepaid balances where you lock tokens inside an app or escrow vault ahead of time, a mandate keeps your USDC and EURC in your own wallet until a merchant actually pulls an invoice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
              Traditional model
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1F2A37]">
              Prepaid Balance
            </h3>
            <ul className="mt-4 divide-y divide-[#E2E8F0] text-sm text-[#6B7785]">
              <li className="py-3">
                You send funds upfront into a merchant or protocol deposit contract.
              </li>
              <li className="py-3">
                Capital sits idle and cannot be used elsewhere in your wallet.
              </li>
              <li className="py-3">
                Stopping future charges requires withdrawing your remaining balance.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-[#0F9D8F]/40 rounded-xl p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
            <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0F9D8F]">
              Zekferow model
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1F2A37]">
              Pull Payment Mandate
            </h3>
            <ul className="mt-4 divide-y divide-[#E2E8F0] text-sm text-[#1F2A37]">
              <li className="py-3 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#0F9D8F] shrink-0 mt-0.5" />
                <span>Tokens remain in your wallet until the exact moment a merchant pulls.</span>
              </li>
              <li className="py-3 flex items-start gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-[#0F9D8F] shrink-0 mt-0.5" />
                <span>You enforce a strict monthly spending ceiling and can edit it anytime.</span>
              </li>
              <li className="py-3 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0F9D8F] shrink-0 mt-0.5" />
                <span>One revoke transaction permanently blocks any further pulls.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section aria-labelledby="roadmap-heading" className="space-y-6">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
            Delivery schedule
          </p>
          <h2 id="roadmap-heading" className="mt-1 text-2xl font-semibold text-[#1F2A37]">
            Protocol roadmap
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROADMAP_PHASES.map((item) => (
            <div
              key={item.phase}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                    {item.phase}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-semibold tracking-[0.06em] uppercase ${
                      item.status === 'Live' ? 'text-[#0F9D8F]' : 'text-[#6B7785]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-[#1F2A37]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-[#6B7785] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section aria-labelledby="faq-heading" className="space-y-6">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
            Common questions
          </p>
          <h2 id="faq-heading" className="mt-1 text-2xl font-semibold text-[#1F2A37]">
            Frequently asked questions
          </h2>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] shadow-[0_1px_3px_0_rgba(31,42,55,0.04)]">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#F7F9FF] transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-semibold text-[#1F2A37]">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#6B7785] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#6B7785] leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
