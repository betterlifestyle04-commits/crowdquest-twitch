import { config as loadEnv } from "dotenv"; import express, { type NextFunction, type Request, type Response } from "express"; import cors from "cors"; import { createServer } from "node:http"; import { Server } from "socket.io"; import { z } from "zod"; import { fileURLToPath } from "node:url"; import { resolve } from "node:path"; import crypto from "node:crypto";
import { applyChatCommand, advance, begin, initialState, makeRehearsal, triggerEvent, type Difficulty, type QuestState } from "@crowdquest/shared";
import { TwitchClient } from "./twitch.js";
loadEnv({ path: resolve(fileURLToPath(new URL("../../../.env", import.meta.url))) });
const port = Number(process.env.PORT ?? 3001); const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
const origins = origin.split(",").map((value) => value.trim()).filter(Boolean); const controlToken = process.env.STREAMER_CONTROL_TOKEN; const protectControls = process.env.NODE_ENV === "production" || Boolean(controlToken);
const app = express(); app.use(cors({ origin: origins, credentials: true })); app.use(express.json({ limit: "20kb" })); const http = createServer(app); const io = new Server(http, { cors: { origin: origins, credentials: true } });
let settings: { difficulty: Difficulty; phaseDurationSeconds: number } = { difficulty: "standard", phaseDurationSeconds: 30 }; let state: QuestState = initialState(20261102, settings); let rehearsalActive = false; let paused = false; let pausedRemainingMs: number | null = null; let eventCooldownUntil = 0; const rate = new Map<string, number>();
type ActivityEvent = { id: string; at: number; name: string; source: "twitch" | "demo"; command: string; accepted: boolean; feedback: string };
let activity: ActivityEvent[] = [];
let activitySeq = 0;
const trackedCommands = new Set(["!join", "!role", "!path", "!act"]);
function recordActivity(name: string, text: string, accepted: boolean, feedback: string, source: ActivityEvent["source"]) {
  const verb = text.trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (!trackedCommands.has(verb)) return;
  const commandLabel = text.trim().replace(/\s+/g, " ").slice(0, 48);
  const cleanName = name.replace(/[\r\n\t]/g, " ").slice(0, 28);
  activity = [{ id: String(++activitySeq), at: Date.now(), name: cleanName, source, command: commandLabel, accepted, feedback: feedback.slice(0, 140) }, ...activity].slice(0, 24);
}
const durationMs = () => settings.phaseDurationSeconds * 1000; const emit = () => io.emit("state", { ...state, paused, rehearsalActive, activity, controlsProtected: protectControls, twitch: twitch.status() });
function handleCommand(userId: string, name: string, text: string): { accepted: boolean; feedback: string } {
  const source: ActivityEvent["source"] = userId.startsWith("demo:") ? "demo" : "twitch";
  const verb = text.trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (!trackedCommands.has(verb)) return { accepted: false, feedback: "Not a CrowdQuest command." };
  if (rehearsalActive && source === "twitch") return { accepted: false, feedback: "Simulated rehearsal is active. Reset to return to live chat." };
  const at = Date.now();
  const previous = rate.get(userId) ?? 0;
  if (previous > at - 800) {
    const result = { accepted: false, feedback: "Too fast. Wait one second between commands." };
    recordActivity(name, text, false, result.feedback, source);
    emit();
    return result;
  }
  const result = applyChatCommand(state, userId, name, text);
  recordActivity(name, text, result.accepted, result.feedback, source);
  if (result.accepted) { rate.set(userId, at); state = result.state; }
  emit();
  return { accepted: result.accepted, feedback: result.feedback };
}
const twitch = new TwitchClient({ clientId: process.env.TWITCH_CLIENT_ID ?? "", clientSecret: process.env.TWITCH_CLIENT_SECRET ?? "", redirectUri: process.env.TWITCH_REDIRECT_URI ?? `http://localhost:${port}/auth/twitch/callback` }, handleCommand, () => emit());
function requireStreamer(req: Request, res: Response, next: NextFunction) { if (!protectControls) return next(); const expected = `Bearer ${controlToken}`; const received = req.header("authorization"); if (!controlToken || !received || received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return res.status(401).json({ error: "Streamer authorization required" }); next(); }
app.get("/health", (_req, res) => res.json({ ok: true })); app.get("/api/state", (_req, res) => res.json({ ...state, paused, rehearsalActive, activity, twitch: twitch.status(), controlsProtected: protectControls }));
app.post("/api/control/:command", requireStreamer, (req, res) => { const control = req.params.command; if (control === "start") { paused = false; state = begin(state, durationMs()); } else if (control === "advance") { paused = false; state = advance(state, durationMs()); } else if (control === "pause") { if (!state.phaseEndsAt) return res.status(409).json({ error: "This phase cannot be paused" }); pausedRemainingMs = Math.max(0, state.phaseEndsAt - Date.now()); state = { ...state, phaseEndsAt: null }; paused = true; } else if (control === "resume") { if (!paused || pausedRemainingMs === null) return res.status(409).json({ error: "Quest is not paused" }); state = { ...state, phaseEndsAt: Date.now() + pausedRemainingMs }; paused = false; pausedRemainingMs = null; } else if (control === "reset") { paused = false; pausedRemainingMs = null; state = initialState(state.seed + 1, settings); rehearsalActive = false; rate.clear(); activity = []; activity = []; } else return res.status(400).json({ error: "Unknown control" }); emit(); res.json(state); });
app.post("/api/session/settings", requireStreamer, (req, res) => { if (state.phase !== "lobby" && state.phase !== "result") return res.status(409).json({ error: "Settings can only change between quests" }); const body = z.object({ difficulty: z.enum(["relaxed", "standard", "heroic"]), phaseDurationSeconds: z.number().int().min(10).max(120) }).safeParse(req.body); if (!body.success) return res.status(400).json({ error: "Invalid session settings" }); settings = body.data; paused = false; pausedRemainingMs = null; state = initialState(state.seed, settings); rehearsalActive = false; rate.clear(); emit(); res.json(state); });
app.post("/api/session/event", requireStreamer, (req, res) => { if (Date.now() < eventCooldownUntil) return res.status(429).json({ error: "Special events have a 15 second cooldown" }); const body = z.object({ event: z.enum(["rally", "emberstorm"]) }).safeParse(req.body); if (!body.success) return res.status(400).json({ error: "Invalid special event" }); const next = triggerEvent(state, body.data.event); if (next === state) return res.status(409).json({ error: "Special events require an active quest" }); state = next; eventCooldownUntil = Date.now() + 15000; emit(); res.json(state); });
app.post("/api/demo/chat", requireStreamer, (req, res) => { const body = z.object({ id: z.string().min(1).max(64), name: z.string().min(1).max(25), message: z.string().max(80) }).safeParse(req.body); if (!body.success) return res.status(400).json({ error: "Invalid demo input" }); const outcome = handleCommand(`demo:${body.data.id}`, `${body.data.name} [Demo]`, body.data.message); res.status(outcome.accepted ? 200 : 422).json(outcome); });
app.post("/api/demo/rehearsal", requireStreamer, (req, res) => {
  const parsed = z.object({ scene: z.enum(["encounter", "finale", "result"]) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Select encounter, finale, or result" });
  const nextSeed = state.seed + 1;
  state = makeRehearsal(parsed.data.scene, nextSeed, { ...settings, phaseDurationSeconds: 120 });
  rehearsalActive = true;
  paused = false;
  pausedRemainingMs = null;
  eventCooldownUntil = 0;
  rate.clear();
  activity = [{ id: String(++activitySeq), at: Date.now(), name: "Showcase Studio", source: "demo", command: "!join", accepted: true, feedback: "A simulated four-player " + parsed.data.scene + " preview was loaded." }];
  emit();
  res.json({ accepted: true, mode: "SIMULATED", scene: parsed.data.scene });
});
app.get("/auth/twitch", (_req, res) => { try { res.redirect(twitch.authorizeUrl()); } catch (error) { res.status(503).send(error instanceof Error ? error.message : "Twitch credentials are not configured"); } });
app.get("/auth/twitch/callback", async (req, res) => { try { await twitch.callback(String(req.query.code ?? ""), String(req.query.state ?? "")); res.redirect(`${origin}/?twitch=authorized`); } catch (error) { res.status(400).send(`Twitch connection failed: ${error instanceof Error ? error.message : "unknown error"}`); } });
io.on("connection", (socket) => socket.emit("state", { ...state, paused, rehearsalActive, activity, controlsProtected: protectControls, twitch: twitch.status() }));
setInterval(() => { if (!paused && state.phase !== "lobby" && state.phase !== "result" && state.phaseEndsAt && Date.now() >= state.phaseEndsAt) { state = advance(state, durationMs()); emit(); } }, 500);
http.listen(port, () => console.log(`CrowdQuest server on http://localhost:${port}`));
