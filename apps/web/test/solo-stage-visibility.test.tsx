import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { initialState } from "@crowdquest/shared";
import { CinematicScene } from "../src/CinematicScene";
import { PartyNameplates } from "../src/PartyNameplates";
import { soloNext } from "../src/PublicSoloDemo";

describe("public solo stage must remain visible throughout gameplay", () => {
  const warrior = () => {
    let state = initialState(20261102);
    state = soloNext(state, {type:"join",name:"QA Hero"});
    state = soloNext(state, {type:"start"});
    state = soloNext(state, {type:"role",role:"warrior"});
    return state;
  };
  it("renders one prominent chosen warrior instead of four faint placeholders", () => {
    const state = warrior();
    const html = renderToStaticMarkup(createElement(CinematicScene,{state,scene:"camp",simulated:true}));
    expect(html).toContain("solo-party-art");
    expect(html).toContain("translate(360 348) scale(2.05)");
    expect(html).toContain("cinema-adventurer warrior");
    expect(html).not.toContain("cinema-adventurer guardian");
    expect(html).toContain("YOUR HERO");
    expect(renderToStaticMarkup(createElement(PartyNameplates,{state,simulated:true,soloRole:"warrior"}))).toContain("translate(360 122)");
  });
  it("keeps the warrior and encounter art when the solo quest advances", () => {
    let state = warrior();
    state = soloNext(state,{type:"continue"});
    state = soloNext(state,{type:"continue"});
    state = soloNext(state,{type:"route",path:"A"});
    state = soloNext(state,{type:"continue"});
    expect(state.phase).toBe("encounter");
    let html = renderToStaticMarkup(createElement(CinematicScene,{state,scene:"bridge",simulated:true}));
    expect(html).toContain("solo-party-art");
    expect(html).toContain("foe-bridge-hazard");
    state = soloNext(state,{type:"ability"});
    html = renderToStaticMarkup(createElement(CinematicScene,{state,scene:"bridge",simulated:true}));
    expect(html).toContain("casting joined");
    state = soloNext(state,{type:"continue"});
    expect(state.phase).toBe("consequence");
    html = renderToStaticMarkup(createElement(CinematicScene,{state,scene:"aftermath",simulated:true}));
    expect(html).toContain("solo-party-art");
  });
  it("never uses the zero-minimum-height OBS overlay layout on public pages", () => {
    const main = readFileSync(new URL("../src/main.tsx",import.meta.url),"utf8");
    const css = readFileSync(new URL("../src/public-solo.css",import.meta.url),"utf8");
    const showcase = readFileSync(new URL("../src/public-showcase.css",import.meta.url),"utf8");
    expect(main.match(/overlay standalone \/>/g)).toHaveLength(2);
    expect(main).toContain('standalone ? "stage-standalone"');
    expect(main).toContain('height:"clamp(460px, 43vw, 690px)"');
    expect(css).toContain(".game-stage.cinematic-stage.stage-standalone");
    expect(showcase).toContain(".game-stage.cinematic-stage.stage-standalone");
    expect(css).toContain("height:clamp(525px,43vw,690px)");
  });
});

describe("public rendering failure recovery",()=>{
  it("wraps both public stages with an explicit error boundary",()=>{
    const solo=readFileSync(new URL("../src/PublicSoloDemo.tsx",import.meta.url),"utf8");
    const showcase=readFileSync(new URL("../src/PublicShowcase.tsx",import.meta.url),"utf8");
    const boundary=readFileSync(new URL("../src/GameSceneBoundary.tsx",import.meta.url),"utf8");
    expect(solo).toContain('<GameSceneBoundary key={state.phase}>');
    expect(showcase).toContain('<GameSceneBoundary key={selected}>');
    expect(boundary).toContain('role="alert"');
    expect(boundary).toContain('Retry scene');
  });
});
