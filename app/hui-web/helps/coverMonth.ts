export const LOAN_TERMS = {
  twoMinutes: 12,
  oneMonth: 1,
  threeMonths: 3,
  sixMonths: 6,
  nineMonths: 9,
  twelveMonths: 12,
}

export type LoanTerm = keyof typeof LOAN_TERMS
