import type { QuestState, Role } from "@crowdquest/shared";

const roleOrder: Role[] = ["warrior", "guardian", "healer", "scout"];
/** In-world nameplates are grounded in joined players, not decorative fake heroes. */
export function PartyNameplates({ state, simulated, soloRole = null }: { state: QuestState; simulated: boolean; soloRole?: Role | null }) {
  const players = Object.values(state.players);
  return <g className="party-nameplates" aria-hidden="true">
    {roleOrder.map((role, index) => {
      const members = players.filter(p => p.role === role).sort((a,b) => a.joinedAt - b.joinedAt);
      if (!members.length) return null;
      const leader = members[0];
      const cleanName = leader.name.trim();
      const demo = simulated || cleanName.endsWith("[Demo]");
      const label = cleanName.length > 15 ? cleanName.slice(0, 14) + "…" : cleanName;
      const more = members.length - 1;
      const queued = (state.phase === "encounter" || state.phase === "finale") && members.some(p => Boolean(state.actions[p.id]));
      const x = soloRole === role ? 360 : 156 + index * 126;
      const y = soloRole === role ? 122 : 210;
      return <g key={role} className={"party-nameplate nameplate-" + role + (queued ? " ability-ready" : "")} transform={"translate(" + x + " " + y + ")"}>
        <rect x="-64" y="-16" width="128" height="42" rx="10" fill="#0a0c24" fillOpacity=".87" stroke="#d6bc91" strokeWidth="2"/>
        <path d="M-50 24H50" stroke="#776d8b" strokeWidth="1.5"/>
        <text x="0" y="1" textAnchor="middle" fill="#fff2dc" fontSize="13" fontWeight="900">{label}</text>
        <text x="0" y="17" textAnchor="middle" fill={demo ? "#f0b596" : "#a5ecce"} fontSize="9" fontWeight="800" letterSpacing=".5">{demo ? "DEMO · " + role.toUpperCase() : role.toUpperCase()}{more > 0 ? " · +" + more : ""}</text>
      </g>;
    })}
  </g>;
}
