import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, advance, begin, chooseRole, initialState, join } from "@crowdquest/shared";
import { PartyNameplates } from "../src/PartyNameplates";

const render = (state: ReturnType<typeof initialState>, simulated = false) =>
  renderToStaticMarkup(createElement(PartyNameplates, { state, simulated }));

describe("in-world player identity", () => {
  it("never invents a player when the lobby is empty", () => {
    expect(render(initialState())).not.toContain("party-nameplate nameplate-");
  });
  it("shows the true name and chosen role with no fabricated other classes", () => {
    let state = join(initialState(), "p1", "ActualViewer");
    state = chooseRole(begin(state), "p1", "scout");
    const html = render(state);
    expect(html).toContain("ActualViewer");
    expect(html).toContain("SCOUT");
    expect(html).toContain("nameplate-scout");
    expect(html).not.toContain("nameplate-warrior");
    expect(html).not.toContain("DEMO ·");
  });
  it("labels rehearsal and demo identities instead of masquerading as Twitch viewers", () => {
    let state = chooseRole(begin(join(initialState(), "p1", "Storykeeper [Demo]")), "p1", "healer");
    expect(render(state, false)).toContain("DEMO · HEALER");
    expect(render(state, true)).toContain("DEMO · HEALER");
  });
  it("reflects multiple members in a role and accepted action readiness", () => {
    let state = join(join(initialState(), "p1", "ViewerOne"), "p2", "ViewerTwo");
    state = chooseRole(chooseRole(begin(state), "p1", "guardian"), "p2", "guardian");
    state = advance(advance(advance(state))); // encounter
    const before = render(state);
    expect(before).toContain("+1");
    expect(before).not.toContain("ability-ready");
    state = act(state, "p1", "shield");
    const after = render(state);
    expect(after).toContain("ability-ready");
    expect(after).toContain("ViewerOne");
  });
});
