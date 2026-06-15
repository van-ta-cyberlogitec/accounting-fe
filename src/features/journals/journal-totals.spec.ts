import { describe, expect, it } from "vitest";
import { journalTotals } from "./journal-totals";

describe("journalTotals", () => {
  it("calculates base currency debit and credit without floating point drift", () => {
    expect(
      journalTotals([
        { debitTransaction: "0.1", creditTransaction: "0", exchangeRate: "1" },
        { debitTransaction: "0.2", creditTransaction: "0", exchangeRate: "1" },
        { debitTransaction: "0", creditTransaction: "0.3", exchangeRate: "1" },
      ]),
    ).toEqual({ debit: "0.3000", credit: "0.3000", balanced: true });
  });
});
