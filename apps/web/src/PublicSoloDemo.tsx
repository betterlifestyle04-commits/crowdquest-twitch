import { useRef, useState, type ReactNode } from "react";
import { GameSceneBoundary } from "./GameSceneBoundary";
import { act, advance, begin, chooseRole, initialState, join, votePath, type Action, type Path, type QuestState, type Role } from "@crowdquest/shared";

const heroId = "public:solo";
const roleDescriptions: Array<{ role: Role; icon: string; label: string; description: string; action: Action }> = [
  {role:"warrior",icon:"⚔",label:"Warrior",description:"Fight with a blade",action:"attack"},
  {role:"guardian",icon:"⬡",label:"Guardian",description:"Block incoming damage",action:"shield"},
  {role:"healer",icon:"✦",label:"Healer",description:"Restore party health",action:"heal"},
  {role:"scout",icon:"◈",label:"Scout",description:"Reveal hidden weaknesses",action:"scout"}
];

const phaseNumbers: Record<QuestState["phase"], number> = {
  lobby: 1, roles: 2, briefing: 3, path: 4,
  encounter: 5, consequence: 6, finale: 7, result: 8
};
const encounterDescriptions: Record<string, string> = {
  "collapsing bridge": "The Sunken Bridge is collapsing. Prepare your class ability to survive the crossing.",
  "bridge raiders": "Bridge raiders block the expedition. Prepare your class ability before the fight.",
  "moonshade stalker": "A Moonshade stalker prowls ahead. Prepare your class ability before the fight.",
  "ember wraith": "An Ember wraith blocks the expedition. Prepare your class ability before the fight."
};
const freeze = (state: QuestState): QuestState => ({...state,phaseEndsAt:null});
export function soloNext(state: QuestState, action:
  | {type:"join";name:string}
  | {type:"start"}
  | {type:"role";role:Role}
  | {type:"route";path:Path}
  | {type:"ability"}
  | {type:"continue"}
): QuestState {
  if (action.type === "join" && state.phase === "lobby" && !state.players[heroId]) {
    const name = action.name.trim().replace(/\s+/g," ").slice(0,17);
    if (!name) return state;
    return freeze(join(state,heroId,name + " [Demo]"));
  }
  if (action.type === "start" && state.phase === "lobby" && state.players[heroId]) return freeze(begin(state));
  if (action.type === "role" && state.phase === "roles") return freeze(chooseRole(state,heroId,action.role));
  if (action.type === "route" && state.phase === "path") return freeze(votePath(state,heroId,action.path));
  if (action.type === "ability" && (state.phase === "encounter" || state.phase === "finale")) {
    const role = state.players[heroId]?.role;
    const item = roleDescriptions.find(x=>x.role===role);
    return item ? freeze(act(state,heroId,item.action)) : state;
  }
  if (action.type === "continue") {
    if (state.phase === "roles" && !state.players[heroId]?.role) return state;
    if (state.phase === "path" && !state.pathVotes[heroId]) return state;
    if (["encounter","finale"].includes(state.phase) && !state.actions[heroId]) return state;
    return freeze(advance(state));
  }
  return state;
}

/** A fully local, single-player rehearsal using the actual shared quest engine.
 * Does not touch Twitch, Socket.IO, authentication, or the live backend state. */
