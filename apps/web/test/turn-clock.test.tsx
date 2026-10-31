import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTurnClock, TurnClock } from "../src/TurnClock";

describe("real server-deadline turn clock", () => {
  it("only appears during interactive phases", () => {
    for (const phase of ["lobby", "briefing", "consequence", "result"] as const) {
      expect(getTurnClock(phase, 12000, 30, false, 10000)).toBeNull();
    }
    for (const phase of ["roles", "path", "encounter", "finale"] as const) {
      expect(getTurnClock(phase, 12000, 30, false, 10000)?.seconds).toBe(2);
    }
  });
  it("uses actual deadlines and respects pause and no deadline states", () => {
    expect(getTurnClock("encounter", 52000, 30, false, 20000)).toMatchObject({ status: "active", seconds: 32, progress: 100 });
    expect(getTurnClock("encounter", 40000, 30, false, 32500)).toMatchObject({ status: "urgent", seconds: 8, progress: 25 });
    expect(getTurnClock("finale", 30000, 30, false, 40000)).toMatchObject({ status: "urgent", seconds: 0, progress: 0 });
    expect(getTurnClock("path", null, 30, true, 40000)).toMatchObject({ status: "paused", seconds: null });
    expect(getTurnClock("path", null, 30, false, 40000)).toMatchObject({ status: "waiting", seconds: null });
  });
  it("renders legible true timer labels without fake time in paused state", () => {
    const active = renderToStaticMarkup(createElement(TurnClock, {
      phase: "finale", endsAt: 75000, durationSeconds: 30, paused: false, now: 60000
    }));
    expect(active).toContain("FINAL TURN");
    expect(active).toContain("15s");
    const paused = renderToStaticMarkup(createElement(TurnClock, {
      phase: "finale", endsAt: null, durationSeconds: 30, paused: true, now: 60000
    }));
    expect(paused).toContain("QUEST PAUSED");
    expect(paused).not.toContain("15s");
  });
});
