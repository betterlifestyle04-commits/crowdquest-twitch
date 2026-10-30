import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, advance, begin, chooseRole, initialState, join } from "@crowdquest/shared";
import { getVisibleGameplayReceipt, LiveGameplayMoment, type GameplayReceipt } from "../src/LiveGameplayMoment";
import { QueuedSpellEffects } from "../src/QueuedSpellEffects";

const receipt = (overrides: Partial<GameplayReceipt> = {}): GameplayReceipt => ({
  id: "1", at: 10000, name: "A real viewer", source: "twitch",
  command: "!act attack", accepted: true, ...overrides
});
const options = { now: 11000, phase: "encounter", transport: "live" as const };

describe("server-confirmed cinematic player moments", () => {
  it("shows only accepted, current-phase commands, never rejected or stale actions", () => {
    expect(getVisibleGameplayReceipt([receipt()], options)?.label.title).toBe("Sword readied");
    expect(getVisibleGameplayReceipt([receipt({ accepted: false })], options)).toBeNull();
    expect(getVisibleGameplayReceipt([receipt({ at: 1000 })], options)).toBeNull();
    expect(getVisibleGameplayReceipt([receipt({ at: 15000 })], options)).toBeNull();
    expect(getVisibleGameplayReceipt([receipt({ command: "!act attack" })], { ...options, phase: "roles" })).toBeNull();
    expect(getVisibleGameplayReceipt([receipt()], { ...options, transport: "offline" })).toBeNull();
    expect(getVisibleGameplayReceipt([receipt()], { ...options, phase: "result" })).toBeNull();
  });
  it("respects valid roles, route choices and action syntax", () => {
    expect(getVisibleGameplayReceipt([receipt({ command: "!role healer" })], { ...options, phase: "roles" })?.label.className).toBe("role");
    expect(getVisibleGameplayReceipt([receipt({ command: "!path b" })], { ...options, phase: "path" })?.label.className).toBe("path");
    expect(getVisibleGameplayReceipt([receipt({ command: "!join" })], { ...options, phase: "lobby" })?.label.className).toBe("join");
    expect(getVisibleGameplayReceipt([receipt({ command: "!act delete" })], options)).toBeNull();
  });
  it("labels simulated participation and genuine Twitch separately", () => {
    const demo = renderToStaticMarkup(createElement(LiveGameplayMoment, {
      receipts: [receipt({ at: Date.now(), source: "demo", name: "Demo Hero" })], phase: "encounter", transport: "live", simulated: true
    }));
    expect(demo).toContain("SIMULATED DEMO");
    expect(demo).toContain("Demo Hero");
    const twitch = renderToStaticMarkup(createElement(LiveGameplayMoment, {
      receipts: [receipt({ at: Date.now(), source: "twitch" })], phase: "encounter", transport: "live", simulated: false
    }));
    expect(twitch).toContain("TWITCH CHAT");
    expect(twitch).not.toContain("SIMULATED DEMO");
  });
});

describe("readied ability artwork", () => {
  it("does not show spells for an empty lobby", () => {
    const output = renderToStaticMarkup(createElement(QueuedSpellEffects, { state: initialState(7) }));
    expect(output).toBe("");
  });
  it("only shows effects after role-appropriate actions are accepted", () => {
    let state = join(initialState(8), "u", "Warrior");
    state = chooseRole(begin(state), "u", "warrior");
    state = advance(advance(advance(state))); // briefing, path, encounter
    const before = renderToStaticMarkup(createElement(QueuedSpellEffects, { state }));
    expect(before).toBe("");
    state = act(state, "u", "attack");
    const after = renderToStaticMarkup(createElement(QueuedSpellEffects, { state }));
    expect(after).toContain("queued-spell-warrior");
    expect(after).not.toContain("queued-spell-healer");
    state = advance(state); // consequence
    expect(renderToStaticMarkup(createElement(QueuedSpellEffects, { state }))).toBe("");
  });
});
