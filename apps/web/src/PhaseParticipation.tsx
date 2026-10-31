import { getPhaseReadiness, type QuestState } from "@crowdquest/shared";

const mode: Record<"roles"|"path"|"encounter"|"finale", string> = {
  roles:"HEROES CHOSEN", path:"ROUTES VOTED", encounter:"ABILITIES READY", finale:"FINAL ABILITIES"
};

/** A read-only audience progress bar from server-authoritative eligibility rules. */
export function PhaseParticipation({state}: {state:QuestState}) {
  if (state.phase !== "roles" && state.phase !== "path" && state.phase !== "encounter" && state.phase !== "finale") return null;
  const data = getPhaseReadiness(state);
  const ratio = data.total > 0 ? data.ready / data.total * 100 : 0;
  const ready = data.total > 0 && data.complete;
  const label = mode[state.phase];
  return <div className={"phase-participation " + (ready ? "complete" : "")} aria-label={label + ", " + data.ready + " of " + data.total}>
    <div className="phase-participation-header">
      <span>{label}</span>
      <b>{data.ready}<small> / {data.total}</small></b>
    </div>
    <div className="phase-participation-track" role="progressbar"
      aria-label={label} aria-valuemin={0} aria-valuemax={data.total} aria-valuenow={data.ready}>
      <i style={{width: Math.max(0, Math.min(100, ratio)) + "%"}}/>
    </div>
    <small>{ready ? "THE PARTY IS READY" : data.total === 0 ? "AWAITING ADVENTURERS" : "WAITING FOR PARTICIPANTS"}</small>
  </div>;
}
