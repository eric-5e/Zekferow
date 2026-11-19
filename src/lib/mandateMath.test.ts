import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeQuotaMetrics,
  formatTokenAmount,
  isValidEvmAddress,
  parseTokenAmount,
  shortenAddress,
} from './mandateMath';

test('formatTokenAmount formats 6-decimal USDC amounts cleanly', () => {
  assert.equal(formatTokenAmount(1_500_000n, 6), '1.5');
  assert.equal(formatTokenAmount(250_000_000n, 6), '250');
  assert.equal(formatTokenAmount(1_234_567_890n, 6), '1,234.56');
});

test('parseTokenAmount handles valid and invalid numeric strings', () => {
  assert.equal(parseTokenAmount('100', 6), 100_000_000n);
  assert.equal(parseTokenAmount('12.34', 6), 12_340_000n);
  assert.equal(parseTokenAmount('12.1234567', 6), null);
  assert.equal(parseTokenAmount('-5', 6), null);
  assert.equal(parseTokenAmount('abc', 6), null);
});

test('computeQuotaMetrics calculates remaining, threshold warning, and allowance shortfall', () => {
  const belowThreshold = computeQuotaMetrics(40_000_000n, 100_000_000n, 100_000_000n);
  assert.equal(belowThreshold.remaining, 60_000_000n);
  assert.equal(belowThreshold.utilizationPct, 40);
  assert.equal(belowThreshold.isOverThreshold, false);
  assert.equal(belowThreshold.isAllowanceLow, false);

  const highUsageLowAllowance = computeQuotaMetrics(90_000_000n, 100_000_000n, 50_000_000n);
  assert.equal(highUsageLowAllowance.remaining, 10_000_000n);
  assert.equal(highUsageLowAllowance.utilizationPct, 90);
  assert.equal(highUsageLowAllowance.isOverThreshold, true);
  assert.equal(highUsageLowAllowance.isAllowanceLow, true);
  assert.equal(highUsageLowAllowance.allowanceShortfall, 50_000_000n);
});

test('address validation and shortening', () => {
  assert.equal(isValidEvmAddress('0x3600000000000000000000000000000000000000'), true);
  assert.equal(isValidEvmAddress('0x123'), false);
  assert.equal(shortenAddress('0x3600000000000000000000000000000000000000'), '0x3600...0000');
});
