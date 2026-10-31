#!/usr/bin/env node
/** Checks the actually deployed Render URL, never uses streamer credentials or mutates game state. */
import assert from "node:assert/strict";

const base = (process.env.CROWDQUEST_PUBLIC_URL ?? "https://crowdquest-ember-gate.onrender.com").replace(/\/$/, "");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function get(path, init = {}) {
  return fetch(base + path, { signal: AbortSignal.timeout(20000), redirect: "follow", ...init });
}
async function waitUntilReady() {
  let last = "No response";
  for (let i = 0; i < 28; i++) {
    try {
      const r = await get("/health");
      if (r.ok && (await r.json()).ok === true) return;
      last = "/health returned HTTP " + r.status;
    } catch (e) {
      last = String(e).slice(0, 400);
    }
    if (i < 27) await sleep(10000);
  }
  throw new Error("Hosted CrowdQuest did not become ready: " + last);
}
async function run() {
  console.log("Testing public CrowdQuest website:", base);
  await waitUntilReady();
  console.log("PASS live /health");
  let indexHTML = "";
  const routes = ["/", "/showcase", "/play", "/dashboard", "/spectator", "/record", "/recording", "/overlay"];
  for (const path of routes) {
    const r = await get(path);
    assert.equal(r.status, 200, path + " status");
    assert.match(r.headers.get("content-type") ?? "", /html/i, path + " should be HTML");
    const html = await r.text();
    assert.match(html, /id=["']root["']/i, path + " should mount React");
    if (path === "/") indexHTML = html;
    console.log("PASS HTTP 200 " + path);
  }
  const assets = [...indexHTML.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(x=>x[1]);
  assert.ok(assets.some(p=>p.endsWith(".js")), "Production index must include bundled JS");
  assert.ok(assets.some(p=>p.endsWith(".css")), "Production index must include bundled CSS");
  for (const path of assets) {
    const r = await get(path);
    assert.equal(r.status, 200, "Bundled asset " + path);
    const size = (await r.arrayBuffer()).byteLength;
    assert.ok(size > 100, "Bundled asset appears empty: " + path);
    console.log("PASS asset", path, size + " bytes");
  }
  const stateResponse = await get("/api/state");
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.controlsProtected, true, "Production streamer controls must be protected");
  assert.equal(typeof state.hostTokenConfigured, "boolean", "Streamer token readiness must be explicit");
  assert.equal(typeof state.twitch?.configured, "boolean", "Twitch configuration status must be available");
  assert.equal(state.rehearsalActive, false, "Public gallery must not silently alter the real backend quest");
  console.log("PASS public state reports protected controls and explicit Twitch setup readiness");
  for (const path of ["/api/control/start", "/api/demo/rehearsal", "/api/session/settings", "/api/twitch/authorize"]) {
    const r = await get(path, {method:"POST", headers:{"Content-Type":"application/json"},body:"{}"});
    assert.equal(r.status, 401, path + " must reject unauthenticated mutation");
    console.log("PASS unauthorized HTTP 401 " + path);
  }
  console.log("PASS: live site routes, production JS/CSS, API state, and control security");
}
run().catch(e=>{ console.error("PUBLIC-SITE CHECK FAILED:",e);process.exitCode=1; });
