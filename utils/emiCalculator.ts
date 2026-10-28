/**
 * EMI and Loan Financial Calculator Utilities
 * Location: utils/emiCalculator.ts
 *
 * Implements standard continuous compounding EMI (Equated Monthly Installment)
 * formulas matching the live emicalculator.net mathematical engine.
 */

export interface EmiCalculationResult {
  /**
   * Rounded Equated Monthly Installment (INR)
   */
  emi: number;

  /**
   * Unrounded continuous floating-point EMI
   */
  emiExact: number;

  /**
   * Total interest payable over the entire tenure (INR),
   * computed using the exact continuous formula: Math.round(n * emiExact - principal).
   * Matches live site calculation (₹14,64,522 for Scenario A and ₹33,43,111 for Scenario B).
   */
  totalInterest: number;

  /**
   * Total payment (Principal + Total Interest)
   */
  totalPayment: number;

  /**
   * Monthly fractional interest rate (annualRate / 12 / 100)
   */
  monthlyRate: number;

  /**
   * Total tenure in months (years * 12)
   */
  totalMonths: number;
}

/**
 * Standard EMI tolerance justification:
 * A ±1 INR tolerance is standard when comparing displayed EMI against mathematical
 * calculations because:
 * 1. Mathematical EMI produces continuous fractional values (e.g. 33037.684 INR).
 * 2. emicalculator.net rounds to the nearest integer currency unit via standard half-up rounding.
 * 3. Platform/runtime floating-point arithmetic (IEEE 754) can exhibit micro-precision variances
 *    near boundary values (e.g. .49999 vs .50001).
 *
 * Discretization Drift Notice on Total Interest:
 * Comparing displayed total interest to `(displayedEmi * n) - principal` incurs an expected
 * accumulation drift of up to ₹50 due to monthly discretization vs single integer rounding.
 * For example, in Scenario A (25L, 10%, 10y):
 * - Rounded EMI: ₹33,038
 * - Naive product: 33,038 * 120 - 25,00,000 = ₹14,64,560
 * - Continuous/Amortized Total Interest: ₹14,64,522 (exact match to live site)
 * - Expected drift: ₹38 (120 months * +0.316 INR monthly rounding delta = ~₹38)
 */
export const EMI_ROUNDING_TOLERANCE = 1;
export const TOTAL_INTEREST_TOLERANCE = 2;
export const TOTAL_PAYMENT_TOLERANCE = 2;

/**
 * Calculates standard Equated Monthly Installment (EMI), total interest, and total payment.
 *
 * Continuous Formula:
 *   r = annualRate / 12 / 100
 *   n = tenureYears * 12
 *
 * If r === 0:
 *   EMI = principal / n
 * Else:
 *   EMI = (principal * r * (1 + r)^n) / ((1 + r)^n - 1)
 *
 * @param principal Principal loan amount in INR (P)
 * @param annualRate Annual interest rate as percentage (e.g. 10.0 for 10%)
 * @param tenureYears Loan tenure in years (e.g. 10 for 10 years)
 * @returns EmiCalculationResult with rounded and continuous values
 */
export function calculateEmi(
  principal: number,
  annualRate: number,
  tenureYears: number
): EmiCalculationResult {
  if (principal <= 0 || tenureYears <= 0) {
    return {
      emi: 0,
      emiExact: 0,
      totalInterest: 0,
      totalPayment: 0,
      monthlyRate: 0,
      totalMonths: 0,
    };
  }

  const n = Math.round(tenureYears * 12);
  const r = annualRate > 0 ? annualRate / 12 / 100 : 0;

  let emiExact: number;
  if (r === 0) {
    emiExact = principal / n;
  } else {
    const compoundFactor = Math.pow(1 + r, n);
    emiExact = (principal * r * compoundFactor) / (compoundFactor - 1);
  }

  const emi = Math.round(emiExact);
  const totalInterest = Math.round(n * emiExact - principal);
  const totalPayment = principal + totalInterest;

  return {
    emi,
    emiExact,
    totalInterest,
    totalPayment,
    monthlyRate: r,
    totalMonths: n,
  };
}
