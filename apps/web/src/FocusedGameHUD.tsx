import type { QuestState } from "@crowdquest/shared";

const phaseTitles: Record<QuestState["phase"], string> = {
  lobby: "The Campfire", roles: "Choose Your Role", briefing: "The Journey",
  path: "The Crossroads", encounter: "The First Trial", consequence: "After the Battle",
  finale: "The Ember Lord", result: "The Chronicle"
};

/** Quiet, accurate game information for a screenshot-friendly scene.
 * Player instructions are outside the battlefield in /play and /showcase. */
export function FocusedGameHUD({state}: {state: QuestState}) {
  const party = Object.keys(state.players).length;
  const hp = Math.max(0,Math.min(100,state.health / Math.max(1,state.maxHealth)*100));
  return <div className="focused-game-hud" aria-label="Simplified gameplay information">
    <div className="focused-chapter">
      <span className="focused-chapter-mark" aria-hidden="true">✦</span>
      <span className="focused-chapter-label"><small>THE EMBER GATE · {state.rehearsalActive ? "SIMULATED" : "ADVENTURE"}</small><b>{phaseTitles[state.phase]}</b></span>
    </div>
    <div className="focused-vitals">
      <div className="focused-health">
        <span><b aria-hidden="true">♥</b> PARTY HP <strong>{state.health}/{state.maxHealth}</strong></span>
        <i className="focused-health-track"><em style={{width:hp+"%"}}/></i>
      </div>
      <div className="focused-stat"><small>HEROES</small><b>{party}</b></div>
      <div className="focused-stat"><small>SUPPLIES</small><b>{state.supplies}</b></div>
      <div className="focused-stat"><small>THREAT</small><b>{state.threat}</b></div>
    </div>
  </div>;
}
