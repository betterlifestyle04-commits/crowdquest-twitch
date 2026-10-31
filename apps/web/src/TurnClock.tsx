import { useEffect, useState, type CSSProperties } from "react";
import type { Phase } from "@crowdquest/shared";

const interactive = new Set<Phase>(["roles", "path", "encounter", "finale"]);

export function getTurnClock(
  phase: Phase,
  endsAt: number | null,
  durationSeconds: number,
  paused: boolean,
  now: number
): { status: "paused" | "waiting" | "active" | "urgent"; seconds: number | null; progress: number } | null {
  if (!interactive.has(phase)) return null;
  if (paused) return { status: "paused", seconds: null, progress: 0 };
  if (endsAt === null) return { status: "waiting", seconds: null, progress: 0 };
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const progress = Math.max(0, Math.min(100, (endsAt - now) / Math.max(1, durationSeconds * 1000) * 100));
  return { status: seconds <= 10 ? "urgent" : "active", seconds, progress };
}

/** Game-world phase timer, displaying server deadline (not a fabricated animation timer). */
export function TurnClock({ phase, endsAt, durationSeconds, paused, now: suppliedNow }: {
  phase: Phase;
  endsAt: number | null;
  durationSeconds: number;
  paused: boolean;
  now?: number;
}) {
  const [clientNow, setClientNow] = useState(() => Date.now());
  useEffect(() => {
    if (suppliedNow !== undefined) return;
    const id = window.setInterval(() => setClientNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [suppliedNow]);
  const clock = getTurnClock(phase, endsAt, durationSeconds, paused, suppliedNow ?? clientNow);
  if (!clock) return null;
  const label = phase === "roles" ? "MUSTER CLOSES" : phase === "path" ? "VOTE CLOSES" : phase === "encounter" ? "TRIAL CLOSES" : "FINAL TURN";
  const style = { "--turn-pct": clock.progress + "%" } as CSSProperties;
  return <div className={"turn-clock turn-clock-" + clock.status} style={style} role="timer" aria-live="off" aria-label={clock.status === "paused" ? "Quest paused" : clock.status === "waiting" ? "Waiting for phase timer" : label + " in " + clock.seconds + " seconds"}>
    <span className="turn-clock-orbit" aria-hidden="true"><i>{clock.status === "paused" ? "Ⅱ" : clock.status === "waiting" ? "…": "⌛"}</i></span>
    <span className="turn-clock-copy"><small>{clock.status === "paused" ? "QUEST PAUSED" : clock.status === "waiting" ? "WAITING FOR HOST" : label}</small><b>{clock.seconds !== null ? String(clock.seconds).padStart(2, "0") + "s" : "—"}</b></span>
  </div>;
}
