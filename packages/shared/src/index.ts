export type Phase = "lobby" | "path" | "action" | "result";
export type Path = "A" | "B";
export type Action = "attack" | "shield" | "heal";
export type ChatCommand = { kind: "join" } | { kind: "path"; path: Path } | { kind: "act"; action: Action };
export type Player = { id: string; name: string; joinedAt: number; contribution: number };
export type HistoryItem = { id: string; text: string; at: number };
export type QuestState = {
  phase: Phase; questTitle: string; phaseEndsAt: number | null; players: Record<string, Player>;
  pathVotes: Record<string, Path>; actions: Record<string, Action>; health: number; maxHealth: number;
  supplies: number; threat: number; chosenPath: Path | null; result: "victory" | "defeat" | null;
  history: HistoryItem[];
};

const now = () => Date.now();
const log = (state: QuestState, text: string) => ({ ...state, history: [{ id: `${now()}-${Math.random()}`, text, at: now() }, ...state.history].slice(0, 12) });
export function parseChatCommand(message: string): ChatCommand | null {
  const parts = message.trim().toLowerCase().split(/\s+/);
  if (parts[0] === "!join" && parts.length === 1) return { kind: "join" };
  if (parts[0] === "!path" && (parts[1] === "a" || parts[1] === "b") && parts.length === 2) return { kind: "path", path: parts[1].toUpperCase() as Path };
  if (parts[0] === "!act" && ["attack", "shield", "heal"].includes(parts[1]) && parts.length === 2) return { kind: "act", action: parts[1] as Action };
  return null;
}
export function initialState(): QuestState { return { phase: "lobby", questTitle: "The Ember Gate", phaseEndsAt: null, players: {}, pathVotes: {}, actions: {}, health: 100, maxHealth: 100, supplies: 4, threat: 16, chosenPath: null, result: null, history: [] }; }
export function join(state: QuestState, id: string, name: string): QuestState {
  if (state.players[id]) return state;
  return log({ ...state, players: { ...state.players, [id]: { id, name: name.slice(0, 25), joinedAt: now(), contribution: 0 } } }, `${name} joined the expedition`);
}
export function begin(state: QuestState, durationMs = 30000): QuestState {
  if (state.phase !== "lobby") return state;
  return log({ ...state, phase: "path", phaseEndsAt: now() + durationMs }, "Choose a route: !path A or !path B");
}
export function votePath(state: QuestState, id: string, path: Path): QuestState {
  if (state.phase !== "path" || !state.players[id]) return state;
  return { ...state, pathVotes: { ...state.pathVotes, [id]: path } };
}
export function act(state: QuestState, id: string, action: Action): QuestState {
  if (state.phase !== "action" || !state.players[id]) return state;
  return { ...state, actions: { ...state.actions, [id]: action } };
}
export function advance(state: QuestState, durationMs = 30000): QuestState {
  if (state.phase === "path") {
    const countA = Object.values(state.pathVotes).filter((v) => v === "A").length;
    const countB = Object.values(state.pathVotes).filter((v) => v === "B").length;
    const chosenPath: Path = countA >= countB ? "A" : "B";
    const threat = chosenPath === "A" ? state.threat + 4 : state.threat - 2;
    const supplies = chosenPath === "A" ? state.supplies + 1 : state.supplies;
    return log({ ...state, phase: "action", chosenPath, threat, supplies, phaseEndsAt: now() + durationMs }, `${chosenPath === "A" ? "Sunken Bridge" : "Moonlit Pass"} chosen — rally with !act`);
  }
  if (state.phase === "action") {
    const actionList = Object.values(state.actions);
    const attack = actionList.filter((a) => a === "attack").length * 3;
    const shields = actionList.filter((a) => a === "shield").length * 2;
    const requestedHeals = actionList.filter((a) => a === "heal").length;
    const heals = Math.min(requestedHeals, state.supplies);
    const effectiveThreat = Math.max(0, state.threat - attack);
    const damage = Math.max(0, effectiveThreat - shields);
    const health = Math.min(state.maxHealth, Math.max(0, state.health - damage + heals * 8));
    const victory = health > 0 && effectiveThreat <= 5;
    const players = Object.fromEntries(Object.entries(state.players).map(([id, p]) => [id, { ...p, contribution: p.contribution + (state.actions[id] ? 1 : 0) }]));
    return log({ ...state, players, phase: "result", phaseEndsAt: null, health, supplies: state.supplies - heals, threat: effectiveThreat, result: victory ? "victory" : "defeat" }, victory ? "The Ember Gate opens! The party is victorious." : "The gate overwhelms the expedition. Regroup and try again.");
  }
  return state;
}
export function reset(): QuestState { return initialState(); }
