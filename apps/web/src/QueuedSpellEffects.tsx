import type { Action, QuestState, Role } from "@crowdquest/shared";

const roleAction: Record<Role, Action> = {
  warrior: "attack", guardian: "shield", healer: "heal", scout: "scout"
};
const order: Role[] = ["warrior", "guardian", "healer", "scout"];

/** Readied ability effects only. Actual damage/heals are displayed after server resolution. */
export function QueuedSpellEffects({ state }: { state: QuestState }) {
  if (state.phase !== "encounter" && state.phase !== "finale") return null;
  const players = Object.values(state.players);
  const active = order.filter(role =>
    players.some(player => player.role === role && state.actions[player.id] === roleAction[role])
  );
  if (active.length === 0) return null;
  return <g className="queued-spell-effects" aria-hidden="true">
    {active.map((role) => {
      const i = order.indexOf(role);
      const x = 156 + i * 126;
      return <g key={role} className={"queued-spell queued-spell-" + role} transform={"translate(" + x + " 340)"}>
        <ellipse className="spell-ground" cx="0" cy="88" rx="63" ry="16" fill="none" strokeWidth="3" strokeDasharray="6 8"/>
        {role === "warrior" && <g className="spell-warrior-sigil">
          <path d="M-29 -28 L18 -98 L28 -102 L24 -88 L-19 -19" fill="none" stroke="#ffcf90" strokeWidth="8" strokeLinecap="round"/>
          <path d="M-30 -15 Q2 -69 49 -48" fill="none" stroke="#fff4ce" strokeWidth="5" strokeLinecap="round"/>
          <path d="M-40 -8 L-15 -3" stroke="#f59b6e" strokeWidth="7"/>
          <circle cx="36" cy="-76" r="6" fill="#ffddad"/>
        </g>}
        {role === "guardian" && <g className="spell-guardian-sigil">
          <path d="M-39 -63 Q0 -90 39 -63 L35 -5 Q23 18 0 32 Q-27 17 -35 -5Z" fill="#72c8f5" fillOpacity=".15" stroke="#b7eaff" strokeWidth="5"/>
          <path d="M0 -68 V21 M-26 -20 H26" stroke="#effbff" strokeWidth="5" strokeLinecap="round"/>
          <ellipse cx="0" cy="-25" rx="51" ry="66" fill="none" stroke="#8fcef5" strokeWidth="2" strokeDasharray="8 8"/>
        </g>}
        {role === "healer" && <g className="spell-healer-sigil">
          <circle cx="0" cy="-40" r="53" fill="#9affcf" fillOpacity=".14" stroke="#b7ffdf" strokeWidth="3"/>
          <path d="M0 -74 V-6 M-34 -40 H34" stroke="#e1ffdc" strokeWidth="12" strokeLinecap="round"/>
          <path d="M-46 -86 L-52 -98 M49 -7 L57 -1 M-64 -37 L-77 -37" fill="none" stroke="#bcffe0" strokeWidth="4" strokeLinecap="round"/>
        </g>}
        {role === "scout" && <g className="spell-scout-sigil">
          <path d="M-67 -44 Q0 -113 67 -44 Q0 30 -67 -44Z" fill="#8feee3" fillOpacity=".14" stroke="#b1fff0" strokeWidth="4"/>
          <circle cx="0" cy="-44" r="24" fill="none" stroke="#c2ffef" strokeWidth="5"/>
          <circle cx="0" cy="-44" r="9" fill="#c9ffee"/>
          <path d="M-83 -44 H-60 M61 -44 H84 M0 -120 V-94 M0 7 V30" stroke="#a9f4e5" strokeWidth="3" strokeLinecap="round"/>
        </g>}
        <g className="spell-bits">
          <circle cx="-33" cy="-89" r="4" />
          <circle cx="48" cy="-67" r="3" />
          <circle cx="-48" cy="13" r="3" />
          <circle cx="16" cy="19" r="4" />
        </g>
      </g>;
    })}
  </g>;
}
