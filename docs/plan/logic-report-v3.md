# Logic check report

Server: http://localhost:3000  
Run at: 2026-11-07T15:36:58.938Z  
Result: **30/30 passed**

| Result | ID | Prompt | Outcome | Skill | Countdown | Failed rules |
| --- | --- | --- | --- | --- | --- | --- |
| pass | v2-1-before-18-nov | What should I hand to AI before 18 November? | skill | skill-bank-reconciliation | ROS pay and file (extended) (2026-11-18, 11d) |  |
| pass | v2-2-help | help | skill | skill-bank-reconciliation |  |  |
| pass | v2-3-vat-by-friday | Can AI do my VAT return for Byrne Foods by Friday? | no_match |  |  |  |
| pass | v2-4-weather | What's the weather in Cork? | decline |  |  |  |
| pass | v2-5-dont-trust | I don't trust AI, what's the safest thing to start with? | skill | hook-check-the-output |  |  |
| pass | vague-hi | hi | skill | skill-meeting-summary |  |  |
| pass | vague-what-can-you-do | what can you do? | no_match |  |  |  |
| pass | bank-rec-byrne | Can you reconcile the Byrne Foods bank account for October? | skill | skill-bank-reconciliation |  |  |
| pass | ct1-murphy-23-nov | I need the CT1 for Murphy Engineering reviewed by 23 November | skill | skill-ct1-review-checklist | CT1 return and balance, year ended 28 Feb 2026 (2026-11-23, 16d) |  |
| pass | payroll-oconnor | Can AI run the payroll for O'Connor Pharmacy Group? | no_match |  |  |  |
| pass | client-email-kelly | Draft a reply to the Kelly Family's email asking what they still owe on their Form 11 | skill | hook-no-pps-in-email |  |  |
| pass | meeting-transcript-walsh | Summarise the meeting transcript from the Walsh Holdings audit planning call | skill | skill-meeting-summary |  |  |
| pass | meeting-notes-lee | Turn my meeting notes from the Lee Clinics stock count into an action list | skill | skill-meeting-notes-actions |  |  |
| pass | classify-byrne | Code the bank transactions for Byrne Foods into a table | skill | skill-transaction-classification |  |  |
| pass | inbox-niamh | My inbox is a mess, which unread emails need a reply first? | skill | skill-inbox-triage |  |  |
| pass | commitments-conor | What did I promise clients in my sent emails over the last month? | skill | skill-commitment-tracker |  |  |
| pass | status-report-walsh | Write the monthly status report for Walsh Holdings | skill | skill-engagement-status-report |  |  |
| pass | working-paper-lee | Summarise the working papers on the Lee Clinics audit file | skill | skill-working-paper-summary |  |  |
| pass | automate-process-tom | Which parts of our onboarding process could we automate? | skill | skill-ai-opportunity-finder |  |  |
| pass | messaging-seminar | Help me with the messaging for our tax seminar pitch | skill | skill-messaging-framework |  |  |
| pass | off-topic-hurling | Who won the All-Ireland hurling final? | decline |  |  |  |
| pass | off-topic-restaurant-friday | Recommend a good restaurant in Grand Cayman for Friday | decline |  |  |  |
| pass | off-topic-joke | Tell me a joke | decline |  |  |  |
| pass | typo-vat-firday | can ai do my vat retrun for byrne foods by firday | no_match |  |  |  |
| pass | typo-bank-rec | bank reconcilation for oconnor pharmacy pls | skill | skill-bank-reconciliation |  |  |
| pass | typo-ct1-review | ct1 reveiw for murphy enginering | skill | skill-ct1-review-checklist | CT1 return and balance, year ended 28 Feb 2026 (2026-11-23, 16d) |  |
| pass | distrust-worried-numbers | I'm worried AI will get the numbers wrong. What's a safe first step? | skill | hook-check-the-output |  |  |
| pass | distrust-sceptical-walsh | I'm sceptical about AI, is there anything low-risk I could try on the Walsh audit? | skill | hook-check-the-output |  |  |
| pass | named-date-before-friday | What can AI take off my plate before Friday? | skill | skill-ct1-review-checklist | Your deadline, Friday (2026-11-13, 6d) |  |
| pass | client-email-quinn-tomorrow | Email Quinn Tech about the documents they still owe us, I need it sent by tomorrow | skill | skill-client-query-reply | Your deadline, tomorrow (2026-11-08, 1d) |  |
