import { useState } from "react";

type TwitchConnection = {
  configured: boolean;
  connected: boolean;
  login: string | null;
  connection: string;
  message: string;
};
export function getTwitchSetupProgress(twitch: TwitchConnection, controlsProtected: boolean, tokenReady: boolean, tokenEntered: boolean) {
  return {
    appReady: twitch.configured,
    accessReady: !controlsProtected || (tokenReady && tokenEntered),
    online: twitch.connected,
    needsServerToken: controlsProtected && !tokenReady
  };
}

/** Configuration is server-side; this screen never requests or displays the Twitch Client Secret. */
export function TwitchConnectionGuide({ twitch, controlsProtected, hostTokenConfigured, controlToken, apiUrl }: {
  twitch: TwitchConnection;
  controlsProtected: boolean;
  hostTokenConfigured: boolean;
  controlToken: string;
  apiUrl: string;
}) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const hosted = typeof window !== "undefined" && window.location.hostname.endsWith(".onrender.com");
  const callback = hosted ? window.location.origin + "/auth/twitch/callback" : "http://localhost:3001/auth/twitch/callback";
  const progress = getTwitchSetupProgress(twitch, controlsProtected, hostTokenConfigured, Boolean(controlToken.trim()));
  const callbackNotice = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("twitch") : null;
  const [showOwnerSetup, setShowOwnerSetup] = useState(false);
  const connect = async () => {
    if (pending || !progress.appReady || !progress.accessReady) return;
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(apiUrl + "/api/twitch/authorize", {
        method: "POST",
        headers: controlToken ? { Authorization: "Bearer " + controlToken } : {}
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "The server could not start Twitch sign-in.");
      const url = new URL(data.url ?? "");
      if (url.origin !== "https://id.twitch.tv" || url.pathname !== "/oauth2/authorize") {
        throw new Error("The authorization destination was not Twitch. Please try again.");
      }
      window.location.assign(url.toString());
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Twitch sign-in could not start.");
      setPending(false);
    }
  };
  const copyCallback = async () => {
    try {
      await navigator.clipboard.writeText(callback);
      setCopied(true);
    } catch {
      setNotice("Select and copy the callback address shown below.");
    }
  };
  return <section className={"twitch-onboarding " + (twitch.connected ? "connected" : "")} aria-labelledby="twitch-onboarding-title">
    <div className="twitch-onboarding-top">
      <div><p className="eyebrow">TWITCH LIVE PLAY · CONNECTION SETUP</p>
        <h2 id="twitch-onboarding-title">{twitch.connected ? "Your Twitch channel is connected" : "Connect your Twitch and start playing"}</h2>
        <p>{twitch.connected ? "Your server is listening for live commands from Twitch chat." : "Use your existing CrowdQuest Twitch developer application. Setup is needed only once per hosted server."}</p></div>
      <span className={"twitch-connection-pill " + (twitch.connected ? "online" : twitch.configured ? "ready" : "missing")}>
        {twitch.connected ? "● LIVE TWITCH" : twitch.configured ? "◌ READY TO CONNECT" : "◌ SETUP NEEDED"}
      </span>
    </div>
    {twitch.connected ? <div className="twitch-connected-steps">
      <strong>Connected to {twitch.login ? "@" + twitch.login : "your Twitch channel"}</strong>
      <p>You're ready to play. Open your channel chat and type <code>!join</code> in the lobby. Then press <b>Start quest</b> below. As the adventure progresses, use <code>!role warrior</code>, <code>!path B</code>, and <code>!act attack</code>.</p>
      <div className="twitch-quick-actions"><a href={twitch.login ? "https://www.twitch.tv/" + encodeURIComponent(twitch.login) : "https://www.twitch.tv/"} target="_blank" rel="noreferrer">Open your Twitch chat ↗</a><a href="#game-dashboard">Go to game controls ↓</a></div>
    </div> : <>
      {callbackNotice === "authorized" && <p className="twitch-onboarding-notice" role="status">Twitch authorization finished. Checking the channel connection now.</p>}
      {callbackNotice === "error" && <p className="twitch-onboarding-error" role="alert">Twitch authorization was not completed. Check the app's callback URL and try again.</p>}
      {!progress.appReady && <div className="twitch-connect-blocked" role="status">
        <span className="twitch-blocked-icon" aria-hidden="true">⚠</span>
        <div><strong>Why can't I connect?</strong><p>Our hosted CrowdQuest server has no Twitch application credentials. This is a <b>one-time platform-owner setup</b>, not something every Twitch streamer should have to do. We cannot connect a real channel until the app is configured.</p></div>
      </div>}
      <div className="twitch-quick-actions">
        <a className="twitch-play-now" href="/play"> <span aria-hidden="true">⚔</span><span><strong>Play the game now</strong><small>Browser solo demo · no Twitch needed</small></span><span aria-hidden="true">↗</span></a>
        {progress.appReady ?
          <button type="button" className="twitch-connect-now" disabled={pending || !progress.accessReady} onClick={()=>void connect()}>
            <strong>{pending ? "Opening Twitch…" : "Connect my Twitch account"}</strong>
            <small>{progress.needsServerToken ? "Streamer access is not set on this server" : !controlToken.trim() && controlsProtected ? "Enter the streamer token above first" : "Sign in and authorize your channel"}</small>
          </button> :
          <button type="button" className="twitch-owner-open" onClick={()=>setShowOwnerSetup(value=>!value)} aria-expanded={showOwnerSetup} aria-controls="twitch-owner-setup">
            <strong>{showOwnerSetup?"Hide setup instructions":"Enable real Twitch play"}</strong><small>One-time setup by the owner of CrowdQuest</small>
          </button>
        }
      </div>
      <div id="twitch-owner-setup" className="twitch-owner-setup" hidden={!showOwnerSetup && !progress.appReady}>
        <h3>Set up Twitch for this hosted game — once</h3>
        <p className="twitch-owner-description">Use the Twitch app you already created. Only the CrowdQuest owner must do this. Other streamers must never be asked to enter developer secrets or a shared admin token.</p>
        <div className="twitch-onboarding-steps">
          <div className="twitch-setup-step">
            <div className="twitch-step-heading"><b>1</b><span>Copy this callback into your existing Twitch app</span></div>
            <div className="twitch-callback"><code>{callback}</code><button type="button" onClick={()=>void copyCallback()}>{copied ? "Copied ✓" : "Copy URL"}</button></div>
            <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noreferrer">Open Twitch Developer Console ↗</a>
            <p>Keep the original localhost callback too, so your working local game still connects.</p>
          </div>
          <div className="twitch-setup-step">
            <div className="twitch-step-heading"><b>2</b><span>Save the app credentials privately on the server</span><em className={progress.appReady ? "complete" : ""}>{progress.appReady ? "✓ Configured" : "Missing"}</em></div>
            <p>Add <code>TWITCH_CLIENT_ID</code>, <code>TWITCH_CLIENT_SECRET</code>, and <code>TWITCH_REDIRECT_URI</code> to {hosted ? "the CrowdQuest Render Environment" : "your local .env"}. They must be saved server-side—not in the browser or GitHub.</p>
            {hosted ? <a href="https://dashboard.render.com/web/srv-dbijeibbc2fs73ag4ij0" target="_blank" rel="noreferrer">Open CrowdQuest on Render ↗</a> : <a href="https://github.com/betterlifestyle04-commits/crowdquest-twitch/blob/main/.env.example" target="_blank" rel="noreferrer">See the environment template ↗</a>}
          </div>
          <div className="twitch-setup-step">
            <div className="twitch-step-heading"><b>3</b><span>Protect the game controls</span><em className={progress.accessReady ? "complete" : ""}>{progress.accessReady ? "✓ Ready" : "Needed"}</em></div>
            {progress.needsServerToken ? <p>Create <code>STREAMER_CONTROL_TOKEN</code> as a long random secret in {hosted ? "Render's private Environment" : "your private .env"}. Save and restart. Enter the same token in the dashboard field above.</p> :
              controlsProtected && !controlToken.trim() ? <p>Enter the privately configured <code>STREAMER_CONTROL_TOKEN</code> in the dashboard field above.</p> :
              <p>{controlsProtected?"Your streamer token is entered.":"Local development can work without a separate token."} Then select <b>Connect my Twitch account</b>.</p>}
          </div>
        </div>
      </div>
      {!progress.appReady && <p className="twitch-onboarding-footer">Need the fastest real Twitch recording today? If your computer still has the original working <code>.env</code>, run the game locally with <code>npm run dev</code> and connect there. <a href="https://github.com/betterlifestyle04-commits/crowdquest-twitch/blob/main/JUDGE_SETUP.md" target="_blank" rel="noreferrer">Local setup instructions ↗</a></p>}
      {progress.appReady && <p className="twitch-onboarding-footer">The platform app is configured. {progress.accessReady ? "Select Connect my Twitch account to authorize the channel." : "Complete the private streamer-control step above."} <button className="twitch-text-button" onClick={()=>setShowOwnerSetup(value=>!value)} type="button">{showOwnerSetup ? "Hide technical setup" : "Show technical setup"}</button></p>}
      {notice && <p className="twitch-onboarding-error" role="alert">{notice}</p>}
      <p className="twitch-onboarding-footer">Server status: {twitch.message}. Never share Twitch client secrets or admin tokens. This hosted release supports one connected broadcaster at a time; independent streamer accounts require a separate platform upgrade.</p>
    </>}
  </section>;
}
