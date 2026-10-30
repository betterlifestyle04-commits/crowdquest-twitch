import type { QuestState } from "@crowdquest/shared";

export type StoryPanel = {
  kind: "camp" | "muster" | "briefing" | "aftermath" | "victory" | "defeat";
  eyebrow: string;
  title: string;
  narrative: string;
};

export function getStoryPanel(state: QuestState): StoryPanel | null {
  const party = Object.values(state.players);
  switch (state.phase) {
    case "lobby":
      return {
        kind: "camp",
        eyebrow: "PROLOGUE · WHISPERING CAMP",
        title: party.length ? "The fellowship is gathering" : "A legend waits for its heroes",
        narrative: party.length
          ? `${party.length} ${party.length === 1 ? "adventurer has" : "adventurers have"} answered the call. The host begins the quest when the party is ready.`
          : "Beyond the campfire lies an ancient gate. Join the expedition in Twitch chat and help write its story."
      };
    case "roles": {
      const ready = party.filter(p => p.role).length;
      return {
        kind: "muster",
        eyebrow: "CHAPTER I · THE MUSTER",
        title: ready === party.length && party.length > 0 ? "The fellowship is ready" : "Choose your calling",
        narrative: `${ready} of ${party.length} ${party.length === 1 ? "adventurer" : "adventurers"} ${ready === 1 ? "has" : "have"} chosen a role. Each class brings a different strength to the party.`
      };
    }
    case "briefing":
      return {
        kind: "briefing",
        eyebrow: "CHAPTER II · THE JOURNEY",
        title: "The campfire fades behind you",
        narrative: "Two roads lead toward the Ember Gate. At the crossroads, the crowd decides which danger the fellowship will face."
      };
    case "consequence": {
      const last = state.lastResolution;
      return {
        kind: "aftermath",
        eyebrow: "CHAPTER III · AFTERMATH",
        title: state.health <= 25 ? "The fellowship barely survives" : "The party presses onward",
        narrative: last
          ? `The trial is resolved. ${last.participants} ${last.participants === 1 ? "action" : "actions"} counted, and ${state.health} of ${state.maxHealth} party health remains.`
          : "The party regroups before reaching the gate."
      };
    }
    case "result": {
      if (state.result === null) return null;
      const win = state.result === "victory";
      return {
        kind: win ? "victory" : "defeat",
        eyebrow: "THE FINAL CHRONICLE",
        title: win ? "THE EMBER GATE OPENS" : "THE EMBER GATE ENDURES",
        narrative: win
          ? "The fellowship overcame the Ember Lord. Its choices will echo through the land."
          : "The Ember Lord stands, but the fellowship's story is not forgotten."
      };
    }
    default:
      return null;
  }
}

const roleGuide = [
  { name: "WARRIOR", icon: "⚔", command: "!role warrior", detail: "Strikes" },
  { name: "GUARDIAN", icon: "⬡", command: "!role guardian", detail: "Protects" },
  { name: "HEALER", icon: "✦", command: "!role healer", detail: "Restores" },
  { name: "SCOUT", icon: "◈", command: "!role scout", detail: "Reveals" }
];

/** Purely visual chapter presentation. The host still controls all state transitions. */
export function AdventureStory({ state, simulated = false }: { state: QuestState; simulated?: boolean }) {
  const panel = getStoryPanel(state);
  if (!panel) return null;
  const playerCount = Object.keys(state.players).length;
  const outcome = panel.kind === "victory" || panel.kind === "defeat";
  const ranked = Object.values(state.players).sort((a, b) =>
    b.contribution - a.contribution || a.joinedAt - b.joinedAt
  );
  const top = ranked[0];
  return <section
    key={state.phase}
    className={"adventure-story adventure-story-" + panel.kind}
    aria-label={outcome ? "Quest result cinematic" : "Story chapter briefing"}
  >
    <div className="story-border-top" aria-hidden="true"><span>✧</span><i/><span>✧</span></div>
    <p className="story-eyebrow">{panel.eyebrow}</p>
    <h2>{panel.title}</h2>
    <p className="story-narrative">{panel.narrative}</p>
    {panel.kind === "camp" && <>
      <div className="story-command-card"><span>JOIN THE PARTY IN CHAT</span><code>!join</code></div>
      <div className="story-tally">
        <span aria-hidden="true">♟</span><b>{playerCount}</b><small>{playerCount === 1 ? "adventurer at the campfire" : "adventurers at the campfire"}</small>
      </div>
    </>}
    {panel.kind === "muster" && <div className="story-role-grid">
      {roleGuide.map(role => <div className="story-role" key={role.name} title={role.command}>
        <b aria-hidden="true">{role.icon}</b><span>{role.name}</span><small>{role.detail}</small>
      </div>)}
      <small className="story-role-foot">Use <code>!role warrior</code>, <code>!role guardian</code>, <code>!role healer</code> or <code>!role scout</code>.</small>
    </div>}
    {panel.kind === "briefing" && <div className="story-route-tease">
      <span><b>A</b> Sunken Bridge <small>Risk · Supplies</small></span>
      <i aria-hidden="true">⚔</i>
      <span><b>B</b> Moonlit Pass <small>Safer passage</small></span>
    </div>}
    {panel.kind === "aftermath" && <div className="story-aftermath-stats">
      <div><span>PARTY HEALTH</span><b>{state.health}<small> / {state.maxHealth}</small></b></div>
      <div><span>SUPPLIES</span><b>{state.supplies}</b></div>
      <div><span>THREAT</span><b>{state.threat}</b></div>
    </div>}
    {outcome && <>
      <div className="story-result-seal" aria-hidden="true"><span>{panel.kind === "victory" ? "♛" : "⚔"}</span></div>
      <div className="story-results-line"><span>{playerCount} adventurers</span><span>{state.chosenPath === "A" ? "Sunken Bridge" : state.chosenPath === "B" ? "Moonlit Pass" : "No route selected"}</span><span>{state.health}/{state.maxHealth} health</span></div>
      {top && <div className="story-top-hero"><small>HIGHEST CONTRIBUTION</small><b>{top.name}</b><span>{top.contribution} {top.contribution === 1 ? "point" : "points"}</span></div>}
      {!top && <p className="story-no-champions">No adventurers joined this expedition.</p>}
    </>}
    {simulated && <span className="story-demo-badge">SIMULATED SHOWCASE · NOT REAL TWITCH CHAT</span>}
    <div className="story-border-bottom" aria-hidden="true"><i/><span>✧</span><i/></div>
  </section>;
}
