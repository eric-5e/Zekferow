import test from 'node:test';
import assert from 'node:assert/strict';
import type { Abi } from 'viem';
import {
  DEFAULT_ZEKFEROW_ABI,
  normalizeMandateResult,
  normalizePlatformStats,
  normalizePullHistoryResult,
  resolveContractFunctions,
} from './abiAdapter';

test('resolveContractFunctions resolves default ABI methods', () => {
  const resolved = resolveContractFunctions(DEFAULT_ZEKFEROW_ABI);
  assert.equal(resolved.createMandate, 'createMandate');
  assert.equal(resolved.updateLimit, 'updateLimit');
  assert.equal(resolved.revokeMandate, 'revokeMandate');
  assert.equal(resolved.pullPayment, 'pullPayment');
  assert.equal(resolved.getPlatformStats, 'getPlatformStats');
});

test('resolveContractFunctions adapts to alternate deployed ABI naming', () => {
  const customAbi = [
    {
      type: 'function',
      name: 'authorizeMerchant',
      stateMutability: 'nonpayable',
      inputs: [],
      outputs: [],
    },
    {
      type: 'function',
      name: 'changeLimit',
      stateMutability: 'nonpayable',
      inputs: [],
      outputs: [],
    },
    {
      type: 'function',
      name: 'pull',
      stateMutability: 'nonpayable',
      inputs: [],
      outputs: [],
    },
  ] as const satisfies Abi;

  const resolved = resolveContractFunctions(customAbi);
  assert.equal(resolved.createMandate, 'authorizeMerchant');
  assert.equal(resolved.updateLimit, 'changeLimit');
  assert.equal(resolved.pullPayment, 'pull');
});

test('normalizeMandateResult normalizes both object and tuple shapes', () => {
  const objMandate = normalizeMandateResult({
    id: 7n,
    user: '0x1111111111111111111111111111111111111111',
    merchant: '0x2222222222222222222222222222222222222222',
    token: '0x3600000000000000000000000000000000000000',
    monthlyLimit: 500_000_000n,
    active: true,
    createdAt: 1700000000n,
  });
  assert.equal(objMandate?.id, 7n);
  assert.equal(objMandate?.active, true);

  const tupleMandate = normalizeMandateResult(
    [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3600000000000000000000000000000000000000',
      250_000_000n,
      false,
      1700000000n,
    ],
    9n
  );
  assert.equal(tupleMandate?.id, 9n);
  assert.equal(tupleMandate?.active, false);
  assert.equal(tupleMandate?.monthlyLimit, 250_000_000n);
});

test('normalizePullHistoryResult and normalizePlatformStats parse contract outputs', () => {
  const pulls = normalizePullHistoryResult([
    {
      mandateId: 1n,
      merchant: '0x2222222222222222222222222222222222222222',
      amount: 25_000_000n,
      timestamp: 1700000500n,
    },
  ]);
  assert.equal(pulls.length, 1);
  assert.equal(pulls[0].amount, 25_000_000n);

  const stats = normalizePlatformStats([12n, 8n, 44n]);
  assert.equal(stats?.totalMandates, 12n);
  assert.equal(stats?.activeMandates, 8n);
  assert.equal(stats?.totalPulls, 44n);
});
