/**
 * Number and Currency Parsing Utilities
 * Location: utils/parse.ts
 *
 * Designed to parse Indian numbering format strings (lakhs, crores, ₹ currency symbols),
 * percentage values, and standard decimal/integer inputs from UI elements.
 */

/**
 * Parses an Indian formatted currency or numeric string into a JavaScript number.
 * Strips Indian Rupee symbol (₹, \u20B9), commas, whitespaces, and currency prefixes.
 *
 * Examples:
 *   "₹ 33,038"     -> 33038
 *   "₹ 14,64,522"  -> 1464522
 *   "25,00,000"    -> 2500000
 *   "1,07,96,711"  -> 10796711
 *   " 46,351.50 "  -> 46351.5
 *   ""             -> 0
 *
 * @param text The input string representing an Indian currency or formatted number
 * @returns The parsed numeric value, or 0 if unparseable/empty
 */
export function parseIndianNumber(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // Strip ₹ symbol, commas, and whitespace characters (including non-breaking spaces)
  const cleaned = text.replace(/[₹\u20B9,\s\u00A0]/g, '').trim();
  if (cleaned.length === 0) {
    return 0;
  }

  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Parses a percentage string into a floating point number.
 * Strips '%' symbol and whitespaces.
 *
 * Examples:
 *   "10.0%"  -> 10.0
 *   "7.5 %"  -> 7.5
 *   " 63.1 " -> 63.1
 *   ""       -> 0
 *
 * @param text The input string representing a percentage
 * @returns The parsed numeric percentage value, or 0 if unparseable/empty
 */
export function parsePercentage(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const cleaned = text.replace(/[%,\s\u00A0]/g, '').trim();
  if (cleaned.length === 0) {
    return 0;
  }

  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
}
