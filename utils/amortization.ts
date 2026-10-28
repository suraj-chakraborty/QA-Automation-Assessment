/**
 * Loan Amortization Schedule Computation Utilities
 * Location: utils/amortization.ts
 *
 * Computes monthly continuous annuity schedule and calendar-year rollup matching
 * the live emicalculator.net mathematical engine and Highcharts bar chart groupings.
 */

export interface MonthlyAmortizationItem {
  monthIndex: number;
  month: number; // 1-12
  year: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  endingBalance: number;
}

export interface YearlyAmortizationItem {
  year: number;
  monthsCount: number;
  principal: number;
  interest: number;
  totalPayment: number;
  endingBalance: number;
}

export interface AmortizationScheduleResult {
  monthly: MonthlyAmortizationItem[];
  yearly: YearlyAmortizationItem[];
  totalPrincipal: number;
  totalInterest: number;
  totalPayment: number;
}

/**
 * Standard rounding tolerance for yearly amortization sums (±2 INR)
 * accounts for micro-precision float rounding differences across monthly intervals.
 */
export const AMORTIZATION_TOLERANCE = 2;
export const TOOLTIP_TOLERANCE = 2;

/**
 * Derives the expected number of calendar year bars on the Highcharts amortization chart.
 *
 * Mathematical Proof:
 * - If start month is January: payments span Jan Year 1 to Dec Year T (exactly T calendar years).
 * - If start month is Feb–Dec: Year 1 is partial (13 - M months), intermediate years are T - 1 full years,
 *   and Year T + 1 is partial (M - 1 months) -> exactly T + 1 calendar years.
 *
 * @param tenureYears Loan tenure in years (e.g. 5)
 * @param startMonthStr Start month abbreviation or name (e.g. "Jul", "January", "Oct")
 * @returns Expected number of bar chart columns
 */
export function deriveExpectedBarCount(tenureYears: number, startMonthStr: string): number {
  if (tenureYears <= 0) return 0;
  const isJanuary = /^jan/i.test(startMonthStr.trim());
  return isJanuary ? tenureYears : tenureYears + 1;
}

export const deriveBarCount = deriveExpectedBarCount;

/**
 * Helper to normalize month string into 1-12 numeric month.
 */
function parseMonthNumber(monthStr: string): number {
  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const cleaned = monthStr.trim().toLowerCase();
  const index = monthNames.findIndex(m => cleaned.startsWith(m));
  return index >= 0 ? index + 1 : 1;
}

/**
 * Computes monthly and yearly amortization schedules for a given loan using
 * continuous floating-point accumulation matching emicalculator.net.
 *
 * @param principal Principal loan amount in INR (e.g. 1000000)
 * @param annualRate Annual interest rate as percentage (e.g. 12 for 12%)
 * @param tenureYears Loan tenure in years (e.g. 5)
 * @param startMonthStr Start month name or abbreviation (e.g. "July", "Jul", "Jan")
 * @param startYear Start calendar year (e.g. 2026)
 */
export function calculateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureYears: number,
  startMonthStr: string,
  startYear: number
): AmortizationScheduleResult {
  if (principal <= 0 || tenureYears <= 0) {
    return {
      monthly: [],
      yearly: [],
      totalPrincipal: 0,
      totalInterest: 0,
      totalPayment: 0,
    };
  }

  const startMonth = parseMonthNumber(startMonthStr);
  const totalMonths = Math.round(tenureYears * 12);
  const monthlyRate = annualRate > 0 ? annualRate / 12 / 100 : 0;

  let emiExact: number;
  if (monthlyRate === 0) {
    emiExact = principal / totalMonths;
  } else {
    const compound = Math.pow(1 + monthlyRate, totalMonths);
    emiExact = (principal * monthlyRate * compound) / (compound - 1);
  }

  let currentBalance = principal;
  const monthly: MonthlyAmortizationItem[] = [];
  let curMonth = startMonth;
  let curYear = startYear;

  for (let i = 1; i <= totalMonths; i++) {
    const interest = currentBalance * monthlyRate;
    let principalPaid = emiExact - interest;

    if (i === totalMonths || principalPaid > currentBalance) {
      principalPaid = currentBalance;
    }
    currentBalance = Math.max(0, currentBalance - principalPaid);

    monthly.push({
      monthIndex: i,
      month: curMonth,
      year: curYear,
      principalPayment: principalPaid,
      interestPayment: interest,
      totalPayment: principalPaid + interest,
      endingBalance: currentBalance,
    });

    curMonth++;
    if (curMonth > 12) {
      curMonth = 1;
      curYear++;
    }
  }

  // Group by calendar year
  const yearlyMap = new Map<
    number,
    {
      monthsCount: number;
      principal: number;
      interest: number;
      totalPayment: number;
      endingBalance: number;
    }
  >();

  for (const m of monthly) {
    const existing = yearlyMap.get(m.year) ?? {
      monthsCount: 0,
      principal: 0,
      interest: 0,
      totalPayment: 0,
      endingBalance: 0,
    };
    existing.monthsCount += 1;
    existing.principal += m.principalPayment;
    existing.interest += m.interestPayment;
    existing.totalPayment += m.totalPayment;
    existing.endingBalance = m.endingBalance;
    yearlyMap.set(m.year, existing);
  }

  const yearly: YearlyAmortizationItem[] = [];
  let totalPrincipal = 0;
  let totalInterest = 0;
  let totalPayment = 0;

  for (const [year, vals] of yearlyMap.entries()) {
    const roundPrincipal = Math.round(vals.principal);
    const roundInterest = Math.round(vals.interest);
    const roundTotalPayment = Math.round(vals.totalPayment);
    const roundEndingBalance = Math.round(vals.endingBalance);

    yearly.push({
      year,
      monthsCount: vals.monthsCount,
      principal: roundPrincipal,
      interest: roundInterest,
      totalPayment: roundTotalPayment,
      endingBalance: roundEndingBalance,
    });

    totalPrincipal += roundPrincipal;
    totalInterest += roundInterest;
    totalPayment += roundTotalPayment;
  }

  return {
    monthly,
    yearly,
    totalPrincipal,
    totalInterest,
    totalPayment,
  };
}
