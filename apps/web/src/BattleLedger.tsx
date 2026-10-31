import type { BattleResolution, HistoryItem } from "@crowdquest/shared";

export type BattleLedgerData = {
  heading: string;
  attack: number;
  blocked: number;
  restored: number;
  damage: number;
  players: number;
  synergy: string | null;
};

export function getBattleLedgerData(resolution: BattleResolution): BattleLedgerData {
  const attack = Math.max(0, resolution.attackPower);
  const blocked = Math.max(0, resolution.shieldAbsorbed);
  const restored = Math.max(0, resolution.healingRestored);
  const damage = Math.max(0, resolution.damageTaken);
  const players = Math.max(0, resolution.participants);
  const tags: string[] = [];
  if (resolution.scoutBoost > 0) tags.push("Scout assisted +" + resolution.scoutBoost);
  if (resolution.companionPower > 0) tags.push("Spirit assisted +" + resolution.companionPower);
  return {
    heading: resolution.phase === "finale" ? "FINAL BATTLE REPORT" : "TRIAL BATTLE REPORT",
    attack, blocked, restored, damage, players,
    synergy: tags.length ? tags.join(" · ") : null
  };
}

/** Only present confirmed battle-resolution numbers; never a speculative enemy HP meter. */
export function BattleLedger({ resolution, compact = false }: { resolution: BattleResolution; compact?: boolean }) {
  const data = getBattleLedgerData(resolution);
  return <div className={"battle-ledger " + (compact ? "battle-ledger-compact" : "")}
    aria-label={data.heading + ", server-resolved combat statistics"}>
    <div className="battle-ledger-heading"><span aria-hidden="true">✥</span><strong>{data.heading}</strong><small>{data.players} {data.players === 1 ? "ACTION" : "ACTIONS"}</small></div>
    <div className="battle-ledger-tiles">
      {[
        {symbol:"⚔", label:"ATTACK", amount:data.attack, cls:"attack"},
        {symbol:"⬡", label:"BLOCKED", amount:data.blocked, cls:"blocked"},
        {symbol:"✦", label:"HEALED", amount:data.restored, cls:"healed"},
        {symbol:"☄", label:"DAMAGE", amount:data.damage, cls:"damage"}
      ].map(row=><div key={row.label} className={"battle-ledger-stat stat-"+row.cls}>
        <span aria-hidden="true">{row.symbol}</span><b>{row.amount}</b><small>{row.label}</small>
      </div>)}
    </div>
    {data.synergy && <div className="battle-ledger-synergy"><span aria-hidden="true">✧</span>{data.synergy}</div>}
    {data.players === 0 && <p className="battle-ledger-empty">No player actions were received before resolution.</p>}
  </div>;
}

/** Latest real in-memory game history, ordered and bounded for reliable viewing. */
export function QuestChronicle({ history, simulated = false, limit = 5 }: {
  history: HistoryItem[]; simulated?: boolean; limit?: number;
}) {
  const events = [...history].filter(item=>Number.isFinite(item.at)).sort((a,b)=>b.at-a.at).slice(0,Math.max(0,limit));
  return <div className="quest-chronicle" aria-label={simulated?"Simulated quest chronicle":"Quest chronicle"}>
    {simulated && <p className="quest-chronicle-demo">SIMULATED SHOWCASE</p>}
    {events.length ? <ol>{events.map((event,index)=><li key={event.id}>
      <span className={"chronicle-marker " + (index === 0 ? "latest" : "")} aria-hidden="true">{index === 0 ? "✦" : "◆"}</span>
      <div><span className="chronicle-event-label">{index===0?"LATEST CHAPTER EVENT":"QUEST EVENT"}</span><p>{event.text}</p></div>
    </li>)}</ol> : <p className="chronicle-empty">The story begins when the host starts the quest.</p>}
  </div>;
}
