import React, { useEffect, useRef, useState } from "react";
import type { QuestState } from "@crowdquest/shared";

type Cue = "start" | "choice" | "encounter" | "boss" | "strike" | "hurt" | "heal" | "victory" | "defeat" | "rally" | "storm";

/** Short original procedural UI sound effects; no downloaded samples, music or external dependencies. */
function tone(ctx: AudioContext, hz: number, delay: number, duration: number, volume: number, wave: OscillatorType = "sine") {
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(Math.max(40, hz), start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.max(0.04, duration));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + Math.max(0.05, duration) + 0.02);
}

function playCue(ctx: AudioContext, cue: Cue) {
  // All tones are gentle and short; the listener must explicitly enable them.
  try {
    switch (cue) {
      case "start":
        tone(ctx, 294, 0, .2, .034); tone(ctx, 392, .12, .26, .038); break;
      case "choice":
        tone(ctx, 440, 0, .17, .028); tone(ctx, 330, .12, .2, .024); break;
      case "encounter":
        tone(ctx, 165, 0, .26, .045, "triangle"); tone(ctx, 110, .15, .24, .03, "sine"); break;
      case "boss":
        tone(ctx, 147, 0, .4, .045, "sawtooth"); tone(ctx, 196, .18, .35, .04, "triangle"); break;
      case "strike":
        tone(ctx, 523, 0, .08, .03, "triangle"); tone(ctx, 311, .07, .15, .033, "sawtooth"); break;
      case "hurt":
        tone(ctx, 220, 0, .18, .033, "sawtooth"); tone(ctx, 165, .10, .16, .025); break;
      case "heal":
        tone(ctx, 392, 0, .17, .025); tone(ctx, 587, .10, .22, .026); break;
      case "victory":
        tone(ctx, 392, 0, .2, .033); tone(ctx, 494, .17, .2, .033); tone(ctx, 659, .35, .4, .042); break;
      case "defeat":
        tone(ctx, 293, 0, .25, .03, "triangle"); tone(ctx, 220, .23, .3, .028); break;
      case "rally":
        tone(ctx, 440, 0, .13, .032); tone(ctx, 660, .14, .17, .03); break;
      case "storm":
        tone(ctx, 110, 0, .28, .043, "sawtooth"); tone(ctx, 146, .16, .3, .04, "triangle"); break;
    }
  } catch {
    // Sound effects are optional; they must never interrupt gameplay.
  }
}

/** Each tab opts in separately. Sound never plays in the automatic OBS overlay. */
export function GameAudioControl({ state }: { state: QuestState }) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);
  const eventRef = useRef({
    phase: state.phase,
    resolution: state.lastResolution?.at ?? null,
    result: state.result,
    event: state.activeEvent
  });

  useEffect(() => {
    const previous = eventRef.current;
    const current = {
      phase: state.phase,
      resolution: state.lastResolution?.at ?? null,
      result: state.result,
      event: state.activeEvent
    };
    eventRef.current = current;
    const ctx = contextRef.current;
    if (!enabledRef.current || !ctx || ctx.state !== "running") return;
    if (current.result && current.result !== previous.result) {
      playCue(ctx, current.result === "victory" ? "victory" : "defeat");
    } else if (current.resolution && current.resolution !== previous.resolution) {
      const resolution = state.lastResolution;
      playCue(ctx, resolution?.damageTaken ? "hurt" : resolution?.healingRestored ? "heal" : "strike");
    } else if (current.phase !== previous.phase) {
      if (current.phase === "roles") playCue(ctx, "start");
      if (current.phase === "path") playCue(ctx, "choice");
      if (current.phase === "encounter") playCue(ctx, "encounter");
      if (current.phase === "finale") playCue(ctx, "boss");
    } else if (current.event && current.event !== previous.event) {
      playCue(ctx, current.event === "rally" ? "rally" : "storm");
    }
  }, [state.phase, state.lastResolution, state.result, state.activeEvent]);

  useEffect(() => {
    return () => { enabledRef.current = false; void contextRef.current?.close().catch(() => undefined); };
  }, []);

  const toggle = async () => {
    if (enabledRef.current) {
      enabledRef.current = false;
      setEnabled(false);
      try { await contextRef.current?.suspend(); } catch { /* optional audio */ }
      return;
    }
    try {
      if (typeof window === "undefined" || !window.AudioContext) throw new Error("Audio is not supported in this browser.");
      const ctx = contextRef.current ?? new window.AudioContext();
      contextRef.current = ctx;
      await ctx.resume();
      enabledRef.current = true;
      setEnabled(true);
      setError("");
      playCue(ctx, "start");
    } catch {
      enabledRef.current = false;
      setEnabled(false);
      setError("Sound could not be enabled. Gameplay will continue normally.");
    }
  };

  return <div className="audio-control">
    <button type="button" aria-label={enabled ? "Mute adventure sounds" : "Enable adventure sounds"} aria-pressed={enabled} className={enabled ? "audio-on" : "audio-off"} onClick={() => void toggle()}>{enabled ? "♪ Sound on" : "♫ Enable sound"}</button>
    {error && <span role="status" className="audio-error">{error}</span>}
  </div>;
}
