import type { BattleResolution, Encounter } from "@crowdquest/shared";

/** Original SVG encounters. All rendered outcomes originate from the shared quest engine. */
type FoeProps = { encounter: Encounter | null; boss: boolean };

function BridgeHazard() {
  return <g className="foe-bridge-hazard">
    <ellipse cx="0" cy="66" rx="115" ry="14" fill="#080f1c" opacity=".68" />
    <path d="M-124 24 -77 -4 -25 10 31 -15 110 13 109 45 47 19 3 53 -48 20 -113 61Z" fill="#71627b" stroke="#cdbca6" strokeWidth="7" strokeLinejoin="round" />
    <path d="M-110 23 -76 -4 -42 17 -20 4 5 52 M5 -3 26 24 47 19 58 -9 M68 17 102 15" stroke="#2c2339" strokeWidth="6" fill="none" />
    <path d="M-124 24 -135 -39 M109 13 123 -41" stroke="#c0a083" strokeWidth="9" strokeLinecap="round" />
    <path d="M-136 -39 Q-6 -98 123 -41" fill="none" stroke="#e0ba83" strokeWidth="5" />
    <g className="falling-rubble" fill="#e9a56b" stroke="#5b3c43" strokeWidth="2">
      <path d="M-42 55 -27 52 -15 72 -40 81Z"/>
      <path d="M44 54 61 47 70 66 52 75Z"/>
      <path d="M-4 60 8 54 20 78 0 83Z"/>
    </g>
    <path d="M-68 -27 0 -63 64 -24" fill="none" stroke="#ffcc84" strokeWidth="4" strokeDasharray="5 9" />
    <text x="0" y="-72" textAnchor="middle" fontSize="16" fontWeight="900" fill="#ffe1a4" stroke="#39233d" strokeWidth="3" paintOrder="stroke">FALLING SPAN</text>
  </g>;
}

function Raiders() {
  return <g className="foe-raiders">
    <ellipse cx="0" cy="65" rx="95" ry="14" fill="#080d18" opacity=".7" />
    {[-63, 57].map((x, i) => <g key={x} transform={"translate(" + x + " " + (i ? -6 : 4) + ") scale(.83)"}>
      <path d="M-24 20 -31 60 29 60 20 20 -25 -28 26 -28Z" fill={i ? "#3c2d58" : "#5a3647"} stroke="#c58980" strokeWidth="5"/>
      <path d="M-22 -32 -17 -74 5 -89 24 -72 20 -31Z" fill="#99899a" stroke="#dfc1aa" strokeWidth="4"/>
      <path d="M-22 -58 22 -58" stroke="#201c32" strokeWidth="8"/>
      <path d="M17 -13 45 -84" stroke="#d0e5e8" strokeWidth="7"/>
    </g>)}
    <g className="raider-leader">
      <path d="M-40 53 -33 -17 -20 -46 22 -46 40 -17 33 53Z" fill="#52344e" stroke="#efb281" strokeWidth="7"/>
      <path d="M-24 -50 -29 -95 -13 -117 12 -117 32 -95 23 -50Z" fill="#ccb4a9" stroke="#59384b" strokeWidth="6"/>
      <path d="M-28 -79 27 -79" stroke="#2e253e" strokeWidth="9"/>
      <path d="M-12 -76 -6 -76 0 -62Z M6 -76 12 -76 4 -62Z" fill="#ffac80"/>
      <path d="M30 -21 61 -120 72 -139 74 -116 43 -13" fill="#b9d3dd" stroke="#e8e5df" strokeWidth="3"/>
      <path d="M23 -30 53 -22" stroke="#e4b37e" strokeWidth="10" strokeLinecap="round"/>
      <path d="M-35 -15 -74 -17 -66 26 -41 44 -22 25Z" fill="#974a51" stroke="#e5b681" strokeWidth="6"/>
      <path d="M-51 -12 -49 27 M-64 7 -35 9" stroke="#f4c890" strokeWidth="5"/>
    </g>
  </g>;
}

function Stalker() {
  return <g className="foe-stalker">
    <ellipse cx="0" cy="62" rx="104" ry="17" fill="#060b1c" opacity=".7"/>
    <path className="stalker-tail" d="M65 -18 Q133 -123 156 -70 Q173 -26 141 -14" fill="none" stroke="#506880" strokeWidth="24" strokeLinecap="round"/>
    <path d="M-66 -49 Q-32 -80 35 -63 L82 -15 73 25 34 37 -33 28 -84 -3Z" fill="#323c60" stroke="#779cb7" strokeWidth="7"/>
    <path d="M-53 10 -80 57 -51 59 -21 30 M51 10 67 57 94 55 77 4" stroke="#364a64" strokeWidth="23" strokeLinecap="round"/>
    <path d="M-77 -42 -117 -91 -116 -30 -129 1 Q-122 22 -76 23 L-38 -10Z" fill="#293650" stroke="#81acd1" strokeWidth="6"/>
    <path d="M-115 -81 -102 -30 -92 -59" fill="#a07bc1"/>
    <path d="M-130 -49 -145 -79 -144 -14 -128 0" fill="#4d547c" stroke="#84a8d4" strokeWidth="5"/>
    <path className="stalker-eyes" d="M-125 -9 -110 -14 -118 1Z M-97 -13 -84 -18 -87 -3Z" fill="#9af8e0"/>
    <path d="M-123 20 -113 29 -102 22 -91 31 -81 19" stroke="#ddc4dd" strokeWidth="4" fill="none"/>
    <g stroke="#d7d8ef" strokeWidth="4" strokeLinecap="round"><path d="M-80 56 -86 66 M-68 56 -72 68 M66 56 65 68 M84 55 89 65"/></g>
    <path className="stalker-moon" d="M0 -104 A27 27 0 1 0 18 -53 A22 22 0 1 1 0 -104Z" fill="#a7f4ec" opacity=".7"/>
  </g>;
}

