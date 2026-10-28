/**
 * Unit Tests for Number and Currency Parsing Utilities
 * Location: utils/parse.test.ts
 *
 * Execution: npx tsx utils/parse.test.ts
 */

import assert from 'node:assert';
import { parseIndianNumber, parsePercentage } from './parse';

interface TestCase<T, R> {
  input: T;
  expected: R;
  description: string;
}

console.log('Running utils/parse.test.ts unit tests...\n');

// 1. parseIndianNumber tests
const parseIndianNumberTests: TestCase<string, number>[] = [
  {
    input: '25,00,000',
    expected: 2500000,
    description: 'parses Indian comma grouped lakh string (25L)',
  },
  {
    input: '50,00,000',
    expected: 5000000,
    description: 'parses Indian comma grouped lakh string (50L)',
  },
  {
    input: '1,07,96,711',
    expected: 10796711,
    description: 'parses Indian comma grouped crore string (1Cr+)',
  },
  {
    input: '₹ 33,038',
    expected: 33038,
    description: 'parses currency string with ₹ symbol and space',
  },
  {
    input: '₹14,64,522',
    expected: 1464522,
    description: 'parses currency string with ₹ symbol and no space',
  },
  {
    input: '14,64,522.11',
    expected: 1464522.11,
    description: 'parses decimal values with comma formatting',
  },
  {
    input: '33,43,110.78',
    expected: 3343110.78,
    description: 'parses Highcharts float interest slice value',
  },
  {
    input: '   ₹ 46,351 \n',
    expected: 46351,
    description: 'strips leading/trailing whitespaces and newlines',
  },
  {
    input: '0',
    expected: 0,
    description: 'parses zero as string',
  },
  {
    input: '',
    expected: 0,
    description: 'returns 0 for empty string',
  },
  {
    input: '   ',
    expected: 0,
    description: 'returns 0 for whitespace-only string',
  },
  {
    input: '₹',
    expected: 0,
    description: 'returns 0 for solitary currency symbol',
  },
  {
    input: 'invalid_text',
    expected: 0,
    description: 'returns 0 for non-numeric string',
  },
];

let passed = 0;

for (const tc of parseIndianNumberTests) {
  const actual = parseIndianNumber(tc.input);
  assert.strictEqual(
    actual,
    tc.expected,
    `[parseIndianNumber] Failed on "${tc.description}": expected ${tc.expected}, got ${actual}`
  );
  passed++;
}

// 2. parsePercentage tests
const parsePercentageTests: TestCase<string, number>[] = [
  {
    input: '10.0%',
    expected: 10.0,
    description: 'parses standard percentage string with decimal and %',
  },
  {
    input: '7.5%',
    expected: 7.5,
    description: 'parses float percentage string with %',
  },
  {
    input: '63.1 %',
    expected: 63.1,
    description: 'parses percentage string with space before %',
  },
  {
    input: '36.9',
    expected: 36.9,
    description: 'parses numeric string without %',
  },
  {
    input: '  40.1%  ',
    expected: 40.1,
    description: 'strips whitespaces surrounding percentage string',
  },
  {
    input: '0%',
    expected: 0,
    description: 'parses 0%',
  },
  {
    input: '',
    expected: 0,
    description: 'returns 0 for empty percentage string',
  },
  {
    input: '%',
    expected: 0,
    description: 'returns 0 for solitary % symbol',
  },
  {
    input: 'abc%',
    expected: 0,
    description: 'returns 0 for non-numeric percentage string',
  },
];

for (const tc of parsePercentageTests) {
  const actual = parsePercentage(tc.input);
  assert.strictEqual(
    actual,
    tc.expected,
    `[parsePercentage] Failed on "${tc.description}": expected ${tc.expected}, got ${actual}`
  );
  passed++;
}

console.log(`All ${passed} unit tests in utils/parse.test.ts passed successfully!`);
