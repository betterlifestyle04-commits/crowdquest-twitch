import React from "react";
import type { QuestState, Role } from "@crowdquest/shared";

/** Original vector artwork. All visual feedback derives from the authoritative game state. */
type Props = { state: QuestState; scene: string };
const roles: Role[] = ["warrior", "guardian", "healer", "scout"];

function Adventurer({ role, queued, present }: { role: Role; queued: boolean; present: boolean }) {
  const armor = { warrior: "#d37e70", guardian: "#73a9d5", healer: "#64cda8", scout: "#e5b76e" }[role];
  return (
    <g className={"cinema-adventurer " + role + (queued ? " casting" : "") + (present ? " joined" : " waiting")}>
      <ellipse className="sprite-shadow" cx="0" cy="49" rx="37" ry="9" fill="#080d1b" opacity=".55" />
      <ellipse className="hero-glow" cx="0" cy="-8" rx="37" ry="65" fill={armor} opacity=".18" />
      <path d="M-17 13 L-12 49 -2 49 3 23 8 49 20 49 17 12Z" fill="#202845" stroke="#0b1227" strokeWidth="3" />
      <path d="M-24 -29 Q-26 -41 -10 -46 L11 -46 Q27 -39 24 -25 L20 14 Q0 24 -20 14Z" fill={armor} stroke="#171933" strokeWidth="3" />
      <path d="M-19 -19 Q0 -12 19 -19 L15 11 Q0 17 -15 11Z" fill="#28344e" opacity=".55" />
      <path d="M-21 -26 -28 8 -19 11 -10 -20M21 -26 28 8 19 11 10 -20" fill="none" stroke={armor} strokeWidth="12" strokeLinecap="round" />
      <path d="M-9 -48 L-12 -60 Q0 -74 14 -61 L12 -46Z" fill="#efc2a1" stroke="#2a2033" strokeWidth="2" />
      {role === "warrior" && <g className="sprite-weapon"><path d="M0 -69 L-14 -63 -14 -51 12 -51 13 -62Z" fill="#ced4e6" stroke="#40495d" strokeWidth="2" /><path d="M26 -13 41 -77 45 -85 49 -75 34 -11Z" fill="#d8e9ff" stroke="#718eb1" strokeWidth="2" /><path d="M22 -21 43 -16" stroke="#e8b16f" strokeWidth="6" strokeLinecap="round" /></g>}
      {role === "guardian" && <g className="sprite-weapon"><path d="M-23 -51 Q-4 -67 16 -51 L13 -36 -21 -36Z" fill="#869bbd" stroke="#354b78" strokeWidth="2" /><path d="M18 -13 49 -18 47 21 Q35 40 16 18Z" fill="#3979b6" stroke="#a6dcff" strokeWidth="4" /><path d="M31 -9 32 22M22 4 42 4" stroke="#cdeeff" strokeWidth="4" /></g>}
      {role === "healer" && <g className="sprite-weapon"><path d="M-20 -53 Q0 -80 18 -53 L15 -41 -15 -41Z" fill="#eaf7e8" stroke="#72a999" strokeWidth="2" /><path d="M25 13 38 -73" stroke="#a88953" strokeWidth="6" strokeLinecap="round" /><circle cx="39" cy="-77" r="12" fill="#8df6c6" stroke="#e1ffdc" strokeWidth="3" /><path d="M39 -85 V-69 M31 -77 H47" stroke="#257d66" strokeWidth="3" /></g>}
      {role === "scout" && <g className="sprite-weapon"><path d="M-22 -55 Q0 -82 23 -55 L11 -41 -12 -41Z" fill="#876342" stroke="#f2cc8c" strokeWidth="2" /><path d="M26 -41 Q53 -15 24 18" fill="none" stroke="#f1c98d" strokeWidth="5" /><path d="M26 -41 27 18 M27 -11 50 -22" fill="none" stroke="#b6e8e1" strokeWidth="2" /></g>}
      <circle cx="-5" cy="-52" r="2" fill="#192435"/><circle cx="7" cy="-52" r="2" fill="#192435" />
      {queued && <><circle className="queued-ring" cx="0" cy="-13" r="46" fill="none" stroke={armor} strokeWidth="3" strokeDasharray="12 8" /><circle className="queued-spark" cx="46" cy="-38" r="8" fill={armor} /></>}
    </g>
  );
}

