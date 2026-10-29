import React, { useEffect, useMemo, useState } from "react";
import { CinematicScene } from "./CinematicScene";
import { GameAudioControl } from "./GameAudio";
import { createRoot } from "react-dom/client"; import { io } from "socket.io-client"; import { getPhaseReadiness, type Player, type QuestState, type Role } from "@crowdquest/shared"; import "./style.css"; import "./game-stage.css"; import "./cinematic-scene.css";
const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
type CommandActivity = { id: string; at: number; name: string; source: "twitch" | "demo"; command: string; accepted: boolean; feedback: string };
type LiveState = QuestState & { paused: boolean; rehearsalActive: boolean; autoAdvance: boolean; autoAdvanceAt: number | null; activity: CommandActivity[]; controlsProtected: boolean; twitch: { configured: boolean; connected: boolean; login: string | null; connection: string; message: string } };
const roles: Array<{ role: Role; icon: string; label: string; detail: string }> = [{ role: "warrior", icon: "⚔", label: "Warrior", detail: "Breaks threats" }, { role: "guardian", icon: "⬡", label: "Guardian", detail: "Absorbs damage" }, { role: "healer", icon: "✦", label: "Healer", detail: "Restores health" }, { role: "scout", icon: "◈", label: "Scout", detail: "Weakens encounters" }];
function useStateFeed() { const [state, setState] = useState<LiveState | null>(null); useEffect(() => { const socket = io(API); socket.on("state", setState); fetch(`${API}/api/state`).then((r) => r.json()).then(setState).catch(() => undefined); return () => { socket.close(); }; }, []); return state; }
function useNow() { const [now, setNow] = useState(Date.now()); useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(timer); }, []); return now; }
const authHeaders = (token: string): Record<string, string> => token ? { Authorization: `Bearer ${token}` } : {};
const command = (value: string, token: string) => fetch(`${API}/api/control/${value}`, { method: "POST", headers: authHeaders(token) });
function Meter({ label, value, max, tone = "ember" }: { label: string; value: number; max: number; tone?: "ember" | "mint" | "violet" }) { const width = Math.max(0, Math.min(100, value / Math.max(1, max) * 100)); return <div className="meter"><div className="meter-label"><span>{label}</span><b>{value}/{max}</b></div><div className="meter-track"><div className={`meter-fill ${tone}`} style={{ width: `${width}%` }} /></div></div>; }
const expeditionSteps: Array<{ phase: LiveState["phase"]; title: string; icon: string }> = [{ phase: "roles", title: "Muster", icon: "✦" }, { phase: "path", title: "Choose", icon: "◇" }, { phase: "encounter", title: "Trial", icon: "⚔" }, { phase: "finale", title: "Gate", icon: "♛" }, { phase: "result", title: "Chronicle", icon: "☄" }];
function QuestTrail({ state, compact = false }: { state: LiveState; compact?: boolean }) { const visiblePosition = state.phase === "lobby" ? -1 : state.phase === "briefing" ? 1 : state.phase === "consequence" ? 3 : state.phase === "result" ? 5 : expeditionSteps.findIndex(({ phase }) => phase === state.phase); return <div className={`quest-trail ${compact ? "compact" : ""}`} aria-label={`Quest route: ${state.phase}`}><span className="trail-label">EXPEDITION ROUTE</span><ol>{expeditionSteps.map((step, index) => <li className={index < visiblePosition || state.result === "victory" ? "complete" : index === visiblePosition ? "current" : ""} key={step.phase}><i>{step.icon}</i><b>{step.title}</b></li>)}</ol></div>; }
function GameStage({ state, overlay = false }: { state: LiveState; overlay?: boolean }) {
  const roleCounts = Object.values(state.players).reduce<Record<string, number>>((all, player) => { if (player.role) all[player.role] = (all[player.role] ?? 0) + 1; return all; }, {});
  const activeActions = Object.entries(state.actions).reduce<Array<{ action: "attack" | "shield" | "heal" | "scout"; player: Player }>>((all, [id, action]) => { const player = state.players[id]; if (player) all.push({ action, player }); return all; }, []);
  const scene = state.phase === "path" ? "crossroads" : (state.phase === "encounter" || state.phase === "consequence") ? (state.chosenPath === "A" ? "bridge" : "moonlit") : state.phase === "finale" ? "gate" : state.result ? state.result : "camp";
  const enemy = state.phase === "finale" ? "The Ember Lord" : state.phase === "encounter" ? ({ "collapsing bridge": "The Falling Span", "bridge raiders": "Bridge Raiders", "moonshade stalker": "Moonshade Stalker", "ember wraith": "Ash Wraith", "ember gate": "The Ember Gate" }[state.encounter ?? "ember wraith"] ?? "Ash Wraith") : null;
  const routeA = Object.values(state.pathVotes).filter((vote) => vote === "A").length; const routeB = Object.values(state.pathVotes).filter((vote) => vote === "B").length; const votes = Math.max(1, routeA + routeB);
  const actionCounts = (["attack", "shield", "heal", "scout"] as const).map((action) => ({ action, count: activeActions.filter((item) => item.action === action).length }));
  const readyRoles = roles.filter(({ role }) => roleCounts[role]).length;
  const rollCall = Object.values(state.players).sort((a, b) => b.joinedAt - a.joinedAt).slice(0, 4);
  const battleSignal = state.phase === "roles" ? `${readyRoles}/4 roles assembled` : state.phase === "path" ? `${routeA === routeB ? "Tied route vote" : `${routeA > routeB ? "A" : "B"} leads`} · ${routeA + routeB} ballots` : state.phase === "encounter" || state.phase === "finale" ? `${activeActions.length} ${activeActions.length === 1 ? "command" : "commands"} locked in` : state.result === "victory" ? "The gate answers the crowd" : state.result === "defeat" ? "The party will return" : `${Object.keys(state.players).length} adventurers answering the call`;
  const synergy = actionCounts.find(({ action }) => action === "attack")!.count && actionCounts.find(({ action }) => action === "scout")!.count ? "REVEAL COMBO · scouts amplify the strike" : actionCounts.find(({ action }) => action === "shield")!.count ? "GUARD LINE · shields absorb incoming damage" : actionCounts.find(({ action }) => action === "heal")!.count ? "RESTORE READY · healing spends supplies" : "BUILD A COMBO · pair scout with warrior";
  const phaseAnnouncement = state.result === "victory" ? "THE EMBER GATE OPENS" : state.result === "defeat" ? "THE PARTY FALLS" : ({ lobby: "THE CAMPFIRE CALLS", roles: "ASSEMBLE THE PARTY", briefing: "THE QUEST BEGINS", path: "THE CROSSROADS AWAKEN", encounter: "THE TRIAL BEGINS", consequence: "THE PARTY REGROUPS", finale: "FINAL ASSAULT", result: "THE CHRONICLE CLOSES" }[state.phase]);
  return <section className={`game-stage cinematic-stage ${scene} ${overlay ? "stage-overlay" : ""}`} aria-label={`Live game scene: ${state.environment}`}>
    <div className="stage-sky"><i /><i /><i /><i /><i /></div><svg className="stage-mountains" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 250 180 105 310 230 470 55 650 240 820 88 1010 232 1200 92V300H0Z" /><path d="m0 255 245-98 145 96 255-133 192 123 190-72 173 78v51H0Z" /></svg><div className="stage-ground" /><div className="stage-atmosphere" /><CinematicScene state={state} scene={scene} />{state.rehearsalActive && <div className="rehearsal-watermark" role="status">SIMULATED REHEARSAL · NOT TWITCH CHAT</div>}<div className="scene-sign"><span>{state.environment}</span><b>{enemy ?? (state.phase === "path" ? "The crowd chooses" : "The expedition assembles")}</b><small className="battle-signal"><i />{battleSignal}</small></div><div className="phase-banner" key={`${state.phase}-${state.result ?? "active"}`}><span>✦ CrowdQuest ✦</span><b>{phaseAnnouncement}</b></div>
    {state.paused && <div className="pause-scene"><i>Ⅱ</i><b>QUEST PAUSED</b><span>The expedition awaits the host.</span></div>}
    {scene === "camp" && <div className="campfire"><i /><i /><i /></div>}
    {!(state.phase === "encounter" || state.phase === "finale") && rollCall.length > 0 && <div className="roll-call"><b>ANSWERING THE CALL</b>{rollCall.map((player) => <span key={player.id}><i>{player.name.slice(0, 1).toUpperCase()}</i>{player.name}</span>)}</div>}
    {scene === "crossroads" && <><div className="route-sign"><span>A</span><b>Sunken Bridge</b><span>B</span><b>Moonlit Pass</b></div><div className="vote-momentum"><div><b>A · {routeA}</b><i><em style={{ width: `${routeA / votes * 100}%` }} /></i><small>Risk + supplies</small></div><div><b>B · {routeB}</b><i><em style={{ width: `${routeB / votes * 100}%` }} /></i><small>Safer passage</small></div></div></>}
    {scene === "bridge" && <div className="bridge"><i /><i /><i /><i /></div>}
    {enemy && <div className={`enemy ${state.phase === "finale" ? "boss" : "wraith"} ${state.encounter?.replaceAll(" ", "-") ?? ""}`}><div className="enemy-crown" /><div className="enemy-eyes" /><div className="enemy-health"><i style={{ width: `${Math.max(6, Math.min(100, state.threat / 30 * 100))}%` }} /></div><b>{enemy}</b></div>}
    {(state.phase === "encounter" || state.phase === "finale") && <><div className="action-board">{actionCounts.map(({ action, count }) => <span className={count ? "active" : ""} key={action}><b>{action === "attack" ? "⚔" : action === "shield" ? "⬡" : action === "heal" ? "✦" : "◈"}</b>{count}<small>{action}</small></span>)}</div><div className="command-feed" aria-live="polite"><b>LIVE COMMANDS</b><strong className={synergy.startsWith("REVEAL") ? "combo-live" : ""}>{synergy}</strong>{activeActions.length ? activeActions.slice(-4).map(({ action, player }) => <span key={`${player.id}-${action}`}>{player.name} <i>{action}</i></span>) : <small>Waiting for the first command…</small>}</div></>}
    <div className="party">{roles.map(({ role, icon, label }) => <div className={`hero-unit ${role} ${roleCounts[role] ? "present" : "waiting"} ${activeActions.some((item) => item.player.role === role) ? "acting" : ""}`} key={role}><div className="hero-aura" /><span>{icon}</span><b>{label}</b><small>{roleCounts[role] ?? 0}</small></div>)}</div>
    {activeActions.map(({ action, player }) => <div className={`action-burst ${action}`} key={`${player.id}-${action}`}><b>{action === "attack" ? "SLASH" : action === "shield" ? "GUARD" : action === "heal" ? "RESTORE" : "REVEAL"}</b><span>{player.name}</span></div>)}{state.lastResolution && (state.phase === "consequence" || state.phase === "result") && <div className="battle-report" key={state.lastResolution.at} aria-live="polite"><span className="battle-report-heading">✦ {state.lastResolution.phase === "finale" ? "FINAL BATTLE RESOLVED" : "ENCOUNTER RESOLVED"}</span><div className="battle-report-grid"><span><b>⚔ {state.lastResolution.attackPower}</b><small>Attack power</small></span><span><b>⬡ {state.lastResolution.shieldAbsorbed}</b><small>Blocked</small></span><span><b>✦ {state.lastResolution.healingRestored}</b><small>Restored</small></span><span><b>☄ {state.lastResolution.damageTaken}</b><small>Damage taken</small></span></div><small>{state.lastResolution.participants} player actions resolved{state.lastResolution.companionPower ? " · Spirit companion +" + state.lastResolution.companionPower : ""}{state.lastResolution.scoutBoost ? " · Scout combo +" + state.lastResolution.scoutBoost : ""}</small></div>}{state.activeEvent && <div className={`stage-event ${state.activeEvent}`}>{state.activeEvent === "rally" ? "✦ RALLY" : "☄ EMBERSTORM"}</div>}<div className="stage-footer"><span>{Object.keys(state.players).length} adventurers</span><span>{state.encounter ?? "Awaiting the call"}</span><span>Threat {state.threat}</span></div>
  </section>;
}
function PhaseTimer({ endsAt, durationSeconds = 30 }: { endsAt: number | null; durationSeconds?: number }) { const now = useNow(); const [phaseSeconds, setPhaseSeconds] = useState(durationSeconds); useEffect(() => { if (endsAt) setPhaseSeconds(Math.max(1, Math.ceil((endsAt - Date.now()) / 1000))); }, [endsAt]); if (!endsAt) return <span className="timer idle">Awaiting host</span>; const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000)); const progress = Math.max(0, Math.min(100, seconds / Math.max(1, phaseSeconds || durationSeconds) * 100)); return <span className={`timer timer-dial ${seconds <= 10 ? "urgent" : ""}`} style={{ "--timer-progress": `${progress}%` } as React.CSSProperties}><i /><small>TIME</small>{seconds}s</span>; }
function RoleRoster({ players }: { players: Record<string, Player> }) { const counts = Object.values(players).reduce<Record<string, number>>((all, player) => { if (player.role) all[player.role] = (all[player.role] ?? 0) + 1; return all; }, {}); return <section className="card"><div className="section-title"><div><p className="eyebrow">Party composition</p><h2>Roles on the expedition</h2></div><b>{Object.keys(players).length} players</b></div><div className="role-grid">{roles.map(({ role, icon, label, detail }) => <div className={`role ${counts[role] ? "active" : ""}`} key={role}><span>{icon}</span><div><b>{label}</b><small>{detail}</small></div><strong>{counts[role] ?? 0}</strong></div>)}</div></section>; }
function CommandDeck({ state }: { state: LiveState }) { const [copied, setCopied] = useState(""); const actionPhase = state.phase === "encounter" || state.phase === "finale"; const commands = state.phase === "roles" ? roles.map(({ role, icon, label, detail }) => ({ icon, command: `!role ${role}`, label, detail })) : state.phase === "path" ? [{ icon: "A", command: "!path A", label: "Sunken Bridge", detail: "Risk for supplies" }, { icon: "B", command: "!path B", label: "Moonlit Pass", detail: "A steadier route" }] : actionPhase ? [{ icon: "⚔", command: "!act attack", label: "Strike", detail: "Warrior assault" }, { icon: "⬡", command: "!act shield", label: "Guard", detail: "Guardian defense" }, { icon: "✦", command: "!act heal", label: "Restore", detail: "Healer recovery" }, { icon: "◈", command: "!act scout", label: "Reveal", detail: "Scout weakness" }] : state.phase === "lobby" ? [{ icon: "✦", command: "!join", label: "Join expedition", detail: "Become an adventurer" }] : []; const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); setCopied(value); window.setTimeout(() => setCopied(""), 1200); } catch { setCopied(""); } }; return <section className="card command-deck"><div className="section-title"><div><p className="eyebrow">Viewer ability deck</p><h2>{actionPhase ? "Battle commands" : state.phase === "path" ? "Route commands" : state.phase === "roles" ? "Choose your role" : "Enter the quest"}</h2></div><span className="command-live">{state.rehearsalActive ? "SIMULATED REHEARSAL" : state.twitch.connected ? "TWITCH LIVE" : "DEMO / OFFLINE"}</span></div><p className="muted">Click a command to copy it for chat.</p><div className="command-grid">{commands.length === 0 && <p className="muted">No chat action needed — the next stage begins soon.</p>}{commands.map(({ icon, command: value, label, detail }) => <button className={copied === value ? "copied" : ""} key={value} onClick={() => void copy(value)}><i>{copied === value ? "✓" : icon}</i><span><b>{label}</b><small>{detail}</small></span><code>{value}</code></button>)}</div></section>; }
function QuestmasterCallout({ state }: { state: LiveState }) { const actionPhase = state.phase === "encounter" || state.phase === "finale"; const assigned = new Set(Object.values(state.players).map((player) => player.role).filter(Boolean)); const actedRoles = new Set(Object.keys(state.actions).map((id) => state.players[id]?.role).filter(Boolean)); const missing = roles.find(({ role }) => !assigned.has(role)); const inactive = roles.find(({ role }) => !actedRoles.has(role)); const message = state.phase === "lobby" ? { icon: "✦", title: "Open the expedition", body: "Invite chat to type !join so the camp can fill." } : state.phase === "roles" && missing && Object.keys(state.players).length >= 4 ? { icon: roles.find(({ role }) => role === missing.role)?.icon ?? "✦", title: `${missing.label} needed`, body: `A balanced party needs a ${missing.label.toLowerCase()}. Ask chat for !role ${missing.role}.` } : state.phase === "roles" ? { icon: "✦", title: "Pick a role", body: "Any role can play solo: the Ember Spirit assists lone adventurers who take action. Type !role warrior, guardian, healer or scout." } : state.phase === "path" ? { icon: "◇", title: "The road is undecided", body: "Prompt the crowd to commit: !path A or !path B." } : actionPhase && inactive ? { icon: roles.find(({ role }) => role === inactive.role)?.icon ?? "✦", title: `${inactive.label} opportunity`, body: `${inactive.detail}. A ${inactive.label.toLowerCase()} can still commit this round.` } : actionPhase ? { icon: "✦", title: "Party combo armed", body: "Every active role has committed. Let the crowd finish the round." } : state.result === "victory" ? { icon: "♛", title: "The gate is open", body: "Celebrate the party, then reset when you are ready for another run." } : { icon: "☄", title: "Regroup at camp", body: "Reset the quest and try a new strategy together." }; return <div className="questmaster-callout"><i>{message.icon}</i><div><span>QUESTMASTER SIGNAL</span><b>{message.title}</b><p>{message.body}</p></div></div>; }

