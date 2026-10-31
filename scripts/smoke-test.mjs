#!/usr/bin/env node
/** Local HTTP integration smoke tests; deliberately never connects to Twitch. */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const appRoot = resolve(root, "apps/web");
const port = 3107;
const webPort = 5177;
const token = "local-test-only-not-a-credential";
const host = "http://127.0.0.1:" + port;
const web = "http://127.0.0.1:" + webPort;
const children = [];
const output = [];

function start(args, cwd, env) {
  const proc = spawn(process.execPath, args, {
    cwd, env: { ...process.env, ...env },
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const capture = (chunk) => {
    output.push(String(chunk).slice(-1500));
    if (output.length > 35) output.shift();
  };
  proc.stdout?.on("data", capture);
  proc.stderr?.on("data", capture);
  children.push(proc);
  return proc;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(url, timeoutMs = 18000) {
  const startAt = Date.now();
  while (Date.now() - startAt < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return response;
    } catch { /* Service not started yet. */ }
    await sleep(250);
  }
  throw new Error("Timed out waiting for " + url + "\n" + output.join("\n"));
}

async function request(path, { method = "GET", body, authorized = false } = {}) {
  const response = await fetch(host + path, {
    method,
    headers: {
      ...(authorized ? { Authorization: "Bearer " + token } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, body: json };
}
const post = (path, body) => request(path, { method: "POST", body, authorized: true });
const chat = (message) => post("/api/demo/chat", { id: "smoke", name: "Smoke [TEST]", message });

function shutdown() {
  for (const proc of children.reverse()) {
    if (!proc.pid || proc.exitCode !== null) continue;
    try {
      if (process.platform !== "win32") process.kill(-proc.pid, "SIGTERM");
      else proc.kill("SIGTERM");
    } catch { /* Process may already have stopped. */ }
  }
}
process.on("SIGINT", () => { shutdown(); process.exitCode = 130; });
process.on("SIGTERM", () => { shutdown(); process.exitCode = 143; });

try {
  start([resolve(root, "node_modules/tsx/dist/cli.mjs"), "apps/server/src/index.ts"], root, {
    PORT: String(port),
    WEB_ORIGIN: web,
    NODE_ENV: "development",
    STREAMER_CONTROL_TOKEN: token,
    TWITCH_CLIENT_ID: "",
    TWITCH_CLIENT_SECRET: "",
    TWITCH_REDIRECT_URI: host + "/auth/twitch/callback"
  });
  const vite = resolve(appRoot, "node_modules/vite/bin/vite.js");
  start([vite, "--host", "127.0.0.1", "--port", String(webPort), "--strictPort"], appRoot, {});
  await Promise.all([waitFor(host + "/health"), waitFor(web + "/")]);
  for (const path of ["/", "/showcase", "/play", "/overlay", "/spectator", "/record", "/recording"]) {
    const response = await waitFor(web + path);
    const html = await response.text();
    assert.match(html, /id="root"/);
  }
  // In a production build, the Node server must serve the public site and SPA routes
  // without opening streamer control endpoints.
  const hostedShowcase = await fetch(host + "/showcase");
  assert.equal(hostedShowcase.status, 200, "Compiled SPA must be served from Node origin");
  assert.match(await hostedShowcase.text(), /id="root"/);
  // OAuth must be started by the authenticated streamer; old GET bookmarks should
  // show the setup dashboard rather than a cryptic missing-credentials page.
  const oauthLegacy = await fetch(host + "/auth/twitch", { redirect: "manual" });
  assert.equal(oauthLegacy.status, 302);
  assert.match(oauthLegacy.headers.get("location") ?? "", /\/dashboard\?setup=twitch/);
  assert.equal((await request("/api/twitch/authorize", {method:"POST"})).status, 401);
  const missingApp = await post("/api/twitch/authorize");
  assert.equal(missingApp.status, 503);
  assert.match(missingApp.body.error, /Twitch setup is incomplete/);
  const stateForSetup = await request("/api/state");
  assert.equal(stateForSetup.body.hostTokenConfigured, true);
  assert.equal(stateForSetup.body.twitch.configured, false);
  const failedCallback = await fetch(host + "/auth/twitch/callback?code=invalid&state=invalid", {redirect:"manual"});
  assert.equal(failedCallback.status,302);
  assert.match(failedCallback.headers.get("location") ?? "", /\/dashboard\?twitch=error/);
  assert.equal((await request("/api/demo/rehearsal", {method:"POST",body:{scene:"finale"}})).status, 401, "Unauthenticated public visitors cannot operate rehearsal state");
  assert.equal((await request("/api/control/start", { method: "POST" })).status, 401, "Streamer controls must require the token");
  assert.equal((await post("/api/control/start")).status, 200);
  assert.equal((await chat("!join")).body.accepted, true);
  const demoReceipt = await request("/api/state");
  assert.equal(demoReceipt.body.activity[0]?.source, "demo");
  assert.equal(demoReceipt.body.activity[0]?.accepted, true);
  assert.ok(!demoReceipt.body.activity.some((entry) => entry.source === "twitch"), "Demo participation must never impersonate Twitch");
  await sleep(825);
  assert.equal((await chat("!role warrior")).body.accepted, true);
  assert.equal((await post("/api/control/advance")).body.phase, "briefing");
  assert.equal((await post("/api/control/advance")).body.phase, "path");
  await sleep(825);
  assert.equal((await chat("!path B")).body.accepted, true);
  assert.equal((await post("/api/control/advance")).body.phase, "encounter");
  await sleep(825);
  assert.equal((await chat("!act attack")).body.accepted, true);
  let outcome = await post("/api/control/advance");
  assert.equal(outcome.body.phase, "consequence");
  assert.ok(outcome.body.lastResolution.attackPower > 0);
  assert.equal((await post("/api/control/advance")).body.phase, "finale");
  await sleep(825);
  assert.equal((await chat("!act attack")).body.accepted, true);
  outcome = await post("/api/control/advance");
  assert.equal(outcome.body.phase, "result");
  assert.equal(outcome.body.progress, 100);
  assert.ok(["victory", "defeat"].includes(outcome.body.result));
  assert.equal((await post("/api/control/reset")).body.phase, "lobby");
  const badPreview = await post("/api/demo/rehearsal", { scene: "untrusted" });
  assert.equal(badPreview.status, 400);
  const preview = await post("/api/demo/rehearsal", { scene: "finale" });
  assert.equal(preview.status, 200);
  const snapshot = await request("/api/state");
  assert.equal(snapshot.body.rehearsalActive, true);
  assert.equal(snapshot.body.phase, "finale");
  assert.ok(Object.values(snapshot.body.players).every((player) => player.name.endsWith("[Demo]")));
  assert.equal((await post("/api/control/reset")).body.phase, "lobby");
  assert.equal((await post("/api/session/auto-advance", { enabled: true })).status, 200);
  assert.equal((await request("/api/state")).body.autoAdvance, true);
  assert.equal((await post("/api/session/auto-advance", { enabled: "not a boolean" })).status, 400);
  console.log("SMOKE TEST PASS: authenticated controls, chat identity, full quest, rehearsal isolation, auto-advance config, dashboard/OBS/spectator/recording HTTP routes.");
} catch (error) {
  console.error("SMOKE TEST FAIL:", error instanceof Error ? error.stack : String(error));
  console.error(output.join("\n"));
  process.exitCode = 1;
} finally {
  shutdown();
}
