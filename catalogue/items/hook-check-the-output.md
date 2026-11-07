---
id: hook-check-the-output
risk: low
kind: hook
title: Check the output
plainSummary: Before you use an AI answer with numbers in it, it asks you to confirm three figures yourself.
howThisHelps: Saves a reviewer from sending a client a wrong figure by making the preparer confirm the key numbers before an AI answer is used.
targetsOnetTasks:
  - Check data input or verify totals on forms prepared by others to detect errors in arithmetic, data entry, or procedures.
  - Check figures, postings, and documents for correct entry, mathematical accuracy, and proper codes.
verifyStep: The hook is the verify step. Once a week, look at the log of confirmed figures and check that three of them really match the source.
---
A hook is a rule that runs every time, so nobody has to remember it.

When: after the AI gives an answer that contains three or more numbers, and before you copy it anywhere.

What it does:
1. Picks three figures from the answer: the largest amount, the total, and one at random.
2. Shows them to you with the question: "Where did this figure come from? Check it against the source."
3. Asks you to tick each one as "Matches source", "Does not match" or "Cannot find source".
4. If any figure does not match or has no source, it stops the copy and says: "Fix or remove this figure before you use the answer."
5. Saves a line to the literacy log: date, your name, the three figures, and what you ticked.

Rule text for the hook settings:
- trigger: answer contains 3 or more numbers
- action: ask to confirm 3 figures (largest, total, one random)
- block if: any figure is "Does not match" or "Cannot find source"
- log: yes
