/**
 * Unit Tests for EMI Calculator
 * Location: utils/emiCalculator.test.ts
 *
 * Execution: npx tsx utils/emiCalculator.test.ts
 */

import assert from 'node:assert';
import { calculateEmi } from './emiCalculator';

console.log('Running utils/emiCalculator.test.ts unit tests...\n');

// Scenario A: 25L, 10%, 10y
const scenarioA = calculateEmi(2500000, 10, 10);
assert.strictEqual(scenarioA.emi, 33038, `Scenario A EMI: expected 33038, got ${scenarioA.emi}`);
assert.strictEqual(
  scenarioA.totalInterest,
  1464522,
  `Scenario A Total Interest: expected 1464522, got ${scenarioA.totalInterest}`
);
assert.strictEqual(
  scenarioA.totalPayment,
  3964522,
  `Scenario A Total Payment: expected 3964522, got ${scenarioA.totalPayment}`
);

// Scenario B: 50L, 7.5%, 15y
const scenarioB = calculateEmi(5000000, 7.5, 15);
assert.strictEqual(scenarioB.emi, 46351, `Scenario B EMI: expected 46351, got ${scenarioB.emi}`);
assert.strictEqual(
  scenarioB.totalInterest,
  3343111,
  `Scenario B Total Interest: expected 3343111, got ${scenarioB.totalInterest}`
);
assert.strictEqual(
  scenarioB.totalPayment,
  8343111,
  `Scenario B Total Payment: expected 8343111, got ${scenarioB.totalPayment}`
);

// Zero interest rate edge case: 120000, 0%, 1y
const zeroRate = calculateEmi(120000, 0, 1);
assert.strictEqual(zeroRate.emi, 10000, `Zero rate EMI: expected 10000, got ${zeroRate.emi}`);
assert.strictEqual(
  zeroRate.totalInterest,
  0,
  `Zero rate Total Interest: expected 0, got ${zeroRate.totalInterest}`
);
assert.strictEqual(
  zeroRate.totalPayment,
  120000,
  `Zero rate Total Payment: expected 120000, got ${zeroRate.totalPayment}`
);

// Zero principal / tenure edge cases
const zeroPrincipal = calculateEmi(0, 10, 10);
assert.strictEqual(zeroPrincipal.emi, 0);

console.log('All unit tests in utils/emiCalculator.test.ts passed successfully!');
