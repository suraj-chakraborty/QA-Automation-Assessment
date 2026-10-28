/**
 * Unit Tests for Amortization Schedule and Bar Count Derivation
 * Location: utils/amortization.test.ts
 *
 * Execution: npx tsx utils/amortization.test.ts
 */

import assert from 'node:assert';
import {
  calculateAmortizationSchedule,
  deriveExpectedBarCount,
  AMORTIZATION_TOLERANCE,
} from './amortization';

console.log('Running utils/amortization.test.ts unit tests...\n');

// 1. Bar Count Derivation Tests
assert.strictEqual(
  deriveExpectedBarCount(5, 'Jan'),
  5,
  '5 years starting in Jan should yield 5 bars'
);
assert.strictEqual(
  deriveExpectedBarCount(5, 'January'),
  5,
  '5 years starting in January should yield 5 bars'
);
assert.strictEqual(deriveExpectedBarCount(5, 'jan'), 5, 'Case insensitive jan should yield 5 bars');
assert.strictEqual(
  deriveExpectedBarCount(5, 'Oct'),
  6,
  '5 years starting in Oct should yield 6 bars'
);
assert.strictEqual(
  deriveExpectedBarCount(5, 'Jul'),
  6,
  '5 years starting in Jul should yield 6 bars'
);
assert.strictEqual(
  deriveExpectedBarCount(5, 'December'),
  6,
  '5 years starting in Dec should yield 6 bars'
);
assert.strictEqual(deriveExpectedBarCount(0, 'Jan'), 0, 'Zero tenure should yield 0 bars');

// 2. Schedule: 10L @ 12% for 5 years starting January 2027 (5 calendar years)
const jan2027 = calculateAmortizationSchedule(1000000, 12, 5, 'January', 2027);
assert.strictEqual(
  jan2027.yearly.length,
  5,
  `Expected 5 yearly entries for Jan start, got ${jan2027.yearly.length}`
);
assert.strictEqual(jan2027.monthly.length, 60, 'Expected 60 monthly entries');

// First Year: 2027 (12 full months)
const janYear1 = jan2027.yearly[0]!;
assert.strictEqual(janYear1.year, 2027);
assert.strictEqual(janYear1.monthsCount, 12);
assert.ok(
  Math.abs(janYear1.principal - 155290) <= AMORTIZATION_TOLERANCE,
  `Jan 2027 Year 1 Principal: expected ~155290, got ${janYear1.principal}`
);
assert.ok(
  Math.abs(janYear1.interest - 111643) <= AMORTIZATION_TOLERANCE,
  `Jan 2027 Year 1 Interest: expected ~111643, got ${janYear1.interest}`
);
assert.ok(
  Math.abs(janYear1.totalPayment - 266933) <= AMORTIZATION_TOLERANCE,
  `Jan 2027 Year 1 Total Payment: expected ~266933, got ${janYear1.totalPayment}`
);

// Final Year: 2031 (12 full months)
const janYear5 = jan2027.yearly[4]!;
assert.strictEqual(janYear5.year, 2031);
assert.strictEqual(janYear5.monthsCount, 12);
assert.ok(
  Math.abs(janYear5.principal - 250363) <= AMORTIZATION_TOLERANCE,
  `Jan 2027 Year 5 Principal: expected ~250363, got ${janYear5.principal}`
);
assert.ok(
  Math.abs(janYear5.interest - 16570) <= AMORTIZATION_TOLERANCE,
  `Jan 2027 Year 5 Interest: expected ~16570, got ${janYear5.interest}`
);
assert.ok(
  Math.abs(janYear5.totalPayment - 266933) <= AMORTIZATION_TOLERANCE,
  `Jan 2027 Year 5 Total Payment: expected ~266933, got ${janYear5.totalPayment}`
);

// 3. Schedule: 10L @ 12% for 5 years starting October 2026 (6 calendar years)
const oct2026 = calculateAmortizationSchedule(1000000, 12, 5, 'Oct', 2026);
assert.strictEqual(
  oct2026.yearly.length,
  6,
  `Expected 6 yearly entries for Oct start, got ${oct2026.yearly.length}`
);

