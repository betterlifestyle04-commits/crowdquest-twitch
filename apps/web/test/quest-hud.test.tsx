import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, advance, begin, chooseRole, initialState, join, votePath } from "@crowdquest/shared";
import { QuestHud } from "../src/QuestHud";

const html = (state: ReturnType<typeof initialState>) => renderToStaticMarkup(createElement(QuestHud, { state }));

describe("CrowdQuest game HUD", () => {
  it("introduces the quest without claiming nonexistent players", () => {
    const view = html(initialState(42));
    expect(view).toContain("Answer the call");
    expect(view).toContain("!join");
    expect(view).toContain("0 ADVENTURERS");
    expect(view).toContain("NOT RECRUITED");
    expect(view).not.toContain("LOCKED");
  });
  it("renders real class selection and respects missing roles", () => {
    let state = join(initialState(42), "real-1", "First adventurer");
    state = begin(state);
    state = chooseRole(state, "real-1", "guardian");
    const view = html(state);
    expect(view).toContain("Assemble your heroes");
    expect(view).toContain("GUARDIAN");
    expect(view).toContain("1 IN PARTY");
    expect(view).toContain("NOT RECRUITED");
    expect(view).toContain("ROLES CHOSEN");
  });
  it("renders real route votes and locked combat actions without guessing", () => {
    let state = join(initialState(42), "viewer", "Viewer");
    state = chooseRole(begin(state), "viewer", "warrior");
    state = advance(advance(state));
    state = votePath(state, "viewer", "B");
    expect(html(state)).toContain("ROUTE VOTES");
    state = advance(state);
    expect(html(state)).toContain("AWAITING ACTION");
    expect(html(state)).not.toContain("1 LOCKED");
    state = act(state, "viewer", "attack");
    const view = html(state);
    expect(view).toContain("1 LOCKED");
    expect(view).toContain("ABILITIES COMMITTED");
    expect(view).not.toContain("Defy the Ember Lord");
  });
  it("announces the calculated outcome rather than a fixed victory", () => {
    let state = initialState(1);
    state = { ...state, phase: "result", result: "defeat", progress: 100 };
    const view = html(state);
    expect(view).toContain("Legends are forged");
    expect(view).toContain("100% COMPLETE");
    expect(view).toContain("QUEST COMPLETE");
  });
});
