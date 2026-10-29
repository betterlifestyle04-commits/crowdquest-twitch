export type Phase = "lobby" | "roles" | "briefing" | "path" | "encounter" | "consequence" | "finale" | "result";
export type Path = "A" | "B"; export type Role = "warrior" | "guardian" | "healer" | "scout"; export type Action = "attack" | "shield" | "heal" | "scout"; export type Difficulty = "relaxed" | "standard" | "heroic"; export type SpecialEvent = "rally" | "emberstorm";
export type ChatCommand = { kind: "join" } | { kind: "role"; role: Role } | { kind: "path"; path: Path } | { kind: "act"; action: Action };
export type Player = { id: string; name: string; joinedAt: number; role: Role | null; contribution: number; heroMoment: string | null };
export type BattleResolution = { phase: "encounter" | "finale"; at: number; attackPower: number; companionPower: number; shieldAbsorbed: number; scoutBoost: number; healingRestored: number; damageTaken: number; threatAfter: number; participants: number };
export type HistoryItem = { id: string; text: string; at: number }; export type Encounter = "collapsing bridge" | "bridge raiders" | "moonshade stalker" | "ember wraith" | "ember gate";
export type QuestState = { phase: Phase; questTitle: string; seed: number; difficulty: Difficulty; phaseDurationSeconds: number; phaseEndsAt: number | null; players: Record<string, Player>; pathVotes: Record<string, Path>; actions: Record<string, Action>; health: number; maxHealth: number; supplies: number; threat: number; progress: number; environment: string; encounter: Encounter | null; chosenPath: Path | null; activeEvent: SpecialEvent | null; lastResolution: BattleResolution | null; result: "victory" | "defeat" | null; history: HistoryItem[]; highlights: string[] };
const now = () => Date.now(); const entry = (text: string): HistoryItem => ({ id: `${now()}-${Math.random()}`, text, at: now() });
const log = (state: QuestState, text: string, highlight?: string) => ({ ...state, history: [entry(text), ...state.history].slice(0, 16), highlights: highlight ? [highlight, ...state.highlights].slice(0, 4) : state.highlights });
const roll = (seed: number, salt: number) => ((Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1;
export function parseChatCommand(message: string): ChatCommand | null { const parts = message.trim().toLowerCase().split(/\s+/); if (parts[0] === "!join" && parts.length === 1) return { kind: "join" }; if (parts[0] === "!role" && ["warrior", "guardian", "healer", "scout"].includes(parts[1]) && parts.length === 2) return { kind: "role", role: parts[1] as Role }; if (parts[0] === "!path" && (parts[1] === "a" || parts[1] === "b") && parts.length === 2) return { kind: "path", path: parts[1].toUpperCase() as Path }; if (parts[0] === "!act" && ["attack", "shield", "heal", "scout"].includes(parts[1]) && parts.length === 2) return { kind: "act", action: parts[1] as Action }; return null; }
export function initialState(seed = 20261102, settings: { difficulty?: Difficulty; phaseDurationSeconds?: number } = {}): QuestState { const difficulty = settings.difficulty ?? "standard"; const phaseDurationSeconds = settings.phaseDurationSeconds ?? 30; const threat = difficulty === "relaxed" ? 7 : difficulty === "heroic" ? 14 : 10; const supplies = difficulty === "relaxed" ? 6 : difficulty === "heroic" ? 3 : 4; return { phase: "lobby", questTitle: "The Ember Gate", seed, difficulty, phaseDurationSeconds, phaseEndsAt: null, players: {}, pathVotes: {}, actions: {}, health: 100, maxHealth: 100, supplies, threat, progress: 0, environment: "Whispering Camp", encounter: null, chosenPath: null, activeEvent: null, lastResolution: null, result: null, history: [], highlights: [] }; }
export function join(state: QuestState, id: string, name: string): QuestState { if (state.players[id]) return state; return log({ ...state, players: { ...state.players, [id]: { id, name: name.slice(0, 25), joinedAt: now(), role: null, contribution: 0, heroMoment: null } } }, `${name} joined the expedition`); }
export function chooseRole(state: QuestState, id: string, role: Role): QuestState { if (state.phase !== "roles" || !state.players[id]) return state; return { ...state, players: { ...state.players, [id]: { ...state.players[id], role } } }; }
export function begin(state: QuestState, durationMs = 30000): QuestState { if (state.phase !== "lobby") return state; return log({ ...state, phase: "roles", phaseEndsAt: now() + durationMs }, "Choose a role: !role warrior, guardian, healer, or scout"); }
export function votePath(state: QuestState, id: string, path: Path): QuestState { if (state.phase !== "path" || !state.players[id]) return state; return { ...state, pathVotes: { ...state.pathVotes, [id]: path } }; }
export function act(state: QuestState, id: string, action: Action): QuestState { const player = state.players[id]; if (!player || !player.role || !["encounter", "finale"].includes(state.phase)) return state; const compatible = (player.role === "warrior" && action === "attack") || (player.role === "guardian" && action === "shield") || (player.role === "healer" && action === "heal") || (player.role === "scout" && action === "scout"); if (!compatible) return state; return { ...state, actions: { ...state.actions, [id]: action } }; }
export function triggerEvent(state: QuestState, event: SpecialEvent): QuestState { if (["lobby", "result"].includes(state.phase)) return state; if (event === "rally") return log({ ...state, activeEvent: event, health: Math.min(state.maxHealth, state.health + 8), supplies: state.supplies + 1 }, "The streamer calls a Rally — the party recovers health and finds supplies.", "Rally! The community rallies behind the expedition."); return log({ ...state, activeEvent: event, threat: state.threat + 4 }, "An Emberstorm lashes the path — threat rises, but the crowd must answer.", "Emberstorm! The gate answers with living flame."); }
function teamSize(state: QuestState) { return Math.max(1, Object.keys(state.players).length); }
function resolved(state: QuestState, final: boolean): QuestState {
  const values = Object.entries(state.actions); const count = (action: Action) => values.filter(([, value]) => value === action).length; const softened = (amount: number, power: number) => amount ? Math.round(power * Math.sqrt(amount)) : 0;
  const warriors = count("attack"); const guardians = count("shield"); const scouts = count("scout"); const requestedHeals = count("heal"); const scoutReveal = warriors > 0 && scouts > 0 ? Math.ceil(softened(warriors, 10) * .25) : 0;
  const companionPower = teamSize(state) === 1 && values.length > 0 ? 7 : 0; // a lone adventurer receives a modest spirit-companion assist only when actively participating
  const attack = softened(warriors, 10) + scoutReveal + companionPower; const shield = softened(guardians, 4); const scoutStrength = softened(scouts, 3); const heals = Math.min(requestedHeals, state.supplies); const scale = Math.round(Math.max(0, Math.sqrt(teamSize(state)) - 1) * 4); const obstacle = state.threat + scale + (final ? 8 : 0) - scoutStrength; const incomingDamage = Math.max(0, obstacle - attack); const damage = Math.max(0, incomingDamage - shield); const health = Math.min(state.maxHealth, Math.max(0, state.health - damage + heals * 10));
  const players = Object.fromEntries(Object.entries(state.players).map(([id, player]) => [id, { ...player, contribution: player.contribution + (state.actions[id] ? 1 : 0) }])); const saver = health > 0 && health <= 20 && heals > 0 ? values.find(([, value]) => value === "heal")?.[0] : undefined; const guardian = incomingDamage > 0 && damage === 0 && guardians ? values.find(([, value]) => value === "shield")?.[0] : undefined; const scoutPlayer = scoutReveal ? values.find(([, value]) => value === "scout")?.[0] : undefined; const heroId = saver ?? guardian ?? scoutPlayer; const heroMoment = saver ? "Saved the party from defeat" : guardian ? "Held the line" : scoutPlayer ? "Revealed the enemy weakness" : null; const celebratedPlayers = heroId && heroMoment ? { ...players, [heroId]: { ...players[heroId], heroMoment } } : players; const highlight = saver ? `${players[saver].name} saved the party from defeat!` : guardian ? `${players[guardian].name} held the line against the attack!` : scoutPlayer ? `${players[scoutPlayer].name} revealed a weakness for the Warriors!` : undefined;
  const resolution: BattleResolution = { phase: final ? "finale" : "encounter", at: now(), attackPower: attack, companionPower, shieldAbsorbed: Math.min(incomingDamage, shield), scoutBoost: scoutReveal, healingRestored: Math.max(0, health - Math.max(0, state.health - damage)), damageTaken: Math.min(state.health, damage), threatAfter: Math.max(0, obstacle - attack), participants: values.length };
  const outcome = scoutReveal ? " Scout insight amplified the party's attack." : "";
  if (final) { const victory = values.length > 0 && health > 0 && obstacle - attack <= 10; return log({ ...state, players: celebratedPlayers, health, supplies: state.supplies - heals, threat: Math.max(0, obstacle - attack), progress: 100, lastResolution: resolution, actions: {}, phase: "result", phaseEndsAt: null, result: victory ? "victory" : "defeat" }, `${victory ? "The Ember Gate opens — the crowd is victorious!" : "The Ember Lord repels the expedition."}${outcome}`, highlight); }
  return log({ ...state, players: celebratedPlayers, health, supplies: state.supplies - heals, threat: Math.max(0, obstacle - attack), progress: 55, lastResolution: resolution, actions: {}, phase: "consequence", phaseEndsAt: now() + 15000, environment: health > 50 ? "Ashen Causeway" : "Burning Ravine", encounter: "ember wraith" }, `The party reaches the Ashen Causeway.${outcome}`, highlight);
}
export function advance(state: QuestState, durationMs = 30000): QuestState {
  if (state.phase === "roles") return log({ ...state, phase: "briefing", phaseEndsAt: now() + 10000, environment: "Whispering Camp" }, "The Ember Gate burns beyond the ravine.");
  if (state.phase === "briefing") return log({ ...state, phase: "path", phaseEndsAt: now() + durationMs }, "Vote !path A for the risky Sunken Bridge or !path B for the Moonlit Pass");
  if (state.phase === "path") { const a = Object.values(state.pathVotes).filter((value) => value === "A").length; const b = Object.values(state.pathVotes).filter((value) => value === "B").length; const chosenPath: Path = a >= b ? "A" : "B"; const dangerous = chosenPath === "A"; const encounter: Encounter = dangerous ? (roll(state.seed, 1) > .5 ? "collapsing bridge" : "bridge raiders") : (roll(state.seed, 1) > .5 ? "moonshade stalker" : "ember wraith"); const encounterThreat = encounter === "bridge raiders" ? 2 : encounter === "moonshade stalker" ? -1 : 0; const title = encounter === "collapsing bridge" ? "A collapsing bridge" : encounter === "bridge raiders" ? "Bridge raiders" : encounter === "moonshade stalker" ? "A Moonshade stalker" : "An Ember wraith"; return log({ ...state, phase: "encounter", phaseEndsAt: now() + durationMs, chosenPath, pathVotes: {}, supplies: state.supplies + (dangerous ? 2 : 0), threat: state.threat + (dangerous ? 4 : -2) + encounterThreat, progress: 20, environment: dangerous ? "Sunken Bridge" : "Moonlit Pass", encounter }, `${dangerous ? "Sunken Bridge" : "Moonlit Pass"} chosen — ${title} blocks the expedition!`); }
  if (state.phase === "encounter") return resolved(state, false);
  if (state.phase === "consequence") { const omen = roll(state.seed, 2) > .5 ? "The scouts reveal a weakness in the Ember Lord." : "The storm feeds the Ember Lord's flames."; return log({ ...state, phase: "finale", phaseEndsAt: now() + durationMs, encounter: "ember gate", environment: "The Ember Gate", threat: state.threat + (roll(state.seed, 2) > .5 ? -2 : 3), progress: 75 }, omen); }
  if (state.phase === "finale") return resolved(state, true);
  return state;
}
export function reset(seed = 20261102, settings: { difficulty?: Difficulty; phaseDurationSeconds?: number } = {}): QuestState { return initialState(seed, settings); }

/** One authoritative command path for simulated chat and Twitch events.
 * Rejected commands never change game state. */
export type ChatFeedback = { state: QuestState; accepted: boolean; feedback: string };
const reject = (state: QuestState, feedback: string): ChatFeedback => ({ state, accepted: false, feedback });
export function applyChatCommand(state: QuestState, id: string, name: string, message: string): ChatFeedback {
  const command = parseChatCommand(message);
  if (!command) return reject(state, "Unknown command. Use the command cards for the current phase.");
  if (command.kind === "join") {
    if (!["lobby", "roles"].includes(state.phase)) return reject(state, "Joining is closed for this quest. Wait for the next lobby.");
    if (state.players[id]) return reject(state, "You are already in the expedition.");
    return { state: join(state, id, name), accepted: true, feedback: "Joined the expedition!" };
  }
  if (!state.players[id]) return reject(state, "Join with !join before choosing a role, voting or acting.");
  if (command.kind === "role") {
    if (state.phase !== "roles") return reject(state, "Role selection is only available during Muster, after the host starts the quest.");
    if (state.players[id].role === command.role) return reject(state, "That role is already selected.");
    return { state: chooseRole(state, id, command.role), accepted: true, feedback: "Role selected: " + command.role + "." };
  }
  if (command.kind === "path") {
    if (state.phase !== "path") return reject(state, "Route voting is not active yet. Wait for the crossroads.");
    if (state.pathVotes[id] === command.path) return reject(state, "You have already voted for route " + command.path + ".");
    return { state: votePath(state, id, command.path), accepted: true, feedback: "Vote counted for route " + command.path + "." };
  }
  if (!["encounter", "finale"].includes(state.phase)) return reject(state, "Actions are only available during encounters and the final battle.");
  const role = state.players[id].role;
  if (!role) return reject(state, "You need a role first. Join the next quest and choose a role during Muster.");
  const allowed: Record<Role, Action> = { warrior: "attack", guardian: "shield", healer: "heal", scout: "scout" };
  if (allowed[role] !== command.action) return reject(state, "Your " + role + " can only use !act " + allowed[role] + ".");
  if (state.actions[id] === command.action) return reject(state, "Your action is already locked in for this round.");
  return { state: act(state, id, command.action), accepted: true, feedback: "Action locked in: " + command.action + "." };
}

/** Isolated, explicitly simulated scenes to rehearse the Twitch presentation.
 * This uses the same state transitions and combat calculations as a real quest.
 * Never describe these players or outcomes as live Twitch participation. */
export type RehearsalScene = "encounter" | "finale" | "result";
export function makeRehearsal(scene: RehearsalScene, seed = 7, settings: { difficulty?: Difficulty; phaseDurationSeconds?: number } = {}): QuestState {
  const party: Array<{ id: string; name: string; role: Role; action: Action }> = [
    { id: "rehearsal:warrior", name: "Nova [Demo]", role: "warrior", action: "attack" },
    { id: "rehearsal:guardian", name: "Arden [Demo]", role: "guardian", action: "shield" },
    { id: "rehearsal:healer", name: "Lyra [Demo]", role: "healer", action: "heal" },
    { id: "rehearsal:scout", name: "Orion [Demo]", role: "scout", action: "scout" }
  ];
  let next = initialState(seed, settings);
  for (const p of party) next = join(next, p.id, p.name);
  next = begin(next, settings.phaseDurationSeconds ? settings.phaseDurationSeconds * 1000 : 30000);
  for (const p of party) next = chooseRole(next, p.id, p.role);
  next = advance(next);
  next = advance(next);
  for (const p of party) next = votePath(next, p.id, "B");
  next = advance(next);
  for (const p of party) next = act(next, p.id, p.action);
  if (scene === "encounter") return next;
  next = advance(next);
  next = advance(next);
  for (const p of party) next = act(next, p.id, p.action);
  if (scene === "finale") return next;
  return advance(next);
}

/** A pure, game-engine-derived readiness calculation for streamer auto-progression.
 * Only interactive phases can become ready; idle or empty sessions never auto-advance.
 * The counts reflect the same eligibility rules as votePath and act.
 */
export type PhaseReadiness = { phase: Phase; ready: number; total: number; complete: boolean };
export function getPhaseReadiness(state: QuestState): PhaseReadiness {
  const participants = Object.values(state.players);
  let total = 0;
  let ready = 0;
  if (state.phase === "roles") {
    total = participants.length;
    ready = participants.filter((player) => player.role !== null).length;
  } else if (state.phase === "path") {
    total = participants.length;
    ready = participants.filter((player) => Boolean(state.pathVotes[player.id])).length;
  } else if (state.phase === "encounter" || state.phase === "finale") {
    const eligible = participants.filter((player) => player.role !== null);
    total = eligible.length;
    ready = eligible.filter((player) => Boolean(state.actions[player.id])).length;
  }
  return { phase: state.phase, ready, total, complete: total > 0 && ready === total };
}
