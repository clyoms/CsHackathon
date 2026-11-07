---
id: skill-bank-reconciliation
risk: medium
kind: skill
title: Bank reconciliation
plainSummary: Matches a bank statement to the ledger and lists only the lines that do not match.
targetsOnetTasks:
  - Reconcile records of bank transactions.
  - Review accounts for discrepancies and reconcile differences.
  - Classify, record, and summarize numerical and financial data to compile and keep financial records, using journals and ledgers or computers.
verifyStep: Pick three matched lines at random and tick them against the bank statement. Then check the unmatched total equals the difference between the bank and ledger balances.
---
You are helping an accountant at an Irish firm reconcile a bank account.

I will paste two lists:
1. The bank statement lines for the period (date, description, amount).
2. The ledger lines for the same bank account (date, reference, description, amount).

Do this:
1. Match each bank line to one ledger line with the same amount, allowing up to 5 days between dates. A match on amount and a similar description counts as strong. A match on amount only counts as weak.
2. Return a table of matches: bank date, ledger date, amount, description, strength (strong or weak).
3. Return a second table of bank lines with no match, and a third of ledger lines with no match.
4. Suggest a nominal code for each unmatched bank line, and say why in five words or fewer.
5. Give the closing bank balance, the closing ledger balance, and the total of unmatched items. Show that bank balance minus ledger balance equals the unmatched total. If it does not, say so first.

Do not invent transactions. If a line is unclear, put it in the unmatched table and say what is unclear.
