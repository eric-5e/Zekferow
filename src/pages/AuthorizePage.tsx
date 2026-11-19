import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CONTRACT_ADDRESS, SUPPORTED_TOKENS } from '../config/chain';
import { useTokenInfo } from '../hooks/useTokenInfo';
import { useZekferowAbi } from '../hooks/useZekferowAbi';
import { useContractTx } from '../hooks/useContractTx';
import { ERC20_ABI } from '../lib/abiAdapter';
import {
  formatTokenAmount,
  isValidEvmAddress,
  parseTokenAmount,
  shortenAddress,
} from '../lib/mandateMath';
import { WalletGate } from '../components/WalletGate';
import { TxStatusPanel } from '../components/TxStatusPanel';

export function AuthorizePage() {
  const { address } = useAccount();
  const [merchantInput, setMerchantInput] = useState('');
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<`0x${string}`>(
    SUPPORTED_TOKENS[0].address
  );
  const [limitInput, setLimitInput] = useState('100');

  const selectedToken = useMemo(
    () =>
      SUPPORTED_TOKENS.find((t) => t.address === selectedTokenAddress) ??
      SUPPORTED_TOKENS[0],
    [selectedTokenAddress]
  );

  const tokenInfo = useTokenInfo(selectedToken.address, address, CONTRACT_ADDRESS);
  const decimals = tokenInfo.decimals ?? 6;
  const symbol = tokenInfo.symbol ?? selectedToken.symbol;

  const { abi, resolved } = useZekferowAbi();
  const { txState, executeTx, resetTx } = useContractTx();

  const parsedLimit = useMemo(
    () => parseTokenAmount(limitInput, decimals),
    [limitInput, decimals]
  );

  const isMerchantValid = isValidEvmAddress(merchantInput);
  const isSelfMerchant =
    Boolean(address) &&
    isMerchantValid &&
    merchantInput.trim().toLowerCase() === address!.toLowerCase();

  const currentAllowance = tokenInfo.allowance ?? 0n;
  const needsApproval =
    parsedLimit !== null && parsedLimit > 0n && currentAllowance < parsedLimit;

  const isBusy = txState.phase === 'pending' || txState.phase === 'confirming';

  const sliderNumeric = Number(limitInput) || 0;
  const sliderMax = 5000;
  const sliderVal = Math.min(sliderMax, Math.max(0, sliderNumeric));
  const sliderPct = (sliderVal / sliderMax) * 100;

  const handleApprove = async () => {
    if (!CONTRACT_ADDRESS || parsedLimit === null || parsedLimit <= 0n) return;
    await executeTx(`Approve ${symbol} Allowance`, {
      address: selectedToken.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, parsedLimit],
    });
    await tokenInfo.refetch();
  };

  const handleCreateMandate = async () => {
    if (
      !CONTRACT_ADDRESS ||
      !isMerchantValid ||
      isSelfMerchant ||
      parsedLimit === null ||
      parsedLimit <= 0n ||
      needsApproval
    ) {
      return;
    }

    const ok = await executeTx('Create Pull Mandate', {
      address: CONTRACT_ADDRESS,
      abi,
      functionName: resolved.createMandate,
      args: [merchantInput.trim() as `0x${string}`, selectedToken.address, parsedLimit],
    });

    if (ok) {
      await tokenInfo.refetch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#0F9D8F]">
          New authorization policy
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#1F2A37]">
          Authorize a merchant
        </h1>
        <p className="mt-2 text-sm text-[#6B7785] max-w-2xl">
          Grant a merchant permission to pull up to a monthly token limit. Tokens remain in your wallet until a pull occurs.
        </p>
      </div>

      <WalletGate
        title="Connect wallet to authorize a merchant"
        description="Connect your wallet on Arc to read your real token balance, check your allowance, and create an on-chain mandate."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Card */}
          <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] space-y-6">
            <div>
              <label
                htmlFor="merchant-address"
                className="block font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]"
              >
                Merchant Wallet Address
              </label>
              <input
                id="merchant-address"
                type="text"
                value={merchantInput}
                onChange={(e) => setMerchantInput(e.target.value)}
                placeholder="0x..."
                className="mt-2 w-full h-11 px-3.5 rounded-lg border border-[#E2E8F0] bg-white font-mono text-sm text-[#1F2A37] placeholder:text-[#94A3B8] focus:outline-none focus:border-2 focus:border-[#0F9D8F]"
              />
              {merchantInput.trim().length > 0 && !isMerchantValid && (
                <p className="mt-1.5 text-xs text-[#D64550]">
                  Enter a valid 42-character 0x EVM address.
                </p>
              )}
              {isSelfMerchant && (
                <p className="mt-1.5 text-xs text-[#D64550]">
                  Merchant address cannot match your connected payer wallet.
                </p>
              )}
            </div>

            <div>
              <span className="block font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                Settlement Token
              </span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {SUPPORTED_TOKENS.map((t) => {
                  const selected = t.address === selectedToken.address;
                  return (
                    <button
                      key={t.address}
                      type="button"
                      onClick={() => setSelectedTokenAddress(t.address)}
                      className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#0F9D8F] bg-[#E6F6F4]/50'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-[#1F2A37]">
                          {t.symbol}
                        </span>
                        <span className="font-mono text-[11px] text-[#6B7785]">
                          {shortenAddress(t.address, 4)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6B7785]">{t.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="monthly-limit"
                  className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]"
                >
                  Monthly Limit ({symbol})
                </label>
                <span className="font-mono text-xs text-[#6B7785] tabular-nums">
                  Wallet balance:{' '}
                  {tokenInfo.balance !== undefined
                    ? `${formatTokenAmount(tokenInfo.balance, decimals)} ${symbol}`
                    : 'Loading...'}
                </span>
              </div>

              <div className="mt-2 relative">
                <input
                  id="monthly-limit"
                  type="text"
                  inputMode="decimal"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="100.00"
                  className="w-full h-11 pl-3.5 pr-20 rounded-lg border border-[#E2E8F0] bg-white font-mono text-base font-medium text-[#1F2A37] tabular-nums focus:outline-none focus:border-2 focus:border-[#0F9D8F]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-[#6B7785]">
                  {symbol} / mo
                </span>
              </div>

              <div className="mt-4">
                <input
                  type="range"
                  aria-label="Monthly limit slider"
                  min={0}
                  max={sliderMax}
                  step={10}
                  value={sliderVal}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full zf-slider cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #0F9D8F ${sliderPct}%, #E2E8F0 ${sliderPct}%)`,
                  }}
                />
                <div className="mt-1.5 flex justify-between font-mono text-[11px] text-[#6B7785] tabular-nums">
                  <span>0 {symbol}</span>
                  <span>2,500 {symbol}</span>
                  <span>5,000 {symbol}</span>
                </div>
              </div>
            </div>

            {/* Allowance Check Banner */}
            <div
              className={`rounded-lg border p-4 ${
                needsApproval
                  ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                  : 'bg-[#E6F6F4] border-[#B7EAE3] text-[#0A685F]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {needsApproval ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold">
                    {needsApproval
                      ? `Token approval required before creating mandate`
                      : `Current ${symbol} allowance covers this monthly limit`}
                  </p>
                  <p className="mt-1 font-mono tabular-nums">
                    Current allowance:{' '}
                    {tokenInfo.allowance !== undefined
                      ? `${formatTokenAmount(tokenInfo.allowance, decimals)} ${symbol}`
                      : 'Checking...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {needsApproval && (
                <button
                  type="button"
                  disabled={isBusy || parsedLimit === null || parsedLimit <= 0n}
                  onClick={handleApprove}
                  className="flex-1 h-11 px-5 rounded-lg bg-[#1F2A37] hover:bg-[#2E3B4B] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isBusy ? 'Processing...' : `Step 1: Approve ${symbol}`}
                </button>
              )}

              <button
                type="button"
                disabled={
                  isBusy ||
                  !isMerchantValid ||
                  isSelfMerchant ||
                  parsedLimit === null ||
                  parsedLimit <= 0n ||
                  needsApproval
                }
                onClick={handleCreateMandate}
                className="flex-1 h-11 px-5 rounded-lg bg-[#0F9D8F] hover:bg-[#0B8276] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isBusy
                  ? 'Processing...'
                  : needsApproval
                  ? 'Step 2: Create Mandate'
                  : 'Create Mandate'}
              </button>
            </div>

            <TxStatusPanel txState={txState} onDismiss={resetTx} />
          </div>

          {/* Policy Preview Side Panel */}
          <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-[0_1px_3px_0_rgba(31,42,55,0.04)] space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.06em] uppercase text-[#6B7785]">
                  Policy summary
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-[#1F2A37]">
                  Mandate terms preview
                </h2>
              </div>
              <ShieldCheck className="w-5 h-5 text-[#0F9D8F]" />
            </div>

            <dl className="divide-y divide-[#E2E8F0] text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#6B7785]">Payer Wallet</dt>
                <dd className="font-mono text-xs text-[#1F2A37]">
                  {address ? shortenAddress(address, 6) : '—'}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#6B7785]">Merchant</dt>
                <dd className="font-mono text-xs text-[#1F2A37]">
                  {isMerchantValid ? shortenAddress(merchantInput.trim(), 6) : 'Enter address'}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#6B7785]">Asset & Decimals</dt>
                <dd className="font-mono text-xs text-[#1F2A37] tabular-nums">
                  {symbol} ({tokenInfo.decimals ?? '...'} dec)
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#6B7785]">Monthly Ceiling</dt>
                <dd className="font-mono text-base font-semibold text-[#1F2A37] tabular-nums">
                  {parsedLimit !== null
                    ? `${formatTokenAmount(parsedLimit, decimals)} ${symbol}`
                    : `0 ${symbol}`}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#6B7785]">Contract Allowance</dt>
                <dd className="font-mono text-xs font-medium text-[#1F2A37] tabular-nums">
                  {tokenInfo.allowance !== undefined
                    ? `${formatTokenAmount(tokenInfo.allowance, decimals)} ${symbol}`
                    : '...'}
                </dd>
              </div>
            </dl>

            <div className="rounded-lg bg-[#F7F9FF] border border-[#E2E8F0] p-4 text-xs text-[#6B7785] leading-relaxed">
              Creating a mandate never transfers tokens upfront. Tokens only leave your wallet when the merchant submits a valid pull inside your remaining monthly cap.
            </div>

            {txState.phase === 'confirmed' && txState.actionLabel === 'Create Pull Mandate' && (
              <Link
                to="/mandates"
                className="block text-center w-full h-10 leading-10 rounded-lg border border-[#0F9D8F] text-[#0F9D8F] hover:bg-[#E6F6F4] text-sm font-semibold transition-colors"
              >
                View in My Mandates
              </Link>
            )}
          </div>
        </div>
      </WalletGate>
    </div>
  );
}
