import type { Action, QuestState, Role } from "@crowdquest/shared";

const required: Record<Role, Action> = {
  warrior: "attack", guardian: "shield", healer: "heal", scout: "scout"
};

export type TacticalDisplay = {
  healthPct: number;
  threatPct: number;
  healthLabel: string;
  threatLabel: string;
  supplies: number;
  status: "critical" | "wounded" | "steady";
  combo: "full" | "reveal" | "none";
  headline: string;
  detail: string;
};

export function getTacticalDisplay(state: QuestState): TacticalDisplay {
  const healthPct = Math.max(0, Math.min(100, state.health / Math.max(1, state.maxHealth) * 100));
  // The 30-point display scale is a visual reference, not enemy HP or a threat limit.
  const threatPct = Math.max(0, Math.min(100, state.threat / 30 * 100));
  const status = healthPct <= 28 ? "critical" : healthPct <= 55 ? "wounded" : "steady";
  const isBattle = state.phase === "encounter" || state.phase === "finale";
  const actions = new Set<Action>();
  if (isBattle) {
    for (const player of Object.values(state.players)) {
      if (player.role && state.actions[player.id] === required[player.role]) actions.add(required[player.role]);
    }
  }
  const combo = actions.size === 4 ? "full" : actions.has("attack") && actions.has("scout") ? "reveal" : "none";
  const headline = combo === "full" ? "FULL FORMATION ARMED" :
    combo === "reveal" ? "SCOUT + WARRIOR COMBO" :
    isBattle ? "BUILD YOUR PARTY COMBO" : "THE PARTY'S RESOURCES";
  const detail = combo === "full" ? "Four different role actions committed · formation reduces encounter danger" :
    combo === "reveal" ? "Scout insight will amplify the Warrior attack at resolution" :
    isBattle ? "Prepare matching role abilities to unlock synergies" :
    "Your shared health, supplies and growing gate threat";
  return {
    healthPct,
    threatPct,
    healthLabel: state.health + " / " + state.maxHealth,
    threatLabel: String(state.threat),
    supplies: state.supplies,
    status,
    combo,
    headline,
    detail
  };
}

/** High-visibility game HUD with no fabricated enemy HP, combat damage or resources. */
export function TacticalStatus({ state }: { state: QuestState }) {
  const model = getTacticalDisplay(state);
  const battle = state.phase === "encounter" || state.phase === "finale";
  return <div className={"tactical-status tactical-" + model.status + " tactical-combo-" + model.combo}
    aria-label="Live party health, threat, supplies and teamwork">
    <div className="tactical-vitals">
      <div className="tactical-health" aria-label={"Party health " + model.healthLabel}>
        <div className="tactical-meter-top"><span><b aria-hidden="true">♥</b> PARTY HP</span><strong>{model.healthLabel}</strong></div>
        <div className="tactical-track"><i style={{width:model.healthPct+"%"}}/></div>
      </div>
      <div className="tactical-threat" aria-label={"Gate threat " + model.threatLabel + ", bar uses a 30 point display scale"}>
        <div className="tactical-meter-top"><span><b aria-hidden="true">☄</b> GATE THREAT</span><strong>{model.threatLabel}</strong></div>
        <div className="tactical-track"><i style={{width:model.threatPct+"%"}}/></div>
      </div>
      <div className="tactical-supplies" aria-label={"Shared healing supplies " + model.supplies}>
        <span aria-hidden="true">▣</span>
        <strong>{model.supplies}</strong>
        <small>SUPPLIES</small>
      </div>
    </div>
    {battle && <div className={"tactical-combo-line" + (model.combo !== "none" ? " combo-ready" : "")}
      aria-label={model.headline + ". " + model.detail}>
      <span className="tactical-combo-icon" aria-hidden="true">{model.combo === "full" ? "✥" : model.combo === "reveal" ? "◈" : "◇"}</span>
      <div><b>{model.headline}</b><small>{model.detail}</small></div>
      {model.combo !== "none" && <span className="tactical-armed">READY</span>}
    </div>}
  </div>;
}
