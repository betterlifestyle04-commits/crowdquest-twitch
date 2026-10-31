import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState, join, type QuestState } from "@crowdquest/shared";
import { FocusedGameHUD } from "../src/FocusedGameHUD";
import { PublicShowcase } from "../src/PublicShowcase";
import { PublicSoloDemo } from "../src/PublicSoloDemo";
import { readFileSync } from "node:fs";

const render = (state:QuestState) => renderToStaticMarkup(createElement(FocusedGameHUD,{state,simulated:true}));

describe("clean game presentation",()=>{
  it("shows one compact authoritative readout without duplicate objective or Twitch command cards",()=>{
    let state=initialState(8);
    state=join(state,"p1","Demo Hero [Demo]");
    state={...state,health:73,supplies:2,threat:15};
    const html=render(state);
    expect(html).toContain("SIMULATED");
    expect(html).toContain("The Campfire");
    expect(html).toContain("73/100");
    expect(html).toContain("SUPPLIES");
    expect(html).toContain("THREAT");
    expect(html).toContain("15");
    expect(html).not.toContain("!join");
    expect(html).not.toContain("Choose Your Role");
    expect(html).not.toContain("Twitch chat");
  });
  it("stays on the actual quest phase and health values",()=>{
    const state={...initialState(8),phase:"finale" as const,health:20,maxHealth:80,threat:28};
    const html=render(state);
    expect(html).toContain("The Ember Lord");
    expect(html).toContain("20/80");
    expect(html).toContain('width:25%');
  });
  it("makes clean scene the default on both browser demo and gallery; full HUD remains optional",()=>{
    const gallery=renderToStaticMarkup(createElement(PublicShowcase,{renderGame:()=>createElement("span",null,"GAME ART")}));
    const solo=renderToStaticMarkup(createElement(PublicSoloDemo,{renderGame:()=>createElement("span",null,"GAME ART")}));
    for(const html of [gallery,solo]) {
      expect(html).toContain("Show detailed HUD");
      expect(html).toContain('aria-pressed="false"');
      expect(html).toContain("GAME ART");
    }
  });
  it("keeps the live streamer HUD unchanged and only focuses opt-in scenes",()=>{
    const source=readFileSync(new URL("../src/main.tsx",import.meta.url),"utf8");
    const css=readFileSync(new URL("../src/focused-stage.css",import.meta.url),"utf8");
    expect(source).toContain('focused = false');
    expect(source).toContain('focused ? <FocusedGameHUD state={state} simulated={state.rehearsalActive} /> : <QuestHud state={state} />');
    expect(source).toContain('(!focused || state.phase === "result") && <AdventureStory');
    expect(css).toContain(".game-stage.cinematic-stage.stage-focused .phase-banner");
    expect(css).toContain(".game-stage.cinematic-stage.stage-focused .rehearsal-watermark");
    expect(css).toContain(".game-stage.cinematic-stage.stage-focused .quest-hud");
    expect(css).toContain(".game-stage.cinematic-stage.stage-focused .route-decision-board");
  });
});
