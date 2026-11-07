import { describe, expect, it } from "vitest";
import { editDistance, parseNamedDeadline, pickDeadline, taskTopic } from "./index";

const TODAY = "2026-11-07"; // a Saturday

const catalogue = [
  { label: "ROS pay and file (extended)", date: "2026-11-18" },
  { label: "VAT return and payment through ROS, Jan-Feb 2027", date: "2027-03-23" },
  { label: "CT1 return and balance, year ended 28 Feb 2026", date: "2026-11-23" },
  { label: "Old deadline", date: "2026-10-31" },
];

describe("parseNamedDeadline", () => {
  it("counts down to the next Friday", () => {
    const d = parseNamedDeadline("Can AI do my VAT return for Byrne Foods by Friday?", TODAY);
    expect(d).toMatchObject({ dueDate: "2026-11-13", daysLeft: 6, source: "user" });
  });

  it("reads a day and month", () => {
    expect(parseNamedDeadline("What should I hand to AI before 18 November?", TODAY)?.dueDate).toBe("2026-11-18");
    expect(parseNamedDeadline("due November 18th", TODAY)?.dueDate).toBe("2026-11-18");
  });

  it("rolls a past date without a year into next year", () => {
    expect(parseNamedDeadline("before 3 March", TODAY)?.dueDate).toBe("2027-03-03");
  });

  it("reads 'on the 22nd' as this month or next", () => {
    expect(parseNamedDeadline("finish it on the 22nd", TODAY)?.dueDate).toBe("2026-11-22");
    expect(parseNamedDeadline("by the 2nd", TODAY)?.dueDate).toBe("2026-12-02");
  });

  it("ignores ordinals and weekdays that are not dates", () => {
    expect(parseNamedDeadline("Review my 1st draft of the letter", TODAY)).toBeNull();
    expect(parseNamedDeadline("the 2nd review of the CT1", TODAY)).toBeNull();
    expect(parseNamedDeadline("Monday morning meeting notes", TODAY)).toBeNull();
    expect(parseNamedDeadline("by the 3rd", TODAY)?.dueDate).toBe("2026-12-03");
    expect(parseNamedDeadline("Can you finish it on the 22nd?", TODAY)?.dueDate).toBe("2026-11-22");
  });

  it("treats a weekday equal to today as today", () => {
    expect(parseNamedDeadline("by Saturday", TODAY)).toMatchObject({ dueDate: TODAY, daysLeft: 0 });
  });

  it("reads a weekday typed with one slip after a date word", () => {
    expect(parseNamedDeadline("can ai do my vat retrun for byrne foods by firday", TODAY)).toMatchObject({
      label: "Your deadline, Friday",
      dueDate: "2026-11-13",
      daysLeft: 6,
    });
    expect(parseNamedDeadline("on wedensday please", TODAY)?.dueDate).toBe("2026-11-11");
    expect(parseNamedDeadline("before thursdy", TODAY)?.dueDate).toBe("2026-11-12");
    // Not a weekday, or no date word in front of it.
    expect(parseNamedDeadline("sort it by fridge", TODAY)).toBeNull();
    expect(parseNamedDeadline("firday notes", TODAY)).toBeNull();
  });

  it("counts a swap of neighbouring letters as one edit", () => {
    expect(editDistance("firday", "friday")).toBe(1);
    expect(editDistance("friday", "friday")).toBe(0);
    expect(editDistance("fridge", "friday")).toBe(2);
  });

  it("returns null when no date is named", () => {
    expect(parseNamedDeadline("help", TODAY)).toBeNull();
    expect(parseNamedDeadline("What's the weather in Cork?", TODAY)).toBeNull();
  });
});

describe("pickDeadline", () => {
  it("prefers the user's date", () => {
    const user = parseNamedDeadline("by Friday", TODAY);
    expect(pickDeadline(user, catalogue, "VAT return", TODAY)?.dueDate).toBe("2026-11-13");
  });

  it("picks a VAT deadline for VAT text, never ROS pay and file", () => {
    const d = pickDeadline(null, catalogue, "Can AI do my VAT return for Byrne Foods?", TODAY);
    expect(d?.label).toMatch(/VAT/);
    expect(d?.label).not.toBe("ROS pay and file (extended)");
    expect(d?.source).toBe("catalogue");
  });

  it("returns null when the named task has no deadline", () => {
    expect(pickDeadline(null, catalogue, "my payroll run", TODAY)).toBeNull();
  });

  it("picks the soonest upcoming deadline when no task is named", () => {
    expect(pickDeadline(null, catalogue, "help", TODAY)?.label).toBe("ROS pay and file (extended)");
  });

  it("works for any number of catalogue deadlines, including none", () => {
    expect(pickDeadline(null, [], "VAT", TODAY)).toBeNull();
    const many = Array.from({ length: 50 }, (_, i) => ({ label: `VAT period ${i}`, date: `2027-0${(i % 9) + 1}-15` }));
    expect(pickDeadline(null, many, "VAT", TODAY)?.dueDate).toBe("2027-01-15");
  });

  it("names the task topic", () => {
    expect(taskTopic("my VAT return")).toBe("vat");
    expect(taskTopic("help")).toBeNull();
  });
});
