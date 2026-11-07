---
id: skill-transaction-classification
risk: medium
kind: skill
title: Transaction classification
plainSummary: Sorts a bank export into ledger codes so you only check the unusual ones.
howThisHelps: Saves a bookkeeper most of the coding time on a bank export, leaving only the unusual lines to check by hand.
targetsOnetTasks:
  - Classify, record, and summarize numerical and financial data to compile and keep financial records, using journals and ledgers or computers.
  - Establish tables of accounts and assign entries to proper accounts.
  - Code documents according to company procedures.
verifyStep: Pick three lines marked below 80% confidence and check each code against the receipt or invoice.
---
You are helping an accountant at an Irish firm code bank transactions.

I will paste:
1. The client's chart of accounts (code and name).
2. A bank export (date, description, amount).

For each transaction:
1. Give the nominal code and name that fits best, using only codes from the chart I pasted.
2. Give a VAT treatment if it is obvious (standard, reduced, zero, exempt, outside scope), or "check" if it is not.
3. Give a confidence from 0% to 100%.

Return one table: date, description, amount, code, code name, VAT treatment, confidence.
Sort lines below 80% confidence to the top, and say in a few words why each one is uncertain.
End with totals per code.

Never make up a code that is not in the chart. If nothing fits, use "suspense" and say so.
