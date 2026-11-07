---
id: hook-no-pps-in-email
kind: hook
title: No PPS number in a client email
plainSummary: Stops an email from going out if it contains a PPS number.
targetsOnetTasks:
  - Comply with federal, state, and company policies, procedures, and regulations.
  - Furnish taxpayers with sufficient information and advice to ensure correct tax form completion.
verifyStep: Send yourself a test draft that contains a made-up number in PPS format, such as 1234567TA, and confirm the hook blocks it.
---
A hook is a rule that runs every time, so nobody has to remember it.

When: before any email or AI-drafted message to a client is sent.

What it does:
1. Looks for anything shaped like a PPS number: seven digits followed by one or two letters, with or without spaces (for example 1234567T or 1234567TA).
2. If it finds one, it blocks the send and shows: "This message contains what looks like a PPS number. Remove it, or send it through the secure client portal instead."
3. Lets you mark a match as "Not a PPS number" (for example an invoice reference). That choice is logged with your name.
4. Never stores or logs the number itself. The log records only that a match was blocked.

Rule text for the hook settings:
- trigger: before sending a message to a client
- pattern: \b\d{7}\s?[A-Za-z]{1,2}\b
- action: block and show the warning above
- log: date, user, "PPS pattern blocked" (no number)
