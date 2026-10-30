import { useEffect, useRef, useState } from "react";
import type { QuestState } from "@crowdquest/shared";

export type PartyHealthShift = { delta: number; direction: "hurt" | "recovered" };

export function getPartyHealthShift(before: QuestState, after: QuestState): PartyHealthShift | null {
  // Never animate a fresh/restarted lobby or an unrelated run as a combat consequence.
  if (before.seed !== after.seed || before.phase === "lobby" || after.phase === "lobby") return null;
  const delta = after.health - before.health;
  if (!Number.isFinite(delta) || delta === 0) return null;
  return { delta, direction: delta < 0 ? "hurt" : "recovered" };
}

/** Brief non-interactive HP feedback. Only reflects the actual net change in party health. */
export function PartyImpact({ state, simulated, connected }: {
  state: QuestState; simulated: boolean; connected: boolean;
}) {
  const previous = useRef({ state, simulated });
  const [impact, setImpact] = useState<PartyHealthShift & { id: number } | null>(null);
  const changeId = useRef(0);
  useEffect(() => {
    const old = previous.current;
    previous.current = { state, simulated };
    if (!connected || old.simulated !== simulated) {
      setImpact(null);
      return;
    }
    const shift = getPartyHealthShift(old.state, state);
    if (shift) {
      changeId.current += 1;
      setImpact({ ...shift, id: changeId.current });
    } else if (state.phase === "lobby") {
      setImpact(null);
    }
  }, [state, simulated, connected]);
  useEffect(() => {
    if (!impact) return;
    const timeout = window.setTimeout(() => setImpact(current => current?.id === impact.id ? null : current), 1400);
    return () => window.clearTimeout(timeout);
  }, [impact]);
  if (!impact) return null;
  return <div key={impact.id} className={"party-impact impact-" + impact.direction}
    aria-label={"Party health " + (impact.delta > 0 ? "increased by " : "decreased by ") + Math.abs(impact.delta)}>
    <div className="party-impact-vignette" aria-hidden="true" />
    <div className="party-impact-number" role="status">
      <b>{impact.delta > 0 ? "+" : "−"}{Math.abs(impact.delta)}</b><span>PARTY HP</span>
    </div>
  </div>;
}
