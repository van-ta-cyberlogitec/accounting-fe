import Decimal from "decimal.js";

export interface JournalAmountInput {
  debitTransaction: string;
  creditTransaction: string;
  exchangeRate: string;
}

export function journalTotals(lines: JournalAmountInput[]) {
  const result = lines.reduce(
    (sum, line) => {
      const rate = new Decimal(line.exchangeRate || 0);
      return {
        debit: sum.debit.plus(
          new Decimal(line.debitTransaction || 0).times(rate),
        ),
        credit: sum.credit.plus(
          new Decimal(line.creditTransaction || 0).times(rate),
        ),
      };
    },
    { debit: new Decimal(0), credit: new Decimal(0) },
  );
  return {
    debit: result.debit.toFixed(4),
    credit: result.credit.toFixed(4),
    balanced: !result.debit.isZero() && result.debit.equals(result.credit),
  };
}
