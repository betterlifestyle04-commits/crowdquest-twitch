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
      <strong>Connected as {twitch.login ? "@" + twitch.login : "your broadcaster account"}</strong>
      <p>Open your channel's chat, type <code>!join</code> while the game is in the lobby, then press <b>Start quest</b>. Next use <code>!role warrior</code>, <code>!path B</code> and <code>!act attack</code> in their respective phases.</p>
      <a href={twitch.login ? "https://www.twitch.tv/" + encodeURIComponent(twitch.login) : "https://www.twitch.tv/"} target="_blank" rel="noreferrer">Open Twitch chat ↗</a>
    </div> : <>
      {callbackNotice === "authorized" && <p className="twitch-onboarding-notice" role="status">Twitch authorized this application. The server is connecting to your channel chat; watch the connection status below.</p>}
      {callbackNotice === "error" && <p className="twitch-onboarding-error" role="alert">Twitch could not complete authorization. Check the registered callback address and try Connect Twitch again.</p>}
      <div className="twitch-onboarding-steps">
        <div className="twitch-setup-step">
          <div className="twitch-step-heading"><b>1</b><span>Use your existing Twitch app</span></div>
          <p>In Twitch Developer Console, open the app you already created. Add this exact hosted callback URL and keep your existing local callback too.</p>
          <div className="twitch-callback"><code>{callback}</code><button type="button" onClick={()=>void copyCallback()}>{copied ? "Copied ✓" : "Copy URL"}</button></div>
          <a href="https://dev.twitch.tv/console/apps" target="_blank" rel="noreferrer">Open Twitch Developer Console ↗</a>
        </div>
        <div className="twitch-setup-step">
          <div className="twitch-step-heading"><b>2</b><span>Connect this server to the app</span><em className={progress.appReady ? "complete" : ""}>{progress.appReady ? "✓ Configured" : "Not configured"}</em></div>
          {hosted ? <p>Open Render → Environment. Set <code>TWITCH_CLIENT_ID</code>, <code>TWITCH_CLIENT_SECRET</code>, and <code>TWITCH_REDIRECT_URI</code> using this callback. Save and redeploy. Keep both credentials private.</p> :
          <p>On your computer, set <code>TWITCH_CLIENT_ID</code>, <code>TWITCH_CLIENT_SECRET</code>, and <code>TWITCH_REDIRECT_URI</code> in the private <code>.env</code> file, then restart <code>npm run dev</code>.</p>}
          {hosted ? <a href="https://dashboard.render.com/web/srv-dbijeibbc2fs73ag4ij0" target="_blank" rel="noreferrer">Open CrowdQuest's Render settings ↗</a> : <a href="https://github.com/betterlifestyle04-commits/crowdquest-twitch/blob/main/.env.example" target="_blank" rel="noreferrer">See required environment names ↗</a>}
        </div>
        <div className="twitch-setup-step">
          <div className="twitch-step-heading"><b>3</b><span>Unlock streamer controls</span><em className={progress.accessReady ? "complete" : ""}>{progress.accessReady ? "✓ Ready" : "Action required"}</em></div>
          {progress.needsServerToken ? <p>Create <code>STREAMER_CONTROL_TOKEN</code> with a long random secret in your {hosted ? "Render Environment" : "private .env file"}. Restart the server, then enter it in the streamer field above.</p> :
          controlsProtected && !controlToken.trim() ? <p>Enter your private <code>STREAMER_CONTROL_TOKEN</code> in the streamer field above. It stays in this browser tab.</p> :
          <p>{controlsProtected ? "Streamer token entered. Authorization is validated when you press Connect Twitch." : "Local development: host authorization is not required unless you set a streamer token."}</p>}
        </div>
      </div>
      <div className="twitch-onboarding-actions">
        <div><b>4. Connect your broadcaster account</b><p>Once the app is configured, sign in to Twitch. Your channel's chat then controls the game.</p></div>
        <button type="button" className="primary" disabled={pending || !progress.appReady || !progress.accessReady} onClick={()=>void connect()}>
          {pending ? "Opening Twitch…" : "Connect Twitch securely →"}
        </button>
      </div>
      {notice && <p className="twitch-onboarding-error" role="alert">{notice}</p>}
      <p className="twitch-onboarding-footer">Server status: {twitch.message}. <strong>Never paste your Twitch Client Secret or streamer token into GitHub or public chat.</strong></p>
    </>}
  </section>;
}
