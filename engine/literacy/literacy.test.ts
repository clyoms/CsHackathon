import { describe, expect, it } from "vitest";
import { recommendationFixture, staffFixture } from "@/contract/fixtures";
import { appendEntry, recordAdopted, recordShown, toCsv, type LiteracyLog } from "./index";

describe("literacy log", () => {
  it("appends shown and adopted entries without changing the old log", () => {
    const empty: LiteracyLog = [];
    const shown = recordShown(empty, recommendationFixture, "2026-11-07");
    const both = recordAdopted(shown, staffFixture.id, recommendationFixture.item.id, "2026-11-08");
    expect(empty).toHaveLength(0);
    expect(shown).toHaveLength(1);
    expect(both.map((e) => [e.measure, e.adopted])).toEqual([
      ["shown", false],
      ["adopted", true],
    ]);
  });

  it("rejects an entry that breaks the contract", () => {
    expect(() =>
      appendEntry([], { staffId: "s", date: "7 Nov", measure: "shown", itemId: "i", adopted: false }),
    ).toThrow();
  });

  it("exports one CSV row per entry with a header", () => {
    let log: LiteracyLog = [];
    log = recordShown(log, recommendationFixture, "2026-11-07");
    log = recordAdopted(log, staffFixture.id, recommendationFixture.item.id, "2026-11-08");
    log = recordShown(log, { ...recommendationFixture, staffId: 'O"Brien, P' }, "2026-11-09");
    const rows = toCsv(log).split("\n");
    expect(rows).toEqual([
      "staffId,date,measure,itemId,adopted",
      "s-aoife,2026-11-07,shown,skill-transaction-classify,false",
      "s-aoife,2026-11-08,adopted,skill-transaction-classify,true",
      '"O""Brien, P",2026-11-09,shown,skill-transaction-classify,false',
    ]);
  });

  it("exports just the header for an empty log", () => {
    expect(toCsv([])).toBe("staffId,date,measure,itemId,adopted");
  });
});