export function PublicSoloDemo({renderGame}: {renderGame:(state:QuestState,focused:boolean)=>ReactNode}) {
  const seed = useRef(20261102);
  const [state,setState] = useState<QuestState>(()=>initialState(seed.current));
  const [name,setName] = useState("Hero");
  const [focused,setFocused] = useState(true);
  const participant = state.players[heroId];
  const ability = roleDescriptions.find(x=>x.role===participant?.role);
  const committed = Boolean(state.actions[heroId]);
  const phaseNumber = phaseNumbers[state.phase];
  const next = (action:Parameters<typeof soloNext>[1])=>setState(current=>soloNext(current,action));
  const restart=()=>{seed.current += 1;setState(initialState(seed.current));};
  const chapter = state.phase === "lobby" ? "The Campfire" :
    state.phase === "roles" ? "The Muster" :
    state.phase === "briefing" ? "The Journey Begins" :
    state.phase === "path" ? "The Crossroads" :
    state.phase === "encounter" ? "The First Trial" :
    state.phase === "consequence" ? "The Aftermath" :
    state.phase === "finale" ? "The Ember Lord" : "The Final Chronicle";
  return <main className="public-showcase public-solo">
    <header className="showcase-navigation">
      <a className="showcase-brand" href="/" aria-label="CrowdQuest public home"><span className="showcase-brand-seal">✦</span><span>CROWD<span className="showcase-gold">QUEST</span><small>THE EMBER GATE</small></span></a>
      <nav aria-label="Game navigation"><a href="/showcase">Explore six scenes</a><a className="showcase-code-link" href="https://github.com/betterlifestyle04-commits/crowdquest-twitch" rel="noreferrer" target="_blank">Source ↗</a></nav>
    </header>
    <section className="solo-intro"><div><p className="showcase-overline">PLAYABLE REHEARSAL · SINGLE PLAYER</p><h1>Become the hero.</h1><p>Join the expedition, choose your role, make the journey's decisions and fight the Ember Lord—all in your browser.</p></div><span className="showcase-simulated-tag">SIMULATED DEMO · NOT LIVE TWITCH</span></section>
    <div className="solo-layout">
      <section className="solo-playfield" aria-label="CrowdQuest simulated gameplay">
        <div className="showcase-stage-meta"><div><span>THE EMBER GATE · SIMULATED</span><h3>{chapter}</h3><p>{state.history[0]?.text ?? "The adventure is yours to begin."}</p></div><button className="game-display-toggle" aria-pressed={!focused} type="button" onClick={()=>setFocused(value=>!value)}>{focused?"Show detailed HUD":"Hide extra panels"}</button></div>
        <div className="showcase-stage-shell"><GameSceneBoundary key={state.phase}>{renderGame(state,focused)}</GameSceneBoundary></div>
        <p className="solo-stage-note">This is a single-player engine rehearsal. Actions happen in this browser only, with an Ember Spirit companion in combat. The real multiplayer game uses Twitch chat.</p>
      </section>
      <aside className="solo-controls" aria-labelledby="solo-controls-title">
        <div className="solo-controls-heading" aria-live="polite"><span>✥ YOUR ADVENTURE · CHAPTER {phaseNumber} OF 8</span><h2 id="solo-controls-title">{chapter}</h2><div className="solo-phase-track" role="progressbar" aria-label="Quest progress" aria-valuemin={0} aria-valuemax={8} aria-valuenow={phaseNumber}><i style={{width:phaseNumber/8*100+"%"}} /></div></div>
        {state.phase === "lobby" && !participant && <form onSubmit={event=>{event.preventDefault();next({type:"join",name});}} className="solo-actions">
          <label htmlFor="solo-hero-name">Your hero's display name</label>
          <input id="solo-hero-name" value={name} onChange={event=>setName(event.target.value.slice(0,17))} maxLength={17} autoComplete="off" required aria-describedby="solo-privacy" />
          <p id="solo-privacy">Only used in this browser session. The name receives a [Demo] label.</p>
          <button className="solo-primary" type="submit" disabled={!name.trim()}>⚔ Join the expedition</button>
        </form>}
        {state.phase === "lobby" && participant && <div className="solo-actions"><p><strong>{participant.name}</strong> has joined the party. Your adventure begins when you start the quest.</p><button className="solo-primary" type="button" onClick={()=>next({type:"start"})}>Begin the quest →</button></div>}
        {state.phase === "roles" && <div className="solo-actions"><p>Choose your calling. Each class has a different combat ability.</p><div className="solo-role-grid">{roleDescriptions.map(item=><button className={"solo-choice "+(participant?.role===item.role?"chosen":"")} aria-pressed={participant?.role===item.role} key={item.role} onClick={()=>next({type:"role",role:item.role})} type="button"><b>{item.icon} {item.label}</b><small>{item.description}</small></button>)}</div><button className="solo-primary" type="button" onClick={()=>next({type:"continue"})} disabled={!participant?.role}>Continue with {participant?.role??"your role"} →</button></div>}
        {state.phase === "briefing" && <div className="solo-actions"><p>Your companion watches the campfire dim. Beyond the ravine, two roads lead to the gate.</p><button className="solo-primary" type="button" onClick={()=>next({type:"continue"})}>Travel to the crossroads →</button></div>}
        {state.phase === "path" && <div className="solo-actions"><p>Choose the road your hero takes. You can change your mind until you continue.</p><button type="button" className={"solo-choice solo-route "+(state.pathVotes[heroId]==="A"?"chosen":"")} aria-pressed={state.pathVotes[heroId]==="A"} onClick={()=>next({type:"route",path:"A"})}><b>⚔ A — Sunken Bridge</b><small>Extra supplies, greater threat</small></button><button type="button" className={"solo-choice solo-route "+(state.pathVotes[heroId]==="B"?"chosen":"")} aria-pressed={state.pathVotes[heroId]==="B"} onClick={()=>next({type:"route",path:"B"})}><b>☽ B — Moonlit Pass</b><small>Safer passage</small></button><button className="solo-primary" type="button" onClick={()=>next({type:"continue"})} disabled={!state.pathVotes[heroId]}>Commit route {state.pathVotes[heroId]??""} →</button></div>}
        {(state.phase==="encounter" || state.phase==="finale") && <div className="solo-actions"><p>{state.phase==="finale"?"The Ember Lord awaits.":encounterDescriptions[state.encounter ?? ""] ?? "An encounter blocks the expedition."} {committed ? "Your ability is ready. Resolve the turn to see what happens." : "Prepare your " + (participant?.role ?? "hero") + " ability to continue."}</p><button className={"solo-choice chosen " + (committed ? "ability-committed" : "")} type="button" onClick={()=>next({type:"ability"})} disabled={committed}><b>{ability?.icon} {committed?"✓ "+(ability?.label ?? "Ability")+" ready":"Prepare "+(ability?.action ?? "ability")}</b><small aria-live="polite">{committed?"Action confirmed — choose the gold button below to resolve.":"Your Ember Spirit adds power in solo battles."}</small></button><button className="solo-primary" type="button" onClick={()=>next({type:"continue"})} disabled={!committed}>{state.phase==="finale"?"Resolve the final battle":"Resolve the encounter"} →</button></div>}
        {state.phase==="consequence" && <div className="solo-actions"><p>The trial has ended. Your party has <strong>{state.health}/{state.maxHealth} HP</strong> and <strong>{state.supplies} supplies</strong>.</p><button className="solo-primary" type="button" onClick={()=>next({type:"continue"})}>Approach the Ember Gate →</button></div>}
        {(state.phase==="consequence" || state.phase==="result") && state.lastResolution && <div className="solo-battle-recap" aria-label="Resolved battle statistics"><b>{state.phase==="result"?"FINAL BATTLE RESULTS":"ENCOUNTER RESULTS"}</b><div><span>Attack power <strong>{state.lastResolution.attackPower}</strong></span><span>Damage taken <strong>{state.lastResolution.damageTaken}</strong></span><span>Damage blocked <strong>{state.lastResolution.shieldAbsorbed}</strong></span><span>Health restored <strong>{state.lastResolution.healingRestored}</strong></span></div>{state.lastResolution.companionPower>0 && <small>Attack power includes {state.lastResolution.companionPower} from your Ember Spirit companion.</small>}</div>
        {state.phase==="result" && <div className="solo-actions"><p className="solo-result">{state.result==="victory"?"✦ Victory — the gate opens!":"⚔ The gate endures — try another path!"}</p><p>Your {participant?.role ?? "hero"} took the {state.chosenPath==="A"?"Sunken Bridge":"Moonlit Pass"} and finished with {state.health}/{state.maxHealth} HP. The result was calculated by the shared quest engine.</p><button type="button" className="solo-primary" onClick={restart}>↻ Play another adventure</button></div>}
        {participant && <div className="solo-stats"><span><small>YOUR ROLE</small><b>{participant.role??"Unassigned"}</b></span><span><small>PARTY HEALTH</small><b>{state.health}/{state.maxHealth}</b></span><span><small>SUPPLIES</small><b>{state.supplies}</b></span><span><small>THREAT</small><b>{state.threat}</b></span></div>}
        <div className="solo-disclaimer"><b>Not connected to Twitch</b><p>This rehearsal uses the same quest engine as the multiplayer game, without a streamer, chat connection, or stored account. The public Showcase remains separate from actual Twitch participation.</p></div>
      </aside>
    </div>
    <footer className="showcase-footer"><span>SIMULATED REHEARSAL · NO REAL TWITCH COMMANDS</span><a href="/showcase">Explore the chapter gallery →</a><a href="https://github.com/betterlifestyle04-commits/crowdquest-twitch" target="_blank" rel="noreferrer">View game source ↗</a></footer>
  </main>;
}
