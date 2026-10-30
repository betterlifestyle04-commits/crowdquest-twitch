import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, begin, chooseRole, initialState, join, votePath } from "@crowdquest/shared";
import { getRouteCounts, RouteDecisionBoard } from "../src/RouteDecisionBoard";

function crossroads() {
  let state = join(join(initialState(10), "one", "One"), "two", "Two");
  state = begin(state);
  state = chooseRole(chooseRole(state, "one", "warrior"), "two", "scout");
  return advance(advance(state));
}
const view = (state: ReturnType<typeof initialState>) =>
  renderToStaticMarkup(createElement(RouteDecisionBoard,{state}));

describe("true in-world crossroads ballot",()=>{
  it("is hidden outside the path phase and shows no invented votes",()=>{
    expect(view(initialState())).toBe("");
    const state = crossroads();
    expect(getRouteCounts(state)).toMatchObject({a:0,b:0,total:0,eligible:2,waiting:2,aPct:0,bPct:0,lead:null});
    const output=view(state);
    expect(output).toContain("AWAITING THE FIRST VOTE");
    expect(output).toContain("Ties resolve to A");
    expect(output).toContain("0 votes");
    expect(output).toContain("!path A");
    expect(output).toContain("!path B");
    expect(output).not.toContain("✦ LEADING");
    expect(output).toContain("Provisional tally");
  });
  it("updates the actual lead, percentages and participation as players vote",()=>{
    let state=crossroads();
    state=votePath(state,"one","B");
    expect(getRouteCounts(state)).toMatchObject({a:0,b:1,total:1,eligible:2,waiting:1,aPct:0,bPct:100,lead:"B"});
    expect(view(state)).toContain("CURRENT LEAD · ROUTE B");
    state=votePath(state,"two","A");
    expect(getRouteCounts(state)).toMatchObject({a:1,b:1,total:2,eligible:2,waiting:0,aPct:50,bPct:50,lead:null});
    expect(view(state)).toContain("THE VOTE IS TIED");
    expect(view(state)).toContain("All adventurers have voted");
    state=votePath(state,"one","A"); // one voter can change their vote
    expect(getRouteCounts(state)).toMatchObject({a:2,b:0,total:2,eligible:2,waiting:0,aPct:100,bPct:0,lead:"A"});
    expect(view(state)).toContain("CURRENT LEAD · ROUTE A");
  });
  it("mirrors the game engine's route choice and tie/default semantics",()=>{
    let state=crossroads();
    expect(advance(state).chosenPath).toBe("A"); // no votes: A by rule
    state=votePath(votePath(state,"one","A"),"two","B");
    expect(getRouteCounts(state).lead).toBeNull();
    expect(advance(state).chosenPath).toBe("A"); // tie: A
    state=votePath(state,"one","B");
    expect(getRouteCounts(state).lead).toBe("B");
    expect(advance(state).chosenPath).toBe("B");
  });
  it("reports correct route consequences and hides after voting closes",()=>{
    let state=crossroads();
    const html=view(state);
    expect(html).toContain("+2 supplies");
    expect(html).toContain("+4 route threat");
    expect(html).toContain("−2 route threat");
    state=advance(state);
    expect(view(state)).toBe("");
  });
  it("handles an empty joined party without fake participation",()=>{
    const state={...initialState(),phase:"path" as const};
    const html=view(state);
    expect(html).toContain("No adventurers joined");
    expect(html).toContain("AWAITING THE FIRST VOTE");
  });
});
