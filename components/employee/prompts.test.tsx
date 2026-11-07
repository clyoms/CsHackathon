// The repo has no DOM test environment (vitest runs in "node"), so these tests render to static
// markup and call the button's own click handler from the rendered element tree.
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Staff } from "@/contract/types";
import { EmployeeFlow } from "./EmployeeFlow";
import { PromptLibrary } from "./PromptLibrary";
import { SAMPLE_PROMPTS, fillQuestionBox, type SamplePrompt } from "./prompts";

type ButtonProps = { type?: string; "aria-label"?: string; onClick?: () => void; children?: ReactNode };

/** Every <button> element in a rendered tree, in order. */
function buttons(node: ReactNode): ReactElement<ButtonProps>[] {
  if (Array.isArray(node)) return node.flatMap(buttons);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  const own = node.type === "button" ? [node as ReactElement<ButtonProps>] : [];
  return [...own, ...buttons(node.props.children)];
}

afterEach(() => vi.unstubAllGlobals());

describe("sample prompts", () => {
  it("has 6 to 8 prompts, each with a short label and full text", () => {
    expect(SAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(6);
    expect(SAMPLE_PROMPTS.length).toBeLessThanOrEqual(8);
    for (const p of SAMPLE_PROMPTS) {
      expect(p.label.trim().length).toBeGreaterThan(0);
      expect(p.label.length).toBeLessThanOrEqual(30);
      expect(p.text.length).toBeGreaterThan(p.label.length);
    }
    expect(new Set(SAMPLE_PROMPTS.map((p) => p.label)).size).toBe(SAMPLE_PROMPTS.length);
  });

  it("covers the work the plan names", () => {
    const all = SAMPLE_PROMPTS.map((p) => `${p.label} ${p.text}`).join("\n");
    for (const topic of [/VAT/, /CT1/, /bank/i, /payroll/i, /email/i]) expect(all).toMatch(topic);
    const texts = SAMPLE_PROMPTS.map((p) => p.text);
    expect(texts).toContain("What should I hand to AI before 18 November?");
    expect(texts).toContain("I don't trust AI, what's the safest thing to start with?");
  });
});

describe("Try this prompt", () => {
  it("fills the box and moves focus to it without sending", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const order: string[] = [];
    const box = { setText: vi.fn(() => order.push("text")), focus: vi.fn(() => order.push("focus")) };

    fillQuestionBox(SAMPLE_PROMPTS[0], box);

    expect(box.setText).toHaveBeenCalledWith(SAMPLE_PROMPTS[0].text);
    expect(box.focus).toHaveBeenCalledOnce();
    expect(order).toEqual(["text", "focus"]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("gives every prompt a real button that picks it and never submits the form", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const picked: SamplePrompt[] = [];
    const tree = PromptLibrary({ prompts: SAMPLE_PROMPTS, onPick: (p) => picked.push(p) });
    const found = buttons(tree);

    expect(found).toHaveLength(SAMPLE_PROMPTS.length);
    found.forEach((b, i) => {
      expect(b.props.type).toBe("button");
      expect(b.props.children).toBe("Try this prompt");
      expect(b.props["aria-label"]).toContain(SAMPLE_PROMPTS[i].label);
      b.props.onClick?.();
    });
    expect(picked).toEqual([...SAMPLE_PROMPTS]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("employee page", () => {
  const staff = { id: "s1", name: "Aoife" } as Staff;
  const html = renderToStaticMarkup(<EmployeeFlow staff={staff} choices={{}} />);

  it("shows the prompt library beside the question box", () => {
    expect(html).toContain("Not sure what to ask? Try one of these");
    expect(html.match(/>Try this prompt</g)).toHaveLength(SAMPLE_PROMPTS.length);
  });

  it("links to the 4D basics", () => {
    expect(html).toMatch(/<a href="\/literacy"[^>]*>Learn the 4D basics<\/a>/);
  });

  it("reads plainly when no price is set and keeps the token count", () => {
    expect(html).toContain("Cost: not priced yet");
    expect(html).not.toContain("cost not set yet");
    expect(html).toMatch(/0 tokens/);
  });

  it("shows no synthetic or demo data label", () => {
    expect(html).not.toMatch(/synthetic|demo data/i);
  });
});
