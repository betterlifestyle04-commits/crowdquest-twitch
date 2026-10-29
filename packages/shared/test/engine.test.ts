import { describe, expect, it } from "vitest";
import { act, advance, applyChatCommand, begin, chooseRole, initialState, join, parseChatCommand, triggerEvent, votePath } from "../src/index.js";
const prepare = (count = 1) => { let state = initialState(7); for (let i = 0; i < count; i++) state = join(state, `${i}`, `Player${i}`); state = begin(state); const roles = ["warrior", "guardian", "healer", "scout"] as const; for (let i = 0; i < count; i++) state = chooseRole(state, `${i}`, roles[i % roles.length]); state = advance(state); state = advance(state); return state; };
describe("chat parser", () => { it("accepts only complete known commands", () => { expect(parseChatCommand("!role scout")).toEqual({ kind: "role", role: "scout" }); expect(parseChatCommand("!act scout")).toEqual({ kind: "act", action: "scout" }); expect(parseChatCommand("!role mage")).toBeNull(); expect(parseChatCommand("hello !join")).toBeNull(); }); });
describe("Ember Gate", () => {
  it("creates reproducible difficulty and duration settings", () => { expect(initialState(99, { difficulty: "relaxed", phaseDurationSeconds: 20 })).toMatchObject({ seed: 99, difficulty: "relaxed", phaseDurationSeconds: 20, supplies: 6, threat: 7 }); expect(initialState(99, { difficulty: "heroic" })).toMatchObject({ supplies: 3, threat: 14 }); });
  it("applies streamer events only during an active quest", () => { const lobby = initialState(); expect(triggerEvent(lobby, "rally")).toBe(lobby); let state = begin(initialState()); state = { ...state, health: 70 }; state = triggerEvent(state, "rally"); expect(state).toMatchObject({ health: 78, supplies: 5, activeEvent: "rally" }); state = triggerEvent(state, "emberstorm"); expect(state).toMatchObject({ threat: 14, activeEvent: "emberstorm" }); });
  it("varies encounters by seed while staying reproducible", () => { const encounterFor = (seed: number) => { let state = join(initialState(seed), "solo", "Solo"); state = begin(state); state = advance(state); state = advance(state); return advance(state).encounter; }; expect(encounterFor(7)).toBe(encounterFor(7)); expect(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(encounterFor)).size).toBeGreaterThan(1); });
  it("moves through deterministic multi-stage progression", () => { let state = prepare(2); expect(state.phase).toBe("path"); state = votePath(state, "0", "B"); state = votePath(state, "1", "B"); state = advance(state); expect(state).toMatchObject({ phase: "encounter", chosenPath: "B", environment: "Moonlit Pass" }); state = act(state, "0", "attack"); state = act(state, "1", "shield"); state = advance(state); expect(state.phase).toBe("consequence"); state = advance(state); expect(state).toMatchObject({ phase: "finale", encounter: "ember gate" }); });
  it("enforces roles and one replaceable action per player", () => { let state = prepare(4); state = advance(state); state = act(state, "0", "shield"); expect(state.actions).toEqual({}); state = act(state, "0", "attack"); state = act(state, "0", "attack"); state = act(state, "1", "shield"); state = act(state, "2", "heal"); state = act(state, "3", "scout"); expect(Object.keys(state.actions)).toHaveLength(4); });
  it("turns a Scout and Warrior action into a recorded weakness synergy", () => { let state = prepare(4); state = advance(state); state = act(state, "0", "attack"); state = act(state, "3", "scout"); state = advance(state); expect(state.history[0].text).toContain("Scout insight amplified"); expect(state.highlights[0]).toContain("revealed a weakness"); expect(state.players["3"].heroMoment).toBe("Revealed the enemy weakness"); });
  it("scales encounters from solo through large groups", () => { for (const count of [1, 5, 20, 100]) { let state = prepare(count); state = advance(state); for (let i = 0; i < count; i++) state = act(state, `${i}`, ["attack", "shield", "heal", "scout"][i % 4] as "attack" | "shield" | "heal" | "scout"); state = advance(state); expect(state.health).toBeGreaterThanOrEqual(0); expect(state.progress).toBe(55); } });
  it("can resolve a complete victory with coordinated roles", () => { let state = prepare(4); state = advance(state); for (const [id, action] of [["0", "attack"], ["1", "shield"], ["2", "heal"], ["3", "scout"]] as const) state = act(state, id, action); state = advance(state); state = advance(state); for (const [id, action] of [["0", "attack"], ["1", "shield"], ["2", "heal"], ["3", "scout"]] as const) state = act(state, id, action); state = advance(state); expect(state.result).toBe("victory"); expect(state.progress).toBe(100); });
});

