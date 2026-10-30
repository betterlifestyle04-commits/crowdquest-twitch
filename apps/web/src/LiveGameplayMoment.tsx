import React, { useEffect, useState } from "react";

export type GameplayReceipt = {
  id: string;
  at: number;
  name: string;
  source: "twitch" | "demo";
  command: string;
  accepted: boolean;
};

const commandLabels: Record<string, { icon: string; title: string; detail: string; className: string }> = {
  "!join": { icon: "✧", title: "A hero answers the call", detail: "Joined the expedition", className: "join" },
  "!role": { icon: "♜", title: "A new hero takes their place", detail: "Role selected", className: "role" },
  "!path": { icon: "◇", title: "A vote shapes the journey", detail: "Route vote received", className: "path" },
  "!act attack": { icon: "⚔", title: "Sword readied", detail: "Attack committed", className: "attack" },
  "!act shield": { icon: "⬡", title: "Shield raised", detail: "Defense committed", className: "shield" },
  "!act heal": { icon: "✦", title: "Healing prepared", detail: "Heal committed", className: "heal" },
  "!act scout": { icon: "◈", title: "The shadows are scouted", detail: "Scout action committed", className: "scout" }
};

export function getVisibleGameplayReceipt(
  receipts: GameplayReceipt[],
  options: { now: number; phase: string; transport: "live" | "connecting" | "offline"; maxAgeMs?: number }
): { receipt: GameplayReceipt; label: { icon: string; title: string; detail: string; className: string }; ageMs: number } | null {
  if (options.transport !== "live" || options.phase === "result" || options.phase === "consequence") return null;
  const maxAgeMs = options.maxAgeMs ?? 4500;
  const validCommand = (command: string) =>
    Object.prototype.hasOwnProperty.call(commandLabels, command) ||
    /^!role (warrior|guardian|healer|scout)$/.test(command) ||
    /^!path [ab]$/.test(command);
  const latest = receipts.filter(entry => {
    const age = options.now - entry.at;
    return entry.accepted && entry.at > 0 && age >= -1000 && age < maxAgeMs &&
      validCommand(entry.command.trim().toLowerCase());
  }).sort((a, b) => b.at - a.at)[0];
  if (!latest) return null;
  const normalized = latest.command.trim().toLowerCase();
  const key = normalized.startsWith("!role ") ? "!role" : normalized.startsWith("!path ") ? "!path" : normalized;
  const label = commandLabels[key];
  if (!label) return null;
  if (options.phase === "lobby" && key !== "!join") return null;
  if (options.phase === "roles" && key !== "!role" && key !== "!join") return null;
  if (options.phase === "path" && key !== "!path") return null;
  if ((options.phase === "encounter" || options.phase === "finale") && !key.startsWith("!act")) return null;
  if (options.phase === "briefing") return null;
  return { receipt: latest, label, ageMs: Math.max(0, options.now - latest.at) };
}

/** Short-lived and source-labeled: only accepted, actual server-recorded commands. */
export function LiveGameplayMoment({ receipts, phase, transport, simulated }: {
  receipts: GameplayReceipt[];
  phase: string;
  transport: "live" | "connecting" | "offline";
  simulated: boolean;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, []);
  const visible = getVisibleGameplayReceipt(receipts, { now, phase, transport });
  if (!visible) return null;
  const { receipt, label } = visible;
  const sourceName = simulated || receipt.source === "demo" ? "SIMULATED DEMO" : "TWITCH CHAT";
  const verb = label.className === "role" ? receipt.command.slice(6).toUpperCase() :
               label.className === "path" ? "ROUTE " + receipt.command.slice(-1).toUpperCase() :
               label.detail;
  return <div key={receipt.id} className={"live-gameplay-moment moment-" + label.className} role="status" aria-live="off" aria-label={sourceName + ": " + receipt.name + " — " + verb}>
    <span className="moment-emblem" aria-hidden="true">{label.icon}</span>
    <div className="moment-content">
      <span className="moment-provenance">{sourceName} · COMMAND ACCEPTED</span>
      <b>{label.title}</b>
      <span className="moment-name">{receipt.name} <i>·</i> {verb}</span>
    </div>
  </div>;
}
