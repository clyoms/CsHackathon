// Sample questions for the employee page, from everyday work in an Irish accounting firm.
// A "Try this prompt" button puts one in the question box. It never sends it.

export interface SamplePrompt {
  /** Short name shown on the button. */
  label: string;
  /** The full question that goes into the box. */
  text: string;
}

export const SAMPLE_PROMPTS: readonly SamplePrompt[] = [
  {
    label: "VAT return",
    text: "Can AI help me prepare the VAT return for Byrne Foods by Friday?",
  },
  {
    label: "CT1",
    text: "What part of the CT1 for Murphy Engineering Ltd can I hand to AI?",
  },
  {
    label: "Bank reconciliation",
    text: "Can AI match last month's bank statement to the ledger for Lee Clinics Ltd?",
  },
  {
    label: "Payroll",
    text: "How can AI help me check this month's payroll for O'Connor Pharmacy Group?",
  },
  {
    label: "Client email reply",
    text: "Help me reply to a client who is asking why their tax bill went up this year.",
  },
  {
    label: "Before 18 November",
    text: "What should I hand to AI before 18 November?",
  },
  {
    label: "Safest place to start",
    text: "I don't trust AI, what's the safest thing to start with?",
  },
];

/** What a "Try this prompt" button needs from the page: set the box text and focus the box. */
export interface QuestionBox {
  setText: (text: string) => void;
  focus: () => void;
}

/** Puts a sample prompt in the question box and moves focus there. It does not send anything. */
export function fillQuestionBox(prompt: SamplePrompt, box: QuestionBox): void {
  box.setText(prompt.text);
  box.focus();
}