/** Context-sensitive participation readiness, derived only from the authoritative server state. */
function PhaseReadiness({ state }: { state: LiveState }) {
  const { complete, total, ready, phase } = getPhaseReadiness(state);
  const participants = Object.values(state.players);
  const assigned = participants.filter((p) => p.role);
  const interactive = phase === "roles" || phase === "path" || phase === "encounter" || phase === "finale";
  const progress = total ? Math.min(100, Math.round(ready * 100 / total)) : 0;
  const title = phase === "roles" ? "Choose your roles" : phase === "path" ? "Vote on the route" : phase === "encounter" ? "Prepare the encounter" : phase === "finale" ? "Ready for the Ember Lord" : "Waiting for the next stage";
  const help = !interactive ? "Participation readiness appears during interactive phases."
    : total === 0 ? "No eligible players yet. Invite viewers with !join and help them select roles."
    : complete ? "Everyone is ready. The host can advance without waiting for the timer."
    : phase === "roles" ? "Each adventurer should type !role warrior, guardian, healer or scout."
    : phase === "path" ? "Players vote with !path A or !path B."
    : "Each player uses the action associated with their chosen role.";
  return <section className="card phase-readiness">
    <div className="section-title"><div><p className="eyebrow">Community readiness</p><h2>{title}</h2></div><strong className="phase-readiness-total">{interactive ? ready + " / " + total : "—"}</strong></div>
    <div className="readiness-track" role="progressbar" aria-valuenow={interactive ? progress : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Phase participation"><i style={{ width: (interactive ? progress : 0) + "%" }} /></div>
    <p className="muted">{help}</p>
    {interactive && assigned.length < participants.length && (phase === "encounter" || phase === "finale") && <p className="readiness-caution">{participants.length - assigned.length} adventurer(s) lack a role and cannot act in this battle.</p>}
    {interactive && complete && <p className="ready-confirm">✓ All eligible responses received</p>}
  </section>;
}
function SmartHost({ state, controlToken }: { state: LiveState; controlToken: string }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const now = useNow();
  const enabled = Boolean(state.autoAdvance);
  const remaining = state.autoAdvanceAt === null ? null : Math.max(0, Math.ceil((state.autoAdvanceAt - now) / 1000));
  const toggle = async () => {
    setBusy(true); setFeedback("");
    try {
      const response = await fetch(API + "/api/session/auto-advance", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(controlToken) },
        body: JSON.stringify({ enabled: !enabled })
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      setFeedback(response.ok ? (!enabled ? "Smart Host enabled. The game advances when eligible players are ready." : "Smart Host disabled. Normal phase timers remain active.") : (result.error ?? "Could not change Smart Host mode."));
    } catch {
      setFeedback("Game server unavailable.");
    } finally { setBusy(false); }
  };
  return <section className="card smart-host">
    <div className="section-title"><div><p className="eyebrow">Live host assistant</p><h2>Smart Host</h2></div><strong className={enabled ? "ready-confirm" : "muted"}>{enabled ? "ON" : "OFF"}</strong></div>
    <p className="muted">Optional automatic progression when every eligible viewer has responded. A 3.5-second grace period lets viewers correct votes before the next scene.</p>
    <div className="smart-host-row"><button className={enabled ? "smart-host-enabled" : ""} aria-pressed={enabled} disabled={busy} onClick={() => void toggle()}>{busy ? "Updating…" : enabled ? "Disable Smart Host" : "Enable Smart Host"}</button><span>{state.paused ? "Paused by host" : state.rehearsalActive ? "Off during rehearsal" : enabled && remaining !== null ? "Advancing in " + remaining + "s" : enabled ? "Waiting for participation" : "Manual / normal timers"}</span></div>
    <p className="muted">Never advances an empty lobby, briefing, outcome screen, or paused quest. Normal phase timers still run.</p>
    {feedback && <p className="smart-host-feedback" role="status">{feedback}</p>}
  </section>;
}
function CommandActivityMonitor({ state }: { state: LiveState }) {
  const recent = (state.activity ?? []).slice(0, 12);
  const accepted = recent.filter((event) => event.accepted).length;
  return <section className="card command-monitor">
    <div className="section-title"><div><p className="eyebrow">Chat diagnostics</p><h2>Recent game commands</h2></div><span className="muted">{accepted} / {recent.length} accepted</span></div>
    <p className="muted">Accepted and rejected CrowdQuest commands, from the actual server. Ordinary Twitch messages are not recorded.</p>
    <ul className="activity-feed" aria-live="polite" aria-relevant="additions">
      {recent.length ? recent.map((event) => <li key={event.id}>
        <span className={"activity-icon " + (event.accepted ? "accepted" : "rejected")}>{event.accepted ? "✓" : "!"}</span>
        <div className="activity-copy"><span className="activity-person"><b>{event.name}</b><small className={"activity-source " + event.source}>{event.source === "demo" ? "SIMULATED" : "TWITCH"}</small></span>
          <code>{event.command}</code><small>{event.feedback}</small>
        </div><time dateTime={new Date(event.at).toISOString()}>{new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
      </li>) : <li className="muted">No gameplay commands yet. Try !join in your Twitch channel or Demo Mode.</li>}
    </ul>
  </section>;
}

function Leaderboard({ players }: { players: Record<string, Player> }) { const ranked = Object.values(players).sort((a, b) => b.contribution - a.contribution || a.joinedAt - b.joinedAt).slice(0, 5); return <section className="card"><div className="section-title"><div><p className="eyebrow">Community effort</p><h2>Contribution board</h2></div><span className="gold">✦</span></div><ol className="leaderboard">{ranked.length ? ranked.map((player, index) => <li key={player.id}><span className="rank">{index + 1}</span><span className="avatar">{player.name.slice(0, 1).toUpperCase()}</span><span className="leader-name">{player.name}<small className={player.heroMoment ? "hero-moment" : ""}>{player.heroMoment ?? player.role ?? "choosing role"}</small></span><b>{player.contribution}</b></li>) : <li className="muted">Waiting for adventurers to join.</li>}</ol></section>; }
function Demo({ controlToken }: { controlToken: string }) {
  const [name, setName] = useState("Nova");
  const [message, setMessage] = useState("!join");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const send = async () => {
    setStatus("sending");
    setFeedback("");
    try {
      const response = await fetch(API + "/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(controlToken) },
        body: JSON.stringify({ id: name.toLowerCase().replace(/\W/g, "") || "demo", name, message })
      });
      const result = await response.json().catch(() => ({})) as { accepted?: boolean; feedback?: string; error?: string };
      const accepted = response.ok && result.accepted === true;
      setStatus(accepted ? "sent" : "error");
      setFeedback(result.feedback ?? result.error ?? "Command could not be delivered. Check streamer access.");
    } catch {
      setStatus("error");
      setFeedback("Could not reach the game server.");
    }
  };
  return <section className="card"><div className="section-title"><div><p className="eyebrow">Safe rehearsal</p><h2>Demo Mode <span className="badge">SIMULATED</span></h2></div><span className="muted">Never sent to Twitch</span></div><p className="muted">Uses the same command rules as live chat. Rejected commands are explained.</p><div className="demo-fields"><input value={name} onChange={(e) => setName(e.target.value)} aria-label="Demo name" /><select value={message} onChange={(e) => setMessage(e.target.value)}><option>!join</option>{roles.map(({ role }) => <option key={role}>!role {role}</option>)}<option>!path A</option><option>!path B</option><option>!act attack</option><option>!act shield</option><option>!act heal</option><option>!act scout</option></select></div><div className="demo-send"><button className="primary mt-3" disabled={status === "sending"} onClick={() => void send()}>{status === "sending" ? "Sending…" : "Send simulated chat"}</button>{status !== "idle" && <span role="status" className={status === "sent" ? "sent" : "error"}>{status === "sent" ? "✓ " : "⚠ "}{feedback}</span>}</div></section>;
}
function RehearsalControls({ state, controlToken }: { state: LiveState; controlToken: string }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const show = async (scene: "encounter" | "finale" | "result") => {
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch(API + "/api/demo/rehearsal", {
        method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(controlToken) },
        body: JSON.stringify({ scene })
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      setFeedback(response.ok ? "Simulated " + scene + " loaded. Open Spectator to review; reset the quest to resume live Twitch commands." : (result.error ?? "Could not start rehearsal."));
    } catch {
      setFeedback("The game server is unavailable.");
    } finally { setBusy(false); }
  };
  const reset = async () => {
    setBusy(true); setFeedback("");
    try {
      const response = await command("reset", controlToken);
      setFeedback(response.ok ? "Rehearsal cleared. Live chat input may resume." : "Reset failed; check streamer authorization.");
    } catch { setFeedback("The game server is unavailable."); }
    finally { setBusy(false); }
  };
  return <section className="card rehearsal-card">
    <div className="section-title"><div><p className="eyebrow">Showcase studio</p><h2>One-click game rehearsal <span className="badge">SIMULATED</span></h2></div><span className="muted">For local testing only</span></div>
    <p className="muted">Preview a coordinated four-player expedition without manually sending chat commands. All four player names include [Demo]. These scenes use the actual game engine.</p>
    <div className="rehearsal-controls">
      <button disabled={busy} onClick={() => void show("encounter")}>⚔ Preview encounter</button>
      <button disabled={busy} onClick={() => void show("finale")}>♛ Preview boss fight</button>
      <button disabled={busy} onClick={() => void show("result")}>✦ Preview final outcome</button>
      {state.rehearsalActive && <button className="danger" disabled={busy} onClick={() => void reset()}>Reset to live lobby</button>}
    </div>
    {state.rehearsalActive && <p className="rehearsal-warning">SIMULATION ACTIVE — real Twitch commands are temporarily ignored. Reset the quest to return to live chat.</p>}
    {feedback && <p className="rehearsal-feedback" role="status">{feedback}</p>}
  </section>;
}
function SessionSettings({ state, controlToken }: { state: LiveState; controlToken: string }) { const [difficulty, setDifficulty] = useState(state.difficulty); const [seconds, setSeconds] = useState(state.phaseDurationSeconds); useEffect(() => { setDifficulty(state.difficulty); setSeconds(state.phaseDurationSeconds); }, [state.difficulty, state.phaseDurationSeconds]); const save = () => fetch(`${API}/api/session/settings`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(controlToken) }, body: JSON.stringify({ difficulty, phaseDurationSeconds: seconds }) }); const locked = state.phase !== "lobby" && state.phase !== "result"; return <section className="card"><div className="section-title"><div><p className="eyebrow">Mission settings</p><h2>Host configuration</h2></div><span className={locked ? "muted" : "gold"}>{locked ? "Locked in quest" : "Ready"}</span></div><div className="settings-fields"><label>Difficulty<select disabled={locked} value={difficulty} onChange={(event) => setDifficulty(event.target.value as LiveState["difficulty"])}><option value="relaxed">Relaxed</option><option value="standard">Standard</option><option value="heroic">Heroic</option></select></label><label>Phase seconds<input disabled={locked} type="number" min="10" max="120" value={seconds} onChange={(event) => setSeconds(Math.max(10, Math.min(120, Number(event.target.value) || 10)))} /></label></div><button className="mt-3" disabled={locked} onClick={save}>Apply mission settings</button></section>; }
function SpecialEvents({ state, controlToken }: { state: LiveState; controlToken: string }) { const [error, setError] = useState(""); const fire = async (event: "rally" | "emberstorm") => { const response = await fetch(`${API}/api/session/event`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders(controlToken) }, body: JSON.stringify({ event }) }); setError(response.ok ? "" : (await response.json().catch(() => ({ error: "Event unavailable" }))).error); }; const disabled = state.phase === "lobby" || state.phase === "result"; return <section className="card"><div className="section-title"><div><p className="eyebrow">Host power</p><h2>Special events</h2></div><span className="gold">✦</span></div><p className="muted">Create a visible consequence. A 15-second cooldown prevents accidental spam.</p><div className="event-buttons"><button disabled={disabled} onClick={() => fire("rally")}>✦ Rally <small>+8 health · +1 supply</small></button><button className="storm" disabled={disabled} onClick={() => fire("emberstorm")}>☄ Emberstorm <small>+4 threat</small></button></div>{state.activeEvent && <p className="event-active">Active moment: {state.activeEvent === "rally" ? "Rally" : "Emberstorm"}</p>}{error && <p className="error">{error}</p>}</section>; }
function prompt(state: LiveState) { if (state.result) return state.result === "victory" ? "THE EMBER GATE OPENS" : "THE PARTY MUST REGROUP"; if (state.phase === "roles") return "!role warrior · guardian · healer · scout"; if (state.phase === "path") return "!path A or !path B"; if (state.phase === "encounter" || state.phase === "finale") return "!act attack · shield · heal · scout"; if (state.phase === "lobby") return "!join to adventure"; return "Next phase begins soon"; }
function Dashboard() { const state = useStateFeed(); const [controlToken, setControlToken] = useState(""); const [hostNotice, setHostNotice] = useState(""); const [hostPending, setHostPending] = useState(false);
  const runHostControl = async (name: "start" | "advance" | "pause" | "resume" | "reset") => {
    if (hostPending) return;
    if (name === "reset" && state && state.phase !== "lobby" && state.phase !== "result" && !window.confirm("Reset the active quest? Current players and progress will be lost.")) return;
    setHostPending(true); setHostNotice("");
    try {
      const response = await command(name, controlToken);
      const result = await response.json().catch(() => ({})) as { error?: string };
      setHostNotice(response.ok ? "✓ " + (name === "reset" ? "Returned to the lobby." : name === "start" ? "Quest started." : name === "advance" ? "Phase advanced." : name === "pause" ? "Quest paused." : "Quest resumed.") : "⚠ " + (result.error ?? "Streamer control failed. Check your access token."));
    } catch { setHostNotice("⚠ The game server could not be reached."); }
    finally { setHostPending(false); }
  };
  if (!state) return <div className="loading">Summoning the expedition…</div>; const responses = Object.keys(state.actions).length || Object.keys(state.pathVotes).length; const actionPhase = state.phase === "encounter" || state.phase === "finale"; const recentHighlight = state.highlights[0]; return <main className="shell"><header><div><p className="eyebrow">CROWDQUEST // STREAMER CONTROL</p><h1>The Ember Gate</h1><p className="subtitle">A living co-op adventure shaped by your chat.</p></div><div className="header-actions"><GameAudioControl state={state}/><PhaseTimer endsAt={state.phaseEndsAt} />{state.paused && <span className="timer urgent">PAUSED</span>}<a className="overlay-link" href="/overlay" target="_blank" rel="noreferrer">Open OBS overlay ↗</a></div></header>{state.controlsProtected && <section className="card token-card"><label htmlFor="control-token">Streamer control token</label><p>Required for host controls and Demo Mode. Held only in this tab.</p><input id="control-token" type="password" autoComplete="off" value={controlToken} onChange={(event) => setControlToken(event.target.value)} /></section>}<GameStage state={state} /><ResultRecap state={state} showCopy /><div className="dashboard-grid"><section className="card hero"><div className="hero-top"><div><p className="eyebrow">{state.environment} · {state.phase} · {state.difficulty}</p><h2>{state.result ? (state.result === "victory" ? "Quest Complete" : "Expedition Failed") : state.phase === "roles" ? "Build the party" : state.phase === "path" ? "Choose a route" : actionPhase ? state.encounter : "The expedition gathers"}</h2></div><div className="quest-progress"><span>Quest progress</span><b>{state.progress}%</b><div><i style={{ width: `${state.progress}%` }} /></div></div></div><QuestTrail state={state} /><QuestmasterCallout state={state} /><div className="meters"><Meter label="Party health" value={state.health} max={state.maxHealth} tone="mint" /><Meter label="Gate threat" value={state.threat} max={30} tone="ember" /></div><div className="stats"><div><b>{Object.keys(state.players).length}</b><span>Adventurers</span></div><div><b>{state.supplies}</b><span>Supplies</span></div><div><b>{responses}</b><span>Responses</span></div></div>{recentHighlight && <div className="highlight">✦ {recentHighlight}</div>}<div className="controls"><button className="primary" onClick={() => void runHostControl("start")} disabled={hostPending || state.phase !== "lobby"}>Start quest</button><button onClick={() => void runHostControl("advance")} disabled={hostPending || state.phase === "lobby" || state.phase === "result" || state.paused}>Advance phase</button><button onClick={() => void runHostControl(state.paused ? "resume" : "pause")} disabled={hostPending || state.phase === "lobby" || state.phase === "result"}>{state.paused ? "Resume quest" : "Pause quest"}</button><button className="danger" onClick={() => void runHostControl("reset")} disabled={hostPending}>Reset</button></div>{hostNotice && <p className="host-action-notice" role="status">{hostNotice}</p>}</section><section className="card connection"><p className="eyebrow">Twitch connection</p><h2>{state.rehearsalActive ? "Simulated rehearsal active" : state.twitch.connected ? `Live as ${state.twitch.login}` : "Connect your channel"}</h2><p className={state.twitch.connection === "error" ? "error" : "muted"}>{state.rehearsalActive ? "Real Twitch chat is temporarily paused. Use Reset to return to live play." : state.twitch.message}</p><a className="primary inline-block mt-4" href={`${API}/auth/twitch`}>{state.twitch.connected ? "Reconnect Twitch" : "Connect Twitch"}</a><p className="hint">{prompt(state)}</p></section></div><div className="lower-grid"><PhaseReadiness state={state} /><SmartHost state={state} controlToken={controlToken} /><RoleRoster players={state.players} /><CommandActivityMonitor state={state} /><Leaderboard players={state.players} /><SessionSettings state={state} controlToken={controlToken} /><SpecialEvents state={state} controlToken={controlToken} /><Demo controlToken={controlToken} /><RehearsalControls state={state} controlToken={controlToken} /><CommandDeck state={state} /><section className="card"><div className="section-title"><div><p className="eyebrow">Live narrative</p><h2>Quest chronicle</h2></div></div><ul className="history">{state.history.length ? state.history.map((item) => <li key={item.id}>{item.text}</li>) : <li className="muted">The story begins when the host starts a quest.</li>}</ul></section></div></main>; }
function Overlay() { const state = useStateFeed(); if (!state) return null; return <main className="overlay"><div className="overlay-top"><div><p className="eyebrow">CROWDQUEST · {state.environment}</p><h1>{state.questTitle}</h1><p className="overlay-objective">{state.encounter ?? "Gather the party"}</p>{state.activeEvent && <p className="overlay-event">{state.activeEvent === "rally" ? "✦ RALLY! The party finds new strength." : "☄ EMBERSTORM! The threat rises."}</p>}</div><div className="overlay-right"><PhaseTimer endsAt={state.phaseEndsAt} /><div className="phase">{state.phase.toUpperCase()}</div></div></div><GameStage state={state} overlay /><div className="overlay-bottom"><div className="grow"><Meter label="Party health" value={state.health} max={state.maxHealth} tone="mint" /><div className="overlay-stats"><b>{Object.keys(state.players).length} adventurers</b><b>{state.supplies} supplies</b><b>Threat {state.threat}</b><b>{state.progress}% quest</b></div></div><div className={`prompt ${state.result ? "result" : ""}`}>{prompt(state)}</div></div></main>; }
function ExpeditionHonors({ state }: { state: LiveState }) { const roleCount = new Set(Object.values(state.players).map((player) => player.role).filter(Boolean)).size; const honors = [{ icon: "♛", title: "Gatebreaker", earned: state.result === "victory" }, { icon: "✦", title: "Fourfold Oath", earned: roleCount === 4 }, { icon: "◈", title: "Well Supplied", earned: state.supplies > 0 }]; return <div className="expedition-honors">{honors.map((honor) => <span className={honor.earned ? "earned" : ""} key={honor.title}><i>{honor.icon}</i>{honor.title}</span>)}</div>; }
function recapText(state: LiveState): string {
  const ranked = Object.values(state.players).sort((a, b) => b.contribution - a.contribution || a.joinedAt - b.joinedAt).slice(0, 3);
  return [
    "CROWDQUEST — THE EMBER GATE",
    "Outcome: " + (state.result === "victory" ? "VICTORY" : "DEFEAT"),
    "Session type: " + (state.rehearsalActive ? "SIMULATED REHEARSAL" : Object.values(state.players).some((player) => player.name.includes("[Demo]")) ? "MIXED/DEMO SESSION" : "Twitch-enabled session"),
    "Route: " + (state.chosenPath === "A" ? "Sunken Bridge" : state.chosenPath === "B" ? "Moonlit Pass" : "Not chosen"),
    "Players: " + Object.keys(state.players).length,
    "Difficulty: " + state.difficulty,
    "Party health: " + state.health + "/" + state.maxHealth,
    "Top contributions:",
    ...ranked.map((player, index) => (index + 1) + ". " + player.name + " — " + player.contribution + " actions"),
    "Highlights:",
    ...(state.highlights.length ? state.highlights : ["The expedition completed its final encounter."]),
    "Built with Codex. CrowdQuest supports Twitch chat gameplay."
  ].join("\n");
}
function ResultRecap({ state, showCopy = false }: { state: LiveState; showCopy?: boolean }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "manual">("idle");
  if (!state.result) return null;
  const top = Object.values(state.players).sort((a, b) => b.contribution - a.contribution || a.joinedAt - b.joinedAt).slice(0, 3);
  const text = recapText(state);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("manual");
    }
  };
  return <section className={"result-recap " + state.result}>
    <div><p className="eyebrow">Community chronicle</p><h2>{state.result === "victory" ? "The Ember Gate stands open" : "The expedition will return"}</h2><p>{state.result === "victory" ? "Every role helped carry the expedition through the fire." : "The party learned the path — regroup and try a different strategy."}</p><ExpeditionHonors state={state} />{showCopy && <div className="recap-share"><button onClick={() => void copy()}>{copyStatus === "copied" ? "✓ Recap copied" : "Copy quest recap"}</button>{copyStatus === "manual" && <><small>Clipboard permission unavailable. Select and copy the text below.</small><textarea readOnly value={text} rows={7} aria-label="Quest recap text for manual copying" /></>}</div>}</div>
    <div className="recap-highlights"><b>✦ Highlights</b>{state.highlights.length ? state.highlights.map((highlight) => <span key={highlight}>{highlight}</span>) : <span>Every accepted action counted toward the expedition.</span>}</div>
    <ol>{top.map((player, index) => <li key={player.id}><strong>#{index + 1}</strong><span>{player.name}<small className={player.heroMoment ? "hero-moment" : ""}>{player.heroMoment ?? player.role ?? "adventurer"}</small></span><b>{player.contribution} actions</b></li>)}</ol>
  </section>;
}
function CopyOverlayUrl() { const [copied, setCopied] = useState(false); const copy = async () => { try { await navigator.clipboard.writeText(new URL("/overlay", window.location.origin).toString()); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); } }; return <button className="copy-overlay" onClick={copy}>{copied ? "✓ OBS URL copied" : "Copy OBS URL"}</button>; }
function FullscreenToggle() { const [full, setFull] = useState(Boolean(document.fullscreenElement)); useEffect(() => { const update = () => setFull(Boolean(document.fullscreenElement)); document.addEventListener("fullscreenchange", update); return () => document.removeEventListener("fullscreenchange", update); }, []); const toggle = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen(); }; return <button className="fullscreen-toggle" onClick={toggle}>{full ? "Exit fullscreen" : "Enter fullscreen"}</button>; }
function Spectator() { const state = useStateFeed(); if (!state) return <div className="loading">Entering the Ember Gate…</div>; const roleCounts = Object.values(state.players).reduce<Record<string, number>>((all, player) => { if (player.role) all[player.role] = (all[player.role] ?? 0) + 1; return all; }, {}); return <main className="spectator"><header className="spectator-head"><div><p className="eyebrow">{state.rehearsalActive ? "SIMULATED REHEARSAL · DEMO PARTICIPANTS" : "LIVE COMMUNITY ADVENTURE"}</p><h1>{state.questTitle}</h1></div><div><CopyOverlayUrl /><FullscreenToggle /><GameAudioControl state={state}/><PhaseTimer endsAt={state.phaseEndsAt} /><span className="spectator-phase">{state.phase}</span></div></header><GameStage state={state} overlay /><ResultRecap state={state} /><section className="spectator-hud"><div><Meter label="Party health" value={state.health} max={state.maxHealth} tone="mint" /></div><div><Meter label="Gate threat" value={state.threat} max={30} tone="ember" /></div><div className="spectator-roles">{roles.map(({ role, icon }) => <span className={roleCounts[role] ? "active" : ""} key={role}>{icon} {roleCounts[role] ?? 0}</span>)}</div><div className="spectator-prompt">{prompt(state)}</div></section></main>; }
createRoot(document.getElementById("root")!).render(location.pathname === "/overlay" ? <Overlay /> : location.pathname === "/spectator" ? <Spectator /> : <Dashboard />);
