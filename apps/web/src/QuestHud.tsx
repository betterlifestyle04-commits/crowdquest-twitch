import type { QuestState, Role } from "@crowdquest/shared";

const partyRoles: Array<{ role: Role; glyph: string; label: string; ability: string }> = [
  { role: "warrior", glyph: "⚔", label: "WARRIOR", ability: "STRIKE" },
  { role: "guardian", glyph: "⬡", label: "GUARDIAN", ability: "GUARD" },
  { role: "healer", glyph: "✦", label: "HEALER", ability: "RESTORE" },
  { role: "scout", glyph: "◈", label: "SCOUT", ability: "REVEAL" }
];

const chapters: Array<{ title: string; phases: QuestState["phase"][] }> = [
  { title: "MUSTER", phases: ["lobby", "roles"] },
  { title: "THE JOURNEY", phases: ["briefing", "path"] },
  { title: "THE TRIAL", phases: ["encounter", "consequence"] },
  { title: "THE GATE", phases: ["finale"] },
  { title: "CHRONICLE", phases: ["result"] }
];

export function QuestHud({ state }: { state: QuestState }) {
  const people = Object.values(state.players);
  const inCombat = state.phase === "encounter" || state.phase === "finale";
  const assigned = people.filter(player => player.role);
  const actions = Object.keys(state.actions).length;
  const selected = Object.values(state.pathVotes);
  const chapter = Math.max(0, chapters.findIndex(item => item.phases.includes(state.phase)));
  const ready = state.phase === "roles" ? assigned.length : state.phase === "path" ? selected.length : inCombat ? actions : people.length;
  const eligible = state.phase === "roles" || state.phase === "path" ? people.length : inCombat ? assigned.length : people.length;
  const moment: Record<QuestState["phase"], { chapter: string; title: string; objective: string; command: string }> = {
    lobby: { chapter: "PROLOGUE", title: "Answer the call", objective: "Your expedition begins when the crowd joins the campfire.", command: "!join" },
    roles: { chapter: "I · THE MUSTER", title: "Assemble your heroes", objective: "Choose a class. Every role changes how the party survives.", command: "!role warrior · guardian · healer · scout" },
    briefing: { chapter: "II · THE JOURNEY", title: "Beyond the campfire", objective: "The party sets out toward the ancient Ember Gate.", command: "WAIT FOR THE CROSSROADS" },
    path: { chapter: "II · THE CROSSROADS", title: "Choose your fate", objective: "Sunken Bridge offers risk and supplies; Moonlit Pass is safer.", command: "!path A   /   !path B" },
    encounter: { chapter: "III · FIRST TRIAL", title: "Face the danger", objective: "Work as a party. Combine roles to strengthen the assault.", command: "!act attack · shield · heal · scout" },
    consequence: { chapter: "III · AFTERMATH", title: "Count your victories", objective: "Your choices shaped the party's supplies and strength.", command: "THE QUEST CONTINUES…" },
    finale: { chapter: "IV · FINAL BATTLE", title: "Defy the Ember Lord", objective: "This is the last stand. Every accepted action counts.", command: "!act attack · shield · heal · scout" },
    result: { chapter: "V · THE CHRONICLE", title: state.result === "victory" ? "The gate is open" : "Legends are forged", objective: state.result === "victory" ? "Your party conquered the Ember Gate." : "The expedition is over. The next adventure awaits.", command: "QUEST COMPLETE" }
  };
  const current = moment[state.phase];
  const allReady = eligible > 0 && ready >= eligible;
  const partyLabel = inCombat ? "ABILITIES COMMITTED" : state.phase === "path" ? "ROUTE VOTES" : state.phase === "roles" ? "ROLES CHOSEN" : "ADVENTURERS";
  return <div className={"quest-hud quest-hud-" + state.phase} aria-label="Adventure HUD">
    <div className="quest-hud-vignette" aria-hidden="true" />
    <div className="quest-hud-objective" key={state.phase}>
      <div className="quest-hud-mark" aria-hidden="true">✥</div>
      <div className="quest-hud-mission">
        <span className="quest-hud-eyebrow">{current.chapter} <span className="quest-hud-diamond">◆</span> {state.environment}</span>
        <h2>{current.title}</h2>
        <p>{current.objective}</p>
        <div className="quest-hud-command"><span>TWITCH CHAT</span><code>{current.command}</code></div>
      </div>
    </div>
    <div className="quest-hud-chapters" aria-label="Quest chapters">
      {chapters.map((step, index) => <div key={step.title} className={"quest-hud-chapter " + (index < chapter ? "complete" : index === chapter ? "current" : "")} title={step.title} aria-current={index === chapter ? "step" : undefined}>
        <span>{index < chapter ? "✓" : index === chapter ? "✦" : index + 1}</span>
        <small>{step.title}</small>
      </div>)}
    </div>
    <div className="quest-hud-party" aria-label="Party members and action status">
      <div className="quest-hud-party-heading">
        <div><span className="quest-hud-party-glyph">❖</span><strong>THE EXPEDITION</strong><small>{people.length} ADVENTURERS</small></div>
        <div className={"quest-hud-ready " + (allReady ? "complete" : "")}><span>{partyLabel}</span><b>{ready}<i>/</i>{eligible}</b></div>
      </div>
      <div className="quest-hud-roles">
        {partyRoles.map(item => {
          const members = people.filter(player => player.role === item.role);
          const committed = members.filter(player => Boolean(state.actions[player.id])).length;
          const live = members.length > 0;
          const sealed = inCombat && committed > 0;
          return <div key={item.role} className={"quest-hud-role " + item.role + (live ? " active" : " missing") + (sealed ? " committed" : "")}>
            <div className="quest-hud-portrait"><span aria-hidden="true">{item.glyph}</span>{live && <small>{members.length}</small>}</div>
            <div className="quest-hud-role-label"><b>{item.label}</b><small>{inCombat ? (sealed ? committed + " LOCKED" : live ? "AWAITING ACTION" : "UNASSIGNED") : live ? members.length + " IN PARTY" : "NOT RECRUITED"}</small></div>
            {inCombat && <span className={"quest-hud-role-orb " + (sealed ? "lit" : "")} aria-hidden="true">{sealed ? "✓" : "·"}</span>}
          </div>;
        })}
      </div>
      <div className="quest-hud-party-base"><span>✧ <b>THE EMBER GATE</b></span><div className="quest-hud-party-progress"><i style={{ width: Math.max(0, Math.min(100, state.progress)) + "%" }}/></div><span>{state.progress}% COMPLETE</span></div>
    </div>
  </div>;
}