// First Year: 2026 (3 months Oct-Dec) - matches live site tooltip exactly
const octYear1 = oct2026.yearly[0]!;
assert.strictEqual(octYear1.year, 2026);
assert.strictEqual(octYear1.monthsCount, 3);
assert.ok(
  Math.abs(octYear1.principal - 37102) <= AMORTIZATION_TOLERANCE,
  `Oct 2026 Year 1 Principal: expected ~37102, got ${octYear1.principal}`
);
assert.ok(
  Math.abs(octYear1.interest - 29631) <= AMORTIZATION_TOLERANCE,
  `Oct 2026 Year 1 Interest: expected ~29631, got ${octYear1.interest}`
);
assert.ok(
  Math.abs(octYear1.totalPayment - 66733) <= AMORTIZATION_TOLERANCE,
  `Oct 2026 Year 1 Total: expected ~66733, got ${octYear1.totalPayment}`
);

// 4. Schedule: 10L @ 12% for 5 years starting July 2026 (6 calendar years)
const jul2026 = calculateAmortizationSchedule(1000000, 12, 5, 'July', 2026);
assert.strictEqual(
  jul2026.yearly.length,
  6,
  `Expected 6 yearly entries for Jul start, got ${jul2026.yearly.length}`
);

// First Year: 2026 (6 months Jul-Dec)
const julYear1 = jul2026.yearly[0]!;
assert.strictEqual(julYear1.year, 2026);
assert.strictEqual(julYear1.monthsCount, 6);
assert.ok(
  Math.abs(julYear1.principal - 75328) <= AMORTIZATION_TOLERANCE,
  `Jul 2026 Year 1 Principal: expected ~75328, got ${julYear1.principal}`
);
assert.ok(
  Math.abs(julYear1.interest - 58139) <= AMORTIZATION_TOLERANCE,
  `Jul 2026 Year 1 Interest: expected ~58139, got ${julYear1.interest}`
);
assert.ok(
  Math.abs(julYear1.totalPayment - 133467) <= AMORTIZATION_TOLERANCE,
  `Jul 2026 Year 1 Total: expected ~133467, got ${julYear1.totalPayment}`
);

// Final Year: 2031 (6 months Jan-Jun)
const julYear6 = jul2026.yearly[5]!;
assert.strictEqual(julYear6.year, 2031);
assert.strictEqual(julYear6.monthsCount, 6);
assert.ok(
  Math.abs(julYear6.principal - 128917) <= AMORTIZATION_TOLERANCE,
  `Jul 2026 Year 6 Principal: expected ~128917, got ${julYear6.principal}`
);
assert.ok(
  Math.abs(julYear6.interest - 4550) <= AMORTIZATION_TOLERANCE,
  `Jul 2026 Year 6 Interest: expected ~4550, got ${julYear6.interest}`
);
assert.ok(
  Math.abs(julYear6.totalPayment - 133467) <= AMORTIZATION_TOLERANCE,
  `Jul 2026 Year 6 Total: expected ~133467, got ${julYear6.totalPayment}`
);

// Cumulative totals check
assert.ok(
  Math.abs(jul2026.totalPrincipal - 1000000) <= AMORTIZATION_TOLERANCE,
  `Total principal must equal 1000000, got ${jul2026.totalPrincipal}`
);
assert.ok(
  Math.abs(jul2026.totalInterest - 334667) <= AMORTIZATION_TOLERANCE,
  `Total interest must equal ~334667, got ${jul2026.totalInterest}`
);
assert.ok(
  Math.abs(jul2026.totalPayment - 1334667) <= AMORTIZATION_TOLERANCE,
  `Total payment must equal ~1334667, got ${jul2026.totalPayment}`
);

// 5. Edge cases
const zeroPrincipal = calculateAmortizationSchedule(0, 12, 5, 'Jan', 2026);
assert.strictEqual(zeroPrincipal.yearly.length, 0);

const zeroTenure = calculateAmortizationSchedule(1000000, 12, 0, 'Jan', 2026);
assert.strictEqual(zeroTenure.yearly.length, 0);

const zeroRate = calculateAmortizationSchedule(120000, 0, 1, 'Jan', 2026);
assert.strictEqual(zeroRate.yearly.length, 1);
assert.strictEqual(zeroRate.yearly[0]!.principal, 120000);
assert.strictEqual(zeroRate.yearly[0]!.interest, 0);
assert.strictEqual(zeroRate.yearly[0]!.totalPayment, 120000);

console.log('All unit tests in utils/amortization.test.ts passed successfully!');
