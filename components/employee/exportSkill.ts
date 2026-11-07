// Builds a catalogue item as a Claude Skill file (SKILL.md style: YAML front matter, then instructions)
// and downloads it in the browser.

export interface ExportableSkill {
  title: string;
  plainSummary: string;
  body: string;
  verifyStep?: string | null;
}

/** "Bank reconciliation, monthly" -> "bank-reconciliation-monthly". Claude skill names use lowercase and hyphens. */
export function skillName(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "skill"
  );
}

/** Quotes a YAML value safely on one line. */
const yaml = (s: string) => JSON.stringify(s.replace(/\s+/g, " ").trim());

export function skillMarkdown(item: ExportableSkill): string {
  const verify = item.verifyStep ? `\n\n## Check before you rely on it\n\n${item.verifyStep}\n` : "\n";
  return [
    "---",
    `name: ${skillName(item.title)}`,
    `description: ${yaml(item.plainSummary)}`,
    "---",
    "",
    `# ${item.title}`,
    "",
    item.body.trim(),
  ].join("\n") + verify;
}

/** Downloads the skill as <skill-name>.md. Returns the file name. */
export function downloadSkill(item: ExportableSkill): string {
  const file = `${skillName(item.title)}.md`;
  const url = URL.createObjectURL(new Blob([skillMarkdown(item)], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return file;
}

/** Where to put the file. Checked against support.claude.com "Use skills in Claude", 07-11-2026: uploads take a ZIP of a folder holding SKILL.md. */
export const UPLOAD_HINT =
  "To add it in Claude: rename it SKILL.md, put it in a folder, zip the folder, then open Customize, Skills, +, Create skill, Upload a skill.";
