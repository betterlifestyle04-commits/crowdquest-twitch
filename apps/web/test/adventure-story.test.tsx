import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, begin, chooseRole, initialState, join, type QuestState } from "@crowdquest/shared";
import { AdventureStory, getStoryPanel } from "../src/AdventureStory";

const html = (state: QuestState, simulated = false) =>
  renderToStaticMarkup(createElement(AdventureStory, { state, simulated }));

describe("fantasy RPG chapter presentation", () => {
  it("welcomes adventurers in an empty lobby with the correct joining command", () => {
    const state = initialState(42);
    expect(getStoryPanel(state)).toMatchObject({ kind: "camp", title: "A legend waits for its heroes" });
    const view = html(state);
    expect(view).toContain("!join");
    expect(view).toContain("0");
    expect(view).toContain("adventurers at the campfire");
    expect(view).not.toContain("HIGHEST CONTRIBUTION");
  });

  it("uses real joined player counts and role selection readiness", () => {
    let state = join(initialState(42), "p", "First adventurer");
    expect(html(state)).toContain("1");
    expect(html(state)).toContain("adventurer at the campfire");
    state = begin(state);
    const choosing = html(state);
    expect(choosing).toContain("Choose your calling");
    expect(choosing).toContain("0 of 1 adventurer");
    expect(choosing).toContain("!role guardian");
    state = chooseRole(state, "p", "guardian");
    expect(html(state)).toContain("The fellowship is ready");
    expect(html(state)).toContain("1 of 1 adventurer");
  });

  it("previews two paths only during the briefing, without falsely showing an outcome", () => {
    let state = chooseRole(begin(join(initialState(), "p", "Participant")), "p", "warrior");
    state = advance(state);
    expect(getStoryPanel(state)?.kind).toBe("briefing");
    const view = html(state);
    expect(view).toContain("Sunken Bridge");
    expect(view).toContain("Moonlit Pass");
    expect(view).not.toContain("HIGHEST CONTRIBUTION");
    state = advance(state); // voting phase
    expect(getStoryPanel(state)).toBeNull();
    expect(html(state)).toBe("");
  });

  it("renders actual after-battle resources, not guessed values", () => {
    const state = { ...initialState(), phase: "consequence" as const, health: 31, supplies: 2, threat: 18 };
    const view = html(state);
    expect(view).toContain("31");
    expect(view).toContain("2");
    expect(view).toContain("18");
    expect(view).toContain("PARTY HEALTH");
    expect(view).not.toContain("HIGHEST CONTRIBUTION");
  });

  it("shows genuine victory/defeat states and top contributor", () => {
    let state = join(initialState(), "p", "BraveViewer");
    state = { ...state, phase: "result", result: "victory", progress: 100, chosenPath: "B",
      players: { ...state.players, p: { ...state.players.p, contribution: 8 } } };
    const view = html(state);
    expect(view).toContain("THE EMBER GATE OPENS");
    expect(view).toContain("BraveViewer");
    expect(view).toContain("8");
    expect(view).toContain("Moonlit Pass");
    expect(view).not.toContain("SIMULATED SHOWCASE");
    expect(html(state, true)).toContain("SIMULATED SHOWCASE");
    state = { ...state, result: "defeat" };
    expect(html(state)).toContain("THE EMBER GATE ENDURES");
    expect(html(state)).not.toContain("THE EMBER GATE OPENS");
  });

  it("never invents winners if the session has no outcome or no players", () => {
    const unresolved = { ...initialState(), phase: "result" as const };
    expect(getStoryPanel(unresolved)).toBeNull();
    expect(html(unresolved)).toBe("");
    const empty = { ...unresolved, result: "defeat" as const };
    expect(html(empty)).toContain("No adventurers joined this expedition.");
    expect(html(empty)).not.toContain("HIGHEST CONTRIBUTION");
  });
});
