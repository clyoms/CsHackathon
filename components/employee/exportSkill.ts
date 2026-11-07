// Builds a catalogue item as a Claude Skill (SKILL.md: YAML front matter, then instructions)
// and downloads it as a ZIP that Claude accepts as it is: <skill-name>/SKILL.md inside.

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

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A ZIP with uncompressed ("stored") files. Small skill files need no compression, so no library. */
export function zipFiles(files: { path: string; text: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const local: number[] = [];
  const central: number[] = [];
  const u16 = (a: number[], v: number) => a.push(v & 0xff, (v >>> 8) & 0xff);
  const u32 = (a: number[], v: number) => a.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  for (const f of files) {
    const name = enc.encode(f.path);
    const data = enc.encode(f.text);
    const crc = crc32(data);
    const offset = local.length;
    // Version 20, flag 0x0800 (UTF-8 names), method 0 (stored), time and date 0 (1980).
    const head = (a: number[]) => {
      u16(a, 20); u16(a, 0x0800); u16(a, 0); u16(a, 0); u16(a, 0x21);
      u32(a, crc); u32(a, data.length); u32(a, data.length); u16(a, name.length); u16(a, 0);
    };
    u32(local, 0x04034b50); head(local); local.push(...name, ...data);
    u32(central, 0x02014b50); u16(central, 20); head(central);
    u16(central, 0); u16(central, 0); u16(central, 0); u32(central, 0); u32(central, offset); central.push(...name);
  }
  const end: number[] = [];
  u32(end, 0x06054b50); u16(end, 0); u16(end, 0); u16(end, files.length); u16(end, files.length);
  u32(end, central.length); u32(end, local.length); u16(end, 0);
  return new Uint8Array([...local, ...central, ...end]);
}

/** Downloads the skill as <skill-name>.zip holding <skill-name>/SKILL.md. Returns the file name. */
export function downloadSkill(item: ExportableSkill): string {
  const name = skillName(item.title);
  const file = `${name}.zip`;
  const zip = zipFiles([{ path: `${name}/SKILL.md`, text: skillMarkdown(item) }]);
  const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: "application/zip" }));
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
export const UPLOAD_HINT = "It is ready to upload as it is. In Claude, open Customize, Skills, +, Create skill, Upload a skill, and pick this file.";

/** Copies text to the clipboard. Falls back to a hidden text box and the copy command when the clipboard API is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Some browsers block the clipboard API.
  }
  const box = document.createElement("textarea");
  box.value = text;
  box.setAttribute("readonly", "");
  box.style.position = "fixed";
  box.style.opacity = "0";
  document.body.appendChild(box);
  box.select();
  const ok = document.execCommand("copy");
  box.remove();
  return ok;
}
