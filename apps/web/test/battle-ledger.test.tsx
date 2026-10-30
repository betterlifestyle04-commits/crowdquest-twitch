import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState, type BattleResolution, type QuestState } from "@crowdquest/shared";
import { AdventureStory } from "../src/AdventureStory";
import { BattleLedger, getBattleLedgerData, QuestChronicle } from "../src/BattleLedger";

const battle: BattleResolution = {
  phase:"encounter",encounter:"moonshade stalker",at:12345,
  attackPower:24,companionPower:7,shieldAbsorbed:5,scoutBoost:4,
  healingRestored:10,damageTaken:3,threatAfter:6,participants:4
};
const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("server-grounded battle ledger",()=>{
  it("reports actual resolved attack, blocks, healing, loss and support, without inventing enemy HP",()=>{
    const data = getBattleLedgerData(battle);
    expect(data).toMatchObject({attack:24,blocked:5,restored:10,damage:3,players:4});
    expect(data.synergy).toContain("Scout assisted +4");
    expect(data.synergy).toContain("Spirit assisted +7");
    const content=html(createElement(BattleLedger,{resolution:battle}));
    for(const item of ["TRIAL BATTLE REPORT","24","5","10","3","4 ACTIONS","Scout assisted +4"]) expect(content).toContain(item);
    expect(content).not.toContain("ENEMY HP");
  });
  it("uses the final fight label only for final server resolution and describes no actions honestly",()=>{
    const last = {...battle,phase:"finale" as const, participants:0, scoutBoost:0,companionPower:0};
    const content=html(createElement(BattleLedger,{resolution:last,compact:true}));
    expect(content).toContain("FINAL BATTLE REPORT");
    expect(content).toContain("0 ACTIONS");
    expect(content).toContain("No player actions were received");
    expect(getBattleLedgerData(last).synergy).toBeNull();
  });
  it("consolidates the encounter report inside aftermath and the final report inside true result",()=>{
    const state: QuestState = {...initialState(),phase:"consequence",lastResolution:battle};
    const after=html(createElement(AdventureStory,{state}));
    expect(after).toContain("The party presses onward");
    expect(after).toContain("TRIAL BATTLE REPORT");
    expect((after.match(/<strong>TRIAL BATTLE REPORT<\\/strong>/g)||[]).length).toBe(1);
    const resultState: QuestState = {...state,phase:"result",result:"victory",lastResolution:{...battle,phase:"finale"}};
    const result=html(createElement(AdventureStory,{state:resultState}));
    expect(result).toContain("THE EMBER GATE OPENS");
    expect(result).toContain("FINAL BATTLE REPORT");
  });
  it("never presents a report if the state carries no resolved battle",()=>{
    const state={...initialState(),phase:"consequence" as const};
    expect(html(createElement(AdventureStory,{state}))).not.toContain("BATTLE REPORT");
  });
});

describe("quest chronicle timeline",()=>{
  it("renders only real logged game history, newest first and bounded",()=>{
    const history=[
      {id:"older",text:"The campfire was lit",at:100},
      {id:"newest",text:"The party found the pass",at:300},
      {id:"middle",text:"Heroes assembled",at:200}
    ];
    const content=html(createElement(QuestChronicle,{history,limit:2}));
    expect(content.indexOf("The party found the pass")).toBeLessThan(content.indexOf("Heroes assembled"));
    expect(content).not.toContain("The campfire was lit");
    expect(content).toContain("LATEST CHAPTER EVENT");
    expect(content).not.toContain("SIMULATED SHOWCASE");
    expect(html(createElement(QuestChronicle,{history,limit:2,simulated:true}))).toContain("SIMULATED SHOWCASE");
  });
  it("gracefully handles an empty quest and invalid timestamps",()=>{
    const content=html(createElement(QuestChronicle,{history:[{id:"bad",text:"Invalid time",at:Number.NaN}]}));
    expect(content).toContain("The story begins when the host starts the quest");
    expect(content).not.toContain("Invalid time");
  });
});