describe("command feedback and real battle results", () => {
  it("accepts the correct commands, rejects incorrect timing and repeated actions", () => {
    let state = initialState(13);
    let outcome = applyChatCommand(state, "solo", "Solo", "!role warrior");
    expect(outcome).toMatchObject({ accepted: false });
    expect(outcome.feedback).toContain("Join with !join");
    outcome = applyChatCommand(state, "solo", "Solo", "!join");
    expect(outcome.accepted).toBe(true);
    state = outcome.state;
    expect(applyChatCommand(state, "solo", "Solo", "!join")).toMatchObject({ accepted: false });
    expect(applyChatCommand(state, "solo", "Solo", "!path A").feedback).toContain("not active");
    state = begin(state);
    outcome = applyChatCommand(state, "solo", "Solo", "!role warrior");
    expect(outcome).toMatchObject({ accepted: true, feedback: "Role selected: warrior." });
    state = outcome.state;
    expect(applyChatCommand(state, "solo", "Solo", "!role warrior").accepted).toBe(false);
    state = advance(advance(state));
    state = advance(state);
    expect(applyChatCommand(state, "solo", "Solo", "!act heal").feedback).toContain("can only use");
    outcome = applyChatCommand(state, "solo", "Solo", "!act attack");
    expect(outcome.accepted).toBe(true);
    expect(applyChatCommand(outcome.state, "solo", "Solo", "!act attack").accepted).toBe(false);
  });
  it("records actual round results instead of showing guessed damage", () => {
    let state = prepare(4);
    state = advance(state);
    state = act(state, "0", "attack");
    state = act(state, "1", "shield");
    state = act(state, "2", "heal");
    state = act(state, "3", "scout");
    state = advance(state);
    expect(state.lastResolution).toMatchObject({
      phase: "encounter", participants: 4, attackPower: expect.any(Number),
      shieldAbsorbed: expect.any(Number), healingRestored: expect.any(Number),
      damageTaken: expect.any(Number), scoutBoost: expect.any(Number)
    });
    expect(state.lastResolution?.attackPower).toBeGreaterThan(0);
    expect(state.lastResolution?.scoutBoost).toBeGreaterThan(0);
    expect(state.lastResolution?.threatAfter).toBe(state.threat);
  });
  it("shows 100% journey completion on defeat as well as victory", () => {
    let state = prepare(1);
    state = advance(state);
    state = advance(state);
    state = advance(state);
    state = { ...state, health: 1, threat: 300, actions: {} };
    state = advance(state);
    expect(state.phase).toBe("result");
    expect(state.result).toBe("defeat");
    expect(state.progress).toBe(100);
    expect(state.lastResolution?.phase).toBe("finale");
  });
  it("clears resolved combat when starting a new seeded session", () => {
    const old = initialState(42);
    expect(old.lastResolution).toBeNull();
    const next = initialState(old.seed + 1);
    expect(next.seed).toBe(43);
    expect(next.lastResolution).toBeNull();
  });
});

describe("solo spirit companion", () => {
  it("makes every role capable of winning the safer route when participating", () => {
    const roles = ["warrior", "guardian", "healer", "scout"] as const;
    const actions = ["attack", "shield", "heal", "scout"] as const;
    for (let i = 0; i < roles.length; i++) {
      let state = initialState(7);
      state = join(state, "solo", "Solo");
      state = begin(state);
      state = chooseRole(state, "solo", roles[i]);
      state = advance(advance(state));
      state = votePath(state, "solo", "B");
      state = advance(state);
      state = act(state, "solo", actions[i]);
      state = advance(state);
      expect(state.lastResolution?.companionPower).toBe(7);
      state = advance(state);
      state = act(state, "solo", actions[i]);
      state = advance(state);
      expect(state.result, "role: " + roles[i]).toBe("victory");
      expect(state.progress).toBe(100);
    }
  });
  it("does not give a solo companion bonus to inactive players", () => {
    let state = prepare(1);
    state = advance(state);
    state = advance(state);
    expect(state.lastResolution?.companionPower).toBe(0);
    expect(state.lastResolution?.participants).toBe(0);
  });
});
