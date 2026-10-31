import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, advance, begin, chooseRole, initialState, join, type QuestState } from "@crowdquest/shared";
import { getTacticalDisplay, TacticalStatus } from "../src/TacticalStatus";

const render = (state: QuestState) => renderToStaticMarkup(createElement(TacticalStatus,{state}));
const fight = () => {
  let s = initialState(3);
  for (const id of ["warrior", "guardian", "healer", "scout"]) s=join(s,id,id.toUpperCase());
  s=begin(s);
  for(const role of ["warrior","guardian","healer","scout"] as const) s=chooseRole(s,role,role);
  return advance(advance(advance(s)));
};

describe("RPG tactical party HUD",()=>{
  it("shows genuine health, supplies and threat, not fake enemy HP",()=>{
    const s={...initialState(),health:36,maxHealth:120,supplies:2,threat:24};
    const v=getTacticalDisplay(s);
    expect(v.healthPct).toBe(30);
    expect(v.healthLabel).toBe("36 / 120");
    expect(v.supplies).toBe(2);
    expect(v.threatLabel).toBe("24");
    expect(v.threatPct).toBe(80);
    const html=render(s);
    expect(html).toContain("36 / 120");
    expect(html).toContain("GATE THREAT");
    expect(html).toContain("SUPPLIES");
    expect(html).not.toContain("BOSS HP");
  });
  it("clamps both bars without changing actual displayed danger",()=>{
    const s={...initialState(),health:-8,maxHealth:100,threat:55};
    const v=getTacticalDisplay(s);
    expect(v.healthPct).toBe(0);
    expect(v.threatPct).toBe(100);
    expect(v.threatLabel).toBe("55");
  });
  it("only shows scout/warrior synergy when both role-correct actions are committed in combat",()=>{
    let state=fight();
    expect(getTacticalDisplay(state).combo).toBe("none");
    state=act(state,"scout","scout");
    expect(getTacticalDisplay(state).combo).toBe("none");
    state=act(state,"warrior","attack");
    expect(getTacticalDisplay(state)).toMatchObject({combo:"reveal",headline:"SCOUT + WARRIOR COMBO"});
    expect(render(state)).toContain("Scout insight will amplify the Warrior attack");
    state=act(state,"guardian","shield");
    state=act(state,"healer","heal");
    expect(getTacticalDisplay(state).combo).toBe("full");
    expect(render(state)).toContain("FULL FORMATION ARMED");
    expect(render(state)).toContain("READY");
    state=advance(state);
    expect(getTacticalDisplay(state).combo).toBe("none");
    expect(render(state)).not.toContain("FULL FORMATION ARMED");
  });
  it("does not pretend uncommitted or incompatible roles have formed a combo",()=>{
    let state=fight();
    state={...state,actions:{"warrior":"heal","scout":"scout"}}; // corrupted snapshot never yields synergy
    expect(getTacticalDisplay(state).combo).toBe("none");
    state={...state,phase:"briefing"};
    expect(getTacticalDisplay(state).combo).toBe("none");
  });
});