function Wraith({ boss }: { boss: boolean }) {
  return <g className={"cinema-monster " + (boss ? "overlord" : "wraith")}>
    <ellipse cx="0" cy="60" rx={boss ? 101 : 70} ry="18" fill="#15091b" opacity=".8" />
    <g className="monster-body">
      <path d={boss ? "M-66 47 Q-100 -12 -57 -95 L-84 -159 -29 -128 -13 -185 17 -133 67 -167 58 -96 Q103 -18 64 47 L27 26 0 63 -27 26Z" : "M-47 51 Q-86 -24 -40 -101 L-14 -129 17 -116 43 -83 Q75 -15 47 50 L23 28 0 57 -25 28Z"} fill="url(#monsterBody)" stroke="#ff9e68" strokeWidth="4"/>
      <path d="M-45 -36 Q0 -62 44 -36" fill="none" stroke="#f1a275" strokeWidth="4" opacity=".45" />
      <path d="M-29 -60 0 -46 30 -61" fill="none" stroke="#f58e6b" strokeWidth="3" />
      <path d="M-31 -91 0 -85 30 -91" fill="none" stroke="#ffb06e" strokeWidth="6" opacity=".7" />
      <path d="M-32 -24 0 -12 32 -24" fill="none" stroke="#230c1f" strokeWidth="5" />
      <path d="M-36 -79 0 -67 34 -79 15 -56 -16 -56Z" fill="#180c21" />
      <path d="M-25 -74 -7 -70 -15 -63Z M8 -70 25 -74 16 -63Z" fill="#fff0a1" className="monster-eyes"/>
      {boss && <><path d="M-52 -106 -76 -154 -30 -127 M52 -106 76 -154 30 -127" fill="none" stroke="#ffc06d" strokeWidth="9" strokeLinecap="round" /><path d="M-46 -118 0 -155 46 -118" fill="none" stroke="#ffd48b" strokeWidth="6" /></>}
      <circle cx="0" cy="-32" r="12" fill="#ffb45c" className="monster-core" />
    </g>
    <circle className="monster-flame" cx="-66" cy="-92" r="7" fill="#ffad63"/><circle className="monster-flame delay" cx="66" cy="-59" r="5" fill="#f86e53" />
  </g>;
}

export function EncounterFoe({ encounter, boss }: FoeProps) {
  if (!boss && encounter === "collapsing bridge") return <BridgeHazard />;
  if (!boss && encounter === "bridge raiders") return <Raiders />;
  if (!boss && encounter === "moonshade stalker") return <Stalker />;
  return <Wraith boss={boss} />;
}

/** CSS hides the finite replay after three seconds; no simulated damage events. */
export function ResolutionPlayback({ resolution }: { resolution: BattleResolution }) {
  const hit = resolution.attackPower > 0;
  const shield = resolution.shieldAbsorbed > 0;
  const healed = resolution.healingRestored > 0;
  const hurt = resolution.damageTaken > 0;
  const boss = resolution.phase === "finale";
  return <g className="cinema-resolution-playback" aria-hidden="true">
    <g transform={"translate(947 356) scale(" + (boss ? 1.15 : .85) + ")"}>
      <g className="resolution-foe-echo"><EncounterFoe encounter={resolution.encounter} boss={boss}/></g>
    </g>
    {hit && <g className="resolution-slash" fill="none" stroke="#fff2c7" strokeWidth="12" strokeLinecap="round">
      <path d="M661 288 Q819 132 1040 166"/><path d="M723 313 Q880 192 1076 229" stroke="#f7a16d" strokeWidth="6"/>
    </g>}
    {hit && <text className="resolution-number attack" x="940" y="135" textAnchor="middle">ATTACK {resolution.attackPower}</text>}
    {resolution.scoutBoost > 0 && <text className="resolution-number scout" x="900" y="180" textAnchor="middle">SCOUT +{resolution.scoutBoost}</text>}
    {shield && <g className="resolution-shield">
      <path d="M350 187 Q470 239 496 267 L466 339 403 372 351 330 328 266Z" fill="#76c8ff" opacity=".23" stroke="#b4e4ff" strokeWidth="9"/>
      <text className="resolution-number shield" x="412" y="230" textAnchor="middle">BLOCK {resolution.shieldAbsorbed}</text>
    </g>}
    {healed && <g className="resolution-heal">
      <circle cx="356" cy="291" r="92" fill="#9affd6" opacity=".1" stroke="#a6ffcd" strokeWidth="6"/>
      <path d="M352 252 V302 M328 276 H376" fill="none" stroke="#d5ffdf" strokeWidth="12" strokeLinecap="round"/>
      <text className="resolution-number heal" x="355" y="203" textAnchor="middle">HEAL +{resolution.healingRestored}</text>
    </g>}
    {hurt && <g className="resolution-hurt">
      <path d="M74 335 Q280 130 555 345" fill="none" stroke="#ff6e7a" opacity=".35" strokeWidth="36"/>
      <text className="resolution-number hurt" x="354" y="141" textAnchor="middle">PARTY −{resolution.damageTaken}</text>
    </g>}
    {resolution.participants === 0 && <text className="resolution-number inactive" x="640" y="185" textAnchor="middle">NO ACTIONS RECEIVED</text>}
  </g>;
}