function EmberEnemy({ boss }: { boss: boolean }) {
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

export function CinematicScene({ state, scene }: Props) {
  const participants = Object.values(state.players);
  const showEnemy = state.phase === "encounter" || state.phase === "finale";
  const boss = state.phase === "finale";
  const queued = new Set(Object.entries(state.actions).map(([id]) => state.players[id]?.role).filter(Boolean));
  const countByRole = Object.fromEntries(roles.map(role => [role, participants.filter(p => p.role === role).length])) as Record<Role, number>;
  const danger = Math.max(0, Math.min(100, state.threat / 30 * 100));
  return <div className={"cinematic-art cinematic-" + scene + (state.activeEvent ? " cinematic-event-" + state.activeEvent : "")} aria-hidden="true">
    <svg className="cinematic-canvas" viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="cinema-sky" x2=".7" y2="1"><stop offset="0" stopColor={scene === "gate" ? "#381c3d" : scene === "moonlit" ? "#15264d" : "#151a43"}/><stop offset="1" stopColor={scene === "gate" ? "#9c3e43" : scene === "moonlit" ? "#3b5880" : "#54336d"}/></linearGradient>
        <linearGradient id="cinema-terrain" x2="0" y2="1"><stop stopColor={scene === "gate" ? "#503245" : "#393253"}/><stop offset="1" stopColor="#121424"/></linearGradient>
        <radialGradient id="cinema-halo"><stop stopColor={scene === "gate" ? "#ffab69" : "#f4d0bc"} stopOpacity=".75"/><stop offset="1" stopColor="#ffc1aa" stopOpacity="0"/></radialGradient>
        <linearGradient id="monsterBody" x1="0" x2="1" y2="1"><stop stopColor="#eb864c"/><stop offset=".42" stopColor="#862944"/><stop offset="1" stopColor="#2b1636"/></linearGradient>
        <linearGradient id="cinema-rift" x2="1" y2="1"><stop stopColor="#ffe49c"/><stop offset=".4" stopColor="#ed8451"/><stop offset="1" stopColor="#5d2c5d"/></linearGradient>
      </defs>
      <rect width="1200" height="520" fill="url(#cinema-sky)" />
      <circle cx={scene === "moonlit" ? 950 : 745} cy="108" r="144" fill="url(#cinema-halo)" className="cinematic-pulse"/>
      <circle cx={scene === "moonlit" ? 950 : 745} cy="104" r={scene === "moonlit" ? 41 : 23} fill={scene === "moonlit" ? "#e5eafa" : "#ffe1b9"} opacity=".83"/>
      <g fill="#e3e7ff" className="cinematic-stars">{Array.from({length:31},(_,i)=><circle key={i} cx={(i*137+39)%1190} cy={(i*89+21)%225} r={i%5===0?2.1:1} opacity={.25+(i%4)*.16}/>)}</g>
      <path d="M0 330 143 161 266 288 444 110 595 308 748 175 903 313 1060 143 1200 273V520H0Z" fill="#24294f" opacity=".77" />
      <path d="M0 354 207 243 368 328 542 214 706 355 884 249 1036 335 1200 244V520H0Z" fill="#1b2343" />
      <path d="M0 382 177 322 325 370 482 318 645 384 821 309 1003 355 1200 303V520H0Z" fill="#20213d" />
      {scene === "moonlit" && <g className="moon-crystals"><path d="M730 380 759 292 789 380Z M1040 386 1071 304 1100 386Z" fill="#7bd7cb" opacity=".48"/><path d="M731 380 760 318 761 377 M1040 386 1070 332 1071 384" fill="none" stroke="#d3fff6" strokeWidth="3" opacity=".6"/></g>}
      {scene === "bridge" && <g><path d="M690 390 840 339 1038 393" fill="none" stroke="#a47a62" strokeWidth="17"/><path d="M690 376 Q857 287 1038 379" fill="none" stroke="#d6aa88" strokeWidth="5"/><path d="M725 361 740 384 M780 347 790 366 M855 338 855 351 M931 350 920 365 M990 366 977 386" stroke="#c69b72" strokeWidth="5"/></g>}
      {(scene === "gate" || scene === "victory" || scene === "defeat") && <g className="cinematic-portal"><ellipse cx="945" cy="300" rx="128" ry="175" fill="#211729" stroke="#807086" strokeWidth="29"/><ellipse cx="945" cy="300" rx="106" ry="153" fill="url(#cinema-rift)" opacity={scene === "defeat" ? ".35" : ".92"}/><ellipse className="portal-flare" cx="945" cy="300" rx="70" ry="132" fill="#ffe2a1" opacity=".26"/><path d="M825 390 815 229 849 191 M1057 389 1079 234 1039 193" fill="none" stroke="#b59385" strokeWidth="9"/></g>}
      <path d="M0 410 Q158 370 305 396 T615 390 T900 400 T1200 380V520H0Z" fill="url(#cinema-terrain)" />
      <path d="M0 467 Q240 418 460 465 T880 457 T1200 451V520H0Z" fill="#171627" opacity=".85" />
      <ellipse cx="610" cy="416" rx="700" ry="55" fill="#be93db" opacity=".045" className="cinematic-fog" />
      {(scene === "camp" || scene === "crossroads") && <g className="cinematic-fire"><ellipse cx="800" cy="426" rx="73" ry="20" fill="#f79551" opacity=".24"/><path d="M777 433 800 379 825 432" stroke="#a0735b" strokeWidth="11" strokeLinecap="round" fill="none"/><path d="M790 418 Q778 391 805 359 Q827 384 813 420 Q832 402 821 383 Q852 431 802 445 Q774 440 790 418Z" fill="#ff9d55"/><path d="M796 430 Q791 402 807 386 Q817 414 808 437Z" fill="#fff0ae"/></g>}
      <g className="cinematic-party-art">{roles.map((role,i)=><g key={role} transform={"translate("+(156+i*126)+" 362) scale(1.46)"}><Adventurer role={role} present={countByRole[role]>0} queued={queued.has(role)}/></g>)}</g>
      {participants.length === 1 && participants[0].role && <g className="ember-companion" transform="translate(665 344)"><ellipse cx="0" cy="0" rx="33" ry="46" fill="#b9f6ed" opacity=".09"/><circle className="spirit-light" cx="0" cy="-12" r="22" fill="#9aead8" opacity=".29"/><circle className="spirit-core" cx="0" cy="-12" r="9" fill="#eaffd0" stroke="#8ff3d8" strokeWidth="3"/><path d="M-15 7 Q0 37 16 7" stroke="#8ff3d8" strokeWidth="4" fill="none" opacity=".65"/></g>}{showEnemy && <g transform={"translate(947 356) scale("+(boss?1.15:.85)+")"}><EmberEnemy boss={boss}/></g>}
      {state.result === "victory" && <g className="cinematic-triumph"><path d="M860 195 945 145 1030 195" fill="none" stroke="#fff2b3" strokeWidth="8"/><circle cx="945" cy="140" r="27" fill="#ffe9a1" opacity=".8"/></g>}
      {state.activeEvent === "emberstorm" && <path d="M110 0 160 85 128 90 204 190" fill="none" stroke="#ffbb84" strokeWidth="9" className="storm-strike"/>}
    </svg>
    {showEnemy && <div className="cinematic-boss-indicator"><span>{boss ? "THE EMBER LORD" : String(state.encounter ?? "ENCOUNTER").toUpperCase()}</span><div className="cinematic-threat-track"><i style={{width:String(danger)+"%"}}/></div><small>Threat {state.threat} / 30</small></div>}
    <div className="cinematic-scene-grain" />
  </div>;
}
