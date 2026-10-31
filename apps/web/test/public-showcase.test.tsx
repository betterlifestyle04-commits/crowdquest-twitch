import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicShowcase, createPublicPreviewState } from "../src/PublicShowcase";
import type { QuestState } from "@crowdquest/shared";

const render = (state:QuestState) => createElement("span",{"data-phase":state.phase,"data-result":String(state.result)},state.phase);

describe("public interactive game gallery", () => {
  it("offers six genuine engine-based phases with explicitly fictional names", () => {
    const checks = [
      ["camp", "lobby"],
      ["muster", "roles"],
      ["crossroads", "path"],
      ["trial", "encounter"],
      ["boss", "finale"],
      ["ending", "result"]
    ] as const;
    for (const [preview, phase] of checks) {
      const state = createPublicPreviewState(preview);
      expect(state.phase).toBe(phase);
      expect(state.phaseEndsAt).toBeNull();
      expect(Object.values(state.players).every(p=>p.name.endsWith("[Demo]"))).toBe(true);
    }
  });
  it("never invents a Twitch connection or sends requests during static render", () => {
    const markup = renderToStaticMarkup(createElement(PublicShowcase,{renderGame:render}));
    expect(markup).toContain("SIMULATED PREVIEW");
    expect(markup).toContain("No real Twitch commands");
    expect(markup).toContain("View source");
    expect(markup).toContain("The First Trial");
    expect(markup).toContain('data-phase="encounter"');
  });
  it("uses actual recorded route ballots and only simulated battle outcomes", () => {
    const crossroads = createPublicPreviewState("crossroads");
    expect(Object.values(crossroads.pathVotes)).toEqual(["B","B","A"]);
    expect(createPublicPreviewState("boss").lastResolution?.phase).toBe("encounter");
    const ending = createPublicPreviewState("ending");
    expect(["victory", "defeat"]).toContain(ending.result);
    expect(ending.lastResolution?.phase).toBe("finale");
  });
});
