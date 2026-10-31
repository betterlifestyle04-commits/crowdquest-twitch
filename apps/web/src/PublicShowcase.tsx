import { useMemo, useState, type ReactNode } from "react";
import { advance, begin, chooseRole, initialState, join, makeRehearsal, votePath, type QuestState, type Role } from "@crowdquest/shared";

type SceneId = "camp" | "muster" | "crossroads" | "trial" | "boss" | "ending";
const scenes: Array<{id: SceneId; number:string; title:string; subtitle:string; tag:string}> = [
  {id:"camp",number:"01",title:"The Campfire",subtitle:"Every adventure begins with a viewer joining the expedition.",tag:"!join"},
  {id:"muster",number:"02",title:"Choose Your Role",subtitle:"Warrior, Guardian, Healer and Scout each matter.",tag:"!role"},
  {id:"crossroads",number:"03",title:"The People's Vote",subtitle:"Watch Twitch chat choose the dangerous or safer route.",tag:"!path"},
  {id:"trial",number:"04",title:"The First Trial",subtitle:"Coordinated class abilities overcome the first encounter.",tag:"!act"},
  {id:"boss",number:"05",title:"The Ember Lord",subtitle:"Every combat role prepares for the final boss.",tag:"!act"},
  {id:"ending",number:"06",title:"The Chronicle",subtitle:"The story ends with the real engine's calculated outcome.",tag:"RESULT"}
];
const sampleParty: Array<{id:string; name:string; role:Role}> = [
  {id:"preview-warrior",name:"Nova [Demo]",role:"warrior"},
  {id:"preview-guardian",name:"Arden [Demo]",role:"guardian"},
  {id:"preview-healer",name:"Lyra [Demo]",role:"healer"},
  {id:"preview-scout",name:"Orion [Demo]",role:"scout"}
];
export function createPublicPreviewState(id: SceneId): QuestState {
  if (id === "trial") return {...makeRehearsal("encounter", 20261102),phaseEndsAt:null};
  if (id === "boss") return {...makeRehearsal("finale", 20261102),phaseEndsAt:null};
  if (id === "ending") return {...makeRehearsal("result", 20261102),phaseEndsAt:null};
  let state = initialState(20261102);
  for (const player of sampleParty) state = join(state, player.id, player.name);
  if (id === "camp") return {...state,phaseEndsAt:null};
  state = begin(state);
  for (const player of sampleParty.slice(0,id==="muster"?2:4)) state = chooseRole(state,player.id,player.role);
  if (id === "muster") return {...state,phaseEndsAt:null};
  state = advance(advance(state));
  state = votePath(state,sampleParty[0].id,"B");
  state = votePath(state,sampleParty[1].id,"B");
  state = votePath(state,sampleParty[2].id,"A");
  return {...state,phaseEndsAt:null};
}
/** Public, read-only and always clearly simulated. Never contacts Twitch or host controls. */
export function PublicShowcase({renderGame}: {renderGame:(state:QuestState,focused:boolean)=>ReactNode}) {
  const [selected,setSelected] = useState<SceneId>("trial");
  const [focused,setFocused] = useState(true);
  const preview = useMemo(()=>createPublicPreviewState(selected),[selected]);
  const current = scenes.find(x=>x.id===selected)!;
  const currentIndex = scenes.findIndex(x=>x.id===selected);
  return <main className="public-showcase">
    <header className="showcase-navigation">
      <a className="showcase-brand" href="/" aria-label="CrowdQuest home"><span className="showcase-brand-seal">✦</span><span>CROWD<span className="showcase-gold">QUEST</span><small>THE EMBER GATE</small></span></a>
      <nav aria-label="Project links">
        <a href="/play">Play solo demo</a><a href="#explore">Explore game</a>
        <a href="#how-it-works">How it works</a>
        <a className="showcase-code-link" href="https://github.com/betterlifestyle04-commits/crowdquest-twitch" target="_blank" rel="noreferrer">View source ↗</a>
      </nav>
    </header>
    <section className="showcase-hero" aria-labelledby="showcase-title">
      <div className="showcase-hero-copy">
        <div className="showcase-eyebrow"><span className="showcase-pulse" /> CODEX × TWITCHCON · INTERACTIVE ADVENTURE</div>
        <h1 id="showcase-title">Your chat.<br/><em>Your quest.</em></h1>
        <p>CrowdQuest transforms a Twitch channel into a collaborative fantasy world. Viewers join as heroes, vote on the path, and combine their abilities in real-time combat.</p>
        <div className="showcase-hero-actions"><a href="/play" className="showcase-cta">Play the solo demo <span aria-hidden="true">⚔</span></a><a className="showcase-secondary" href="#explore">Explore six chapters</a></div>
        <div className="showcase-facts"><span><b>4</b><small>Hero classes</small></span><span><b>6</b><small>Quest chapters</small></span><span><b>1</b><small>Shared destiny</small></span></div>
      </div>
      <div className="showcase-hero-art" aria-hidden="true">
        <div className="showcase-orbit o-one"/><div className="showcase-orbit o-two"/>
        <div className="showcase-portal"><span>✦</span></div>
        <div className="showcase-portal-note">THE EMBER GATE <span>✧</span></div>
        <div className="showcase-ember ember-a"/><div className="showcase-ember ember-b"/><div className="showcase-ember ember-c"/>
      </div>
    </section>
    <section id="explore" className="showcase-experience" aria-labelledby="explore-title">
      <div className="showcase-section-top">
        <div><span className="showcase-overline">INTERACTIVE GALLERY · LOCAL ENGINE</span><h2 id="explore-title">Enter the story</h2><p>Select a chapter to view the game, or <a href="/play" className="showcase-inline-play">play the single-player rehearsal</a>. These previews are simulated, not real Twitch sessions.</p></div>
        <span className="showcase-simulated-tag">◉ SIMULATED PREVIEW — NOT LIVE TWITCH</span>
      </div>
      <div className="showcase-scene-grid" role="group" aria-label="Choose a chapter preview">
        {scenes.map((scene) => <button key={scene.id} type="button" aria-pressed={selected===scene.id} onClick={()=>setSelected(scene.id)} className={"showcase-scene-tab " + (selected===scene.id?"active":"")}>
          <small>{scene.number}</small><span>{scene.title}</span><b>{scene.tag}</b>
        </button>)}
      </div>
      <div className="showcase-stage-meta"><div><span>SCENE {current.number} / 06</span><h3>{current.title}</h3><p>{current.subtitle}</p></div><button className="game-display-toggle" aria-pressed={!focused} type="button" onClick={()=>setFocused(value=>!value)}>{focused?"Show detailed HUD":"Hide extra panels"}</button></div>
      <div className="showcase-stage-shell">{renderGame(preview,focused)}</div>
      <div className="showcase-stage-bottom"><p><b>About this preview:</b> These are simulated demo adventurers and a frozen engine state. No real Twitch commands are being received on this page.</p><div><button type="button" disabled={currentIndex===0} onClick={()=>setSelected(scenes[currentIndex-1].id)}>← Previous</button><button type="button" disabled={currentIndex===scenes.length-1} onClick={()=>setSelected(scenes[currentIndex+1].id)}>Next chapter →</button></div></div>
    </section>
    <section id="how-it-works" className="showcase-how" aria-labelledby="how-title">
      <span className="showcase-overline">PLAY TOGETHER · NO DOWNLOAD NEEDED FOR VIEWERS</span>
      <h2 id="how-title">The crowd writes the adventure.</h2>
      <div className="showcase-steps">
        <article><span>01 / JOIN</span><b>Find your party</b><p>Viewers type <code>!join</code> in Twitch chat, then pick a class with <code>!role</code>.</p></article>
        <article><span>02 / DECIDE</span><b>Choose the world</b><p>Route votes <code>!path A</code> and <code>!path B</code> set the next encounter.</p></article>
        <article><span>03 / FIGHT</span><b>Combine your power</b><p>Heroes use their class's <code>!act</code> ability. The authoritative server resolves shared outcomes.</p></article>
      </div>
      <div className="showcase-disclosure"><span>✧</span><p><strong>Real Twitch integration is part of the source project.</strong> This public gallery is intentionally offline and simulated. Streamers configure their own Twitch OAuth credentials and run the live dashboard; secret keys are never shared with spectators.</p></div>
    </section>
    <footer className="showcase-footer"><div><span className="showcase-brand-seal">✦</span> CROWDQUEST — THE EMBER GATE</div><span>Built with Codex for the Codex × TwitchCon Hackathon</span><a href="https://github.com/betterlifestyle04-commits/crowdquest-twitch" target="_blank" rel="noreferrer">Open-source repository ↗</a></footer>
  </main>;
}
