import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, advance, begin, chooseRole, initialState, join, votePath } from "@crowdquest/shared";
import { PhaseParticipation } from "../src/PhaseParticipation";

const html = (state:ReturnType<typeof initialState>) => renderToStaticMarkup(createElement(PhaseParticipation,{state}));

describe("true audience readiness in OBS",()=>{
  it("is invisible outside interactive phases",()=>{
    expect(html(initialState())).toBe("");
    const result={...initialState(),phase:"result" as const,result:"victory" as const};
    expect(html(result)).toBe("");
  });
  it("starts from zero instead of faking progress for an empty phase",()=>{
    const state={...initialState(),phase:"roles" as const};
    expect(html(state)).toContain("0");
    expect(html(state)).toContain("AWAITING ADVENTURERS");
    expect(html(state)).not.toContain("THE PARTY IS READY");
  });
  it("shows real role selection, then route vote, then committed combat actions",()=>{
    let state = join(join(initialState(),"one","One"),"two","Two");
    state=begin(state);
    let view=html(state);
    expect(view).toContain("HEROES CHOSEN");
    expect(view).toContain("0");
    expect(view).toContain(" / 2");
    state=chooseRole(state,"one","warrior");
    expect(html(state)).toContain("WAITING FOR PARTICIPANTS");
    state=chooseRole(state,"two","guardian");
    expect(html(state)).toContain("THE PARTY IS READY");
    state=advance(advance(state));
    expect(html(state)).toContain("ROUTES VOTED");
    expect(html(state)).toContain("WAITING FOR PARTICIPANTS");
    state=votePath(state,"one","A");
    state=votePath(state,"two","B");
    expect(html(state)).toContain("THE PARTY IS READY");
    state=advance(state);
    expect(html(state)).toContain("ABILITIES READY");
    state=act(state,"one","attack");
    expect(html(state)).toContain("WAITING FOR PARTICIPANTS");
    state=act(state,"two","shield");
    expect(html(state)).toContain("THE PARTY IS READY");
  });
  it("never counts an unmatched class action as completed",()=>{
    let state=chooseRole(begin(join(initialState(),"one","One")),"one","warrior");
    state=advance(advance(advance(state)));
    state=act(state,"one","heal"); // not allowed for a Warrior
    const view=html(state);
    expect(view).toContain("0");
    expect(view).toContain("WAITING FOR PARTICIPANTS");
  });
});
