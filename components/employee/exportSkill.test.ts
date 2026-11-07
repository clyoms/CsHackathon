import { describe, expect, it } from "vitest";
import { namesClient } from "./choices";
import { zipFiles } from "./exportSkill";

describe("namesClient", () => {
  it("matches a client name with the work type Claude adds", () => {
    expect(namesClient("Murphy Engineering Ltd (CT1)", "Murphy Engineering Ltd")).toBe(true);
    expect(namesClient("Murphy Engineering Ltd", "Murphy Engineering Ltd")).toBe(true);
    expect(namesClient("Murphy Engineering Ltd2", "Murphy Engineering Ltd")).toBe(false);
    expect(namesClient("All my clients", "Murphy Engineering Ltd")).toBe(false);
  });
});

describe("zipFiles", () => {
  it("writes a ZIP with the folder and SKILL.md inside", () => {
    const zip = zipFiles([{ path: "my-skill/SKILL.md", text: "---\nname: my-skill\n---\n" }]);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50);
    expect(new TextDecoder().decode(zip)).toContain("my-skill/SKILL.md");
  });
});
