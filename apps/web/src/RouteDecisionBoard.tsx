import type { Path, QuestState } from "@crowdquest/shared";

type RouteCounts = { a: number; b: number; total: number; eligible: number; aPct: number; bPct: number; lead: Path | null; waiting: number };
export function getRouteCounts(state: QuestState): RouteCounts {
  // Mirror the game engine: one stored vote per player, reversible before phase closes.
  const a = Object.values(state.pathVotes).filter(v => v === "A").length;
  const b = Object.values(state.pathVotes).filter(v => v === "B").length;
  const total = a + b;
  const eligible = Object.keys(state.players).length;
  const aPct = total ? Math.round(a / total * 100) : 0;
  return {
    a,b,total,eligible,aPct,bPct:total ? 100-aPct : 0,
    lead: a > b ? "A" : b > a ? "B" : null,
    waiting: Math.max(0, eligible-total)
  };
}

/** A noninteractive view of *provisional* game-engine votes. Viewers act in Twitch chat. */
export function RouteDecisionBoard({ state }: { state: QuestState }) {
  if (state.phase !== "path") return null;
  const counts = getRouteCounts(state);
  const options = [
    { id:"A" as const, symbol:"⚔", name:"SUNKEN BRIDGE", tag:"RISK & REWARD", description:"+2 supplies · +4 route threat", count:counts.a, percent:counts.aPct, command:"!path A" },
    { id:"B" as const, symbol:"☽", name:"MOONLIT PASS", tag:"SAFER ROUTE", description:"−2 route threat", count:counts.b, percent:counts.bPct, command:"!path B" }
  ];
  return <aside className="route-decision-board" aria-label="Provisional Twitch vote results for the crossroads">
    <div className="route-decision-heading">
      <span className="route-decision-crest" aria-hidden="true">✥</span>
      <div><span className="route-decision-kicker">CROSSROADS</span><h2>CHOOSE THE ROAD</h2></div>
      <span className="route-decision-total">{counts.total}<small>VOTES</small></span>
    </div>
    <div className="route-decision-options">
      {options.map(route => <div key={route.id} className={"route-decision-option route-decision-" + route.id.toLowerCase() + (counts.lead === route.id ? " leading" : "")}>
        <div className="route-decision-symbol" aria-hidden="true">{route.symbol}</div>
        <div className="route-decision-body">
          <div className="route-decision-top"><span>{route.tag}</span>{counts.lead === route.id && <strong>✦ LEADING</strong>}</div>
          <b>{route.name}</b>
          <small>{route.description}</small>
          <div className="route-decision-track" aria-label={route.percent + " percent of votes for " + route.name}><i style={{width:route.percent+"%"}} /></div>
          <div className="route-decision-footer"><code>{route.command}</code><span>{route.count} {route.count===1?"vote":"votes"} · {route.percent}%</span></div>
        </div>
      </div>)}
    </div>
    <div className="route-decision-bottom">
      <b>{counts.total === 0 ? "AWAITING THE FIRST VOTE" : counts.lead === null ? "THE VOTE IS TIED" : "CURRENT LEAD · ROUTE " + counts.lead}</b>
      <small>{counts.eligible === 0 ? "No adventurers joined" : counts.waiting === 0 ? "All adventurers have voted" : counts.waiting + (counts.waiting === 1 ? " adventurer has not voted" : " adventurers have not voted")} · Ties resolve to A</small>
    </div>
    <p className="route-decision-disclaimer">Provisional tally · route locks when the phase ends</p>
  </aside>;
}
