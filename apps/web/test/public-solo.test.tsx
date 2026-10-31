import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { initialState, type QuestState } from "@crowdquest/shared";
import { PublicSoloDemo, soloNext } from "../src/PublicSoloDemo";

const start=()=>initialState(20261102);
const play=(s:QuestState,a:Parameters<typeof soloNext>[1])=>soloNext(s,a);

describe("browser solo demo — authentic game engine",()=>{
  it("starts in the lobby and doesn't invent a Twitch join",()=>{
    const s=start();
    expect(s.phase).toBe("lobby");
    expect(play(s,{type:"start"})).toBe(s);
    expect(play(s,{type:"join",name:" "})).toBe(s);
    const view=renderToStaticMarkup(createElement(PublicSoloDemo,{renderGame:()=>createElement("div",{}, "Simulated battlefield")}));
    expect(view).toContain("Join the expedition");
    expect(view).toContain("SIMULATED");
    expect(view).toContain("Not connected to Twitch");
    expect(view).toContain("Simulated battlefield");
  });
  it("lets a human join, select a class, vote, and play through a real resolved quest",()=>{
    let s=start();
    s=play(s,{type:"join",name:"My Hero"});
    expect(s.players["public:solo"]?.name).toBe("My Hero [Demo]");
    expect(s.phaseEndsAt).toBeNull();
    s=play(s,{type:"start"});
    expect(s.phase).toBe("roles");
    expect(s.phaseEndsAt).toBeNull();
    expect(play(s,{type:"continue"}).phase).toBe("roles"); // must pick a role
    s=play(s,{type:"role",role:"warrior"});
    s=play(s,{type:"continue"});
    expect(s.phase).toBe("briefing");
    s=play(s,{type:"continue"});
    expect(s.phase).toBe("path");
    expect(play(s,{type:"continue"}).phase).toBe("path"); // must vote
    s=play(s,{type:"route",path:"B"});
    s=play(s,{type:"continue"});
    expect(s.phase).toBe("encounter");
    expect(s.chosenPath).toBe("B");
    expect(play(s,{type:"continue"}).phase).toBe("encounter");
    s=play(s,{type:"ability"});
    expect(s.actions["public:solo"]).toBe("attack");
    s=play(s,{type:"continue"});
    expect(s.phase).toBe("consequence");
    expect(s.lastResolution?.phase).toBe("encounter");
    s=play(s,{type:"continue"});
    expect(s.phase).toBe("finale");
    s=play(s,{type:"ability"});
    s=play(s,{type:"continue"});
    expect(s.phase).toBe("result");
    expect(["victory","defeat"]).toContain(s.result);
    expect(s.lastResolution?.phase).toBe("finale");
    expect(s.phaseEndsAt).toBeNull();
  });
  it("rejects phase-inappropriate decisions and accepts route changes before advancing",()=>{
    let s=play(start(),{type:"join",name:"Luna"});
    const original=play(s,{type:"route",path:"A"});
    expect(original.pathVotes).toEqual({});
    s=play(s,{type:"start"});
    s=play(s,{type:"role",role:"scout"});
    s=play(play(s,{type:"continue"}),{type:"continue"});
    expect(s.phase).toBe("path");
    s=play(s,{type:"route",path:"A"});
    expect(s.pathVotes["public:solo"]).toBe("A");
    s=play(s,{type:"route",path:"B"});
    expect(s.pathVotes["public:solo"]).toBe("B");
  });
});
