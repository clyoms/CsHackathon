// The 4D AI literacy course: four short lessons on Anthropic's AI Fluency framework,
// each with one exercise set in an Irish accounting firm. Written in our own words.
// Source: Anthropic's AI Fluency course (AI Fluency: Framework and Foundations).

export const LESSON_IDS = ["4d-delegation", "4d-description", "4d-discernment", "4d-diligence"] as const;
export type LessonId = (typeof LESSON_IDS)[number];

export interface Lesson {
  id: LessonId;
  /** The D this lesson covers, such as "Delegation". */
  title: string;
  /** One line on what the D means. */
  summary: string;
  /** The short read: about two minutes, one paragraph per entry. */
  read: string[];
  exercise: {
    /** The situation at the firm. */
    scenario: string;
    /** What the person should do. */
    task: string;
    /** A worked answer to compare against once they have tried it. */
    answer: string[];
  };
}

export const LITERACY_SOURCE = {
  name: "Anthropic, AI Fluency: Framework and Foundations",
  url: "https://www.anthropic.com/learn",
} as const;

export const LESSONS: readonly Lesson[] = [
  {
    id: "4d-delegation",
    title: "Delegation",
    summary: "Deciding what work to hand to AI, what to keep, and what to do together.",
    read: [
      "Delegation is the first decision, made before you type anything. You look at a piece of work and ask which parts AI should do, which parts you should do, and which parts you do together. The answer depends on three things: what you are trying to get done, what AI is good and bad at, and what is at stake if it goes wrong.",
      "AI is quick at reading, sorting, summarising and drafting. It is weak at knowing your client, at knowing facts it has not been given, and at being accountable. It also cannot see your systems unless you show it the data. So work that is repetitive and easy to check is a good fit. Work that needs judgement, a signature or knowledge only you hold stays with you.",
      "A useful habit is to split a task into steps and mark each one: AI does it, I do it, or we do it together. Most real accounting work ends up mixed. The skill is in drawing those lines on purpose, not handing over the whole job or none of it.",
    ],
    exercise: {
      scenario:
        "It is early November. You are preparing a bimonthly VAT3 return for a Cork café client: sales and purchase listings from their bookkeeping export, a box of supplier invoices, and a note that they bought a new coffee machine.",
      task: "List the steps of this VAT return and mark each one: AI does it, I do it, or we do it together.",
      answer: [
        "AI does it: sort the purchase listing by VAT rate and flag lines with no VAT number or an odd rate.",
        "Together: match supplier invoices to the listing. AI suggests matches, you confirm the ones it is unsure of.",
        "Together: draft the T1 and T2 figures from the listings, then you rework them by hand from the totals.",
        "I do it: decide whether VAT on the coffee machine can be reclaimed, and treat any mixed-use or exempt items.",
        "I do it: approve the return and file it on ROS. AI never files and never holds the ROS login.",
      ],
    },
  },
  {
    id: "4d-description",
    title: "Description",
    summary: "Telling AI clearly what you want, how to go about it, and how to behave.",
    read: [
      "Description is how you talk to AI. A vague request gets a vague answer, because the AI fills the gaps with guesses. A good description covers three things: the product (what you want back, in what format), the process (the steps or rules to follow) and the performance (how the AI should act, such as asking before it assumes).",
      "Give it the context a new colleague would need: who the client is, which period, which tax head, which rules apply in Ireland, and what the output is for. Paste or attach the actual data rather than describing it. Say what to do when something is missing or unclear, for example \"list it as a question, do not guess\".",
      "Treat the first answer as a draft of the conversation, not the end of it. If it misses, say what was wrong and ask again. Over time you build prompts you can reuse, which is where most of the saved time comes from.",
    ],
    exercise: {
      scenario: "A colleague wrote this prompt and got a generic answer about VAT in another country: \"Do the VAT for Murphy's.\"",
      task: "Rewrite the prompt so it covers the product, the process and the performance.",
      answer: [
        "\"You are helping an Irish accounting firm. Client: Murphy's Hardware Ltd, Irish VAT registered, bimonthly returns.",
        "Period: September to October 2026. I have pasted the sales and purchase listings below.",
        "Product: a table of net and VAT amounts by Irish VAT rate (23%, 13.5%, 9%, 0%), then draft T1 and T2 totals for the VAT3.",
        "Process: use only the figures I have pasted. Show how each total was built.",
        "Performance: if a line has no VAT rate or looks wrong, list it under 'Questions for me' instead of guessing. Do not give tax advice on reclaim rules; flag them for me.\"",
      ],
    },
  },
  {
    id: "4d-discernment",
    title: "Discernment",
    summary: "Judging what AI gives back: is it right, is it complete, and did it go about it sensibly.",
    read: [
      "Discernment is checking the output with a critical eye. AI writes with the same confidence whether it is right or wrong, so the tone tells you nothing. You judge three things: the product (are the figures and facts correct), the process (did it follow the steps you asked for, or skip some) and the performance (did it ask when it should have, or invent something to fill a gap).",
      "In accounting the most common failures are quiet ones: a total that does not add up, a line dropped from a long list, a date read the wrong way round, or a confident rule that does not apply in Ireland. Look for figures you can test against a source, like a bank statement closing balance or a trial balance total.",
      "You do not need to redo the work to check it. Pick the checks that would catch the costly errors: totals tie back, nothing is missing, and anything surprising has a reason. If something is off, tell the AI exactly what and ask it to show its working.",
    ],
    exercise: {
      scenario:
        "AI reconciled October for a client's AIB current account. It reports: bank statement closing balance €18,420.50, ledger balance €18,920.50, difference €500 explained by \"a timing difference on cheque 1047, which cleared in November\". The cheque register shows cheque 1047 for €500 was issued on 28 October and appears on the October bank statement as cleared on 31 October.",
      task: "Find the error in the AI's reconciliation and say what the real next step is.",
      answer: [
        "The explanation is wrong: cheque 1047 cleared in October, so it cannot be a timing difference at the month end.",
        "Worse, an outstanding cheque would make the bank balance higher than the ledger, not lower. The direction of the difference does not fit the story.",
        "So the €500 is unexplained. The next step is to look for a ledger entry with no bank match, for example a lodgement posted twice or a receipt recorded but never banked, and fix the cause before signing off.",
      ],
    },
  },
  {
    id: "4d-diligence",
    title: "Diligence",
    summary: "Taking responsibility for AI-assisted work: checking it, being open about it, and owning it.",
    read: [
      "Diligence is about responsibility. When AI helps with a piece of work, the work is still yours and the firm's. You choose which tools are suitable for client data, you are open with colleagues and clients about where AI was used, and you check the output before it goes anywhere that matters.",
      "It covers the whole life of the work. Before: is this the right tool, and is the client data allowed in it under the firm's policy and GDPR? During: are you keeping a note of what AI did? After: has a person checked it, and would you be happy to explain how it was made to a client, a reviewer or Revenue?",
      "A simple way to practise diligence is to write the check step before you start, not after. Decide in advance what a person must confirm before anything is filed, sent or signed. Under the EU AI Act, firms also need staff to have enough AI literacy for the tools they use, and a record like this course log helps show it.",
    ],
    exercise: {
      scenario: "AI has drafted a client's CT1 computation and the corporation tax figure for the return due on ROS. The partner wants to file this week.",
      task: "Write the check step a person must complete before the return is filed.",
      answer: [
        "Before filing, the preparer confirms and initials each of these on the file:",
        "1. Profit per the accounts ties to the signed financial statements.",
        "2. Every add-back and capital allowance figure traces to a schedule or source document, not just the AI draft.",
        "3. The tax rate, losses brought forward and preliminary tax paid match last year's return and the Revenue record.",
        "4. The file notes that AI drafted the computation and who checked it.",
        "5. A second person reviews it and the partner approves it before it goes on ROS.",
      ],
    },
  },
];

const BY_ID = new Map<string, Lesson>(LESSONS.map((l) => [l.id, l]));

/** The lesson with this id, or undefined. */
export function findLesson(id: string): Lesson | undefined {
  return BY_ID.get(id);
}

/** True when `id` is one of the four lesson ids. */
export function isLessonId(id: string): id is LessonId {
  return BY_ID.has(id);
}
