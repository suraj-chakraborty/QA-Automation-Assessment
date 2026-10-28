/**
 * Custom Cucumber Parameter Types
 * Location: support/parameterTypes.ts
 */

import { defineParameterType } from '@cucumber/cucumber';

/**
 * Parameter type: {lakh}
 * Matches e.g. "25L", "50 Lakhs", "10 lakh", "25"
 * Transforms to integer currency units in rupees (e.g. 2500000)
 */
defineParameterType({
  name: 'lakh',
  regexp: /(\d+(?:\.\d+)?)\s*(?:[Ll]|[Ll][Aa][Kk][Hh]|[Ll][Aa][Kk][Hh][Ss])?/,
  transformer: (val: string) => {
    const num = parseFloat(val);
    return Math.round(num * 100000);
  },
});

/**
 * Parameter type: {percent}
 * Matches e.g. "10%", "8.5 %", "9"
 * Transforms to numeric float (e.g. 8.5)
 */
defineParameterType({
  name: 'percent',
  regexp: /(\d+(?:\.\d+)?)\s*%?/,
  transformer: (val: string) => parseFloat(val),
});

/**
 * Parameter type: {years}
 * Matches e.g. "20 years", "15y", "5 yrs", "10"
 * Transforms to integer years (e.g. 20)
 */
defineParameterType({
  name: 'years',
  regexp: /(\d+)\s*(?:[Yy]|[Yy][Rr]|[Yy][Rr][Ss]|[Yy][Ee][Aa][Rr]|[Yy][Ee][Aa][Rr][Ss])?/,
  transformer: (val: string) => parseInt(val, 10),
});
