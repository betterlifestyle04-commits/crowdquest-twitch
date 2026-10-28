/** Server-only Twitch OAuth and EventSub client. Tokens never cross Socket.IO. */
import crypto from "node:crypto";
type Credentials = { clientId: string; clientSecret: string; redirectUri: string };
type Session = { accessToken: string; broadcasterId: string; login: string };
type Connection = "not_configured" | "authorizing" | "connecting" | "connected" | "disconnected" | "error";
export type TwitchStatus = { configured: boolean; connected: boolean; login: string | null; connection: Connection; message: string };

export class TwitchClient {
  private states = new Map<string, number>(); private session: Session | null = null; private socket: WebSocket | null = null;
  private connection: Connection = "not_configured"; private message = "Twitch credentials are not configured"; private subscriptionCreated = false;
  constructor(private credentials: Credentials, private onChat: (userId: string, displayName: string, text: string) => void, private onChange: () => void) {}
  configured() { return Boolean(this.credentials.clientId && this.credentials.clientSecret && this.credentials.redirectUri); }
  status(): TwitchStatus { return { configured: this.configured(), connected: this.connection === "connected", login: this.session?.login ?? null, connection: this.connection, message: this.message }; }
  authorizeUrl() {
    if (!this.configured()) throw new Error("Twitch credentials are not configured");
    const now = Date.now(); for (const [value, expires] of this.states) if (expires <= now) this.states.delete(value);
    const state = crypto.randomBytes(32).toString("hex"); this.states.set(state, now + 600000); this.setStatus("authorizing", "Waiting for Twitch authorization");
    const query = new URLSearchParams({ client_id: this.credentials.clientId, redirect_uri: this.credentials.redirectUri, response_type: "code", scope: "user:read:chat", state });
    return `https://id.twitch.tv/oauth2/authorize?${query}`;
  }
  async callback(code: string, state: string) {
    const expires = this.states.get(state); this.states.delete(state);
    if (!code || !expires || expires <= Date.now()) throw new Error("Invalid or expired OAuth state");
    const body = new URLSearchParams({ client_id: this.credentials.clientId, client_secret: this.credentials.clientSecret, code, grant_type: "authorization_code", redirect_uri: this.credentials.redirectUri });
    const token = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    if (!token.ok) throw new Error(`Twitch token exchange failed (${token.status})`);
    const auth = await token.json() as { access_token?: string }; if (!auth.access_token) throw new Error("Twitch token response did not contain an access token");
    const me = await this.helix<{ data: Array<{ id: string; login: string }> }>("/users", auth.access_token); if (!me.data[0]) throw new Error("Twitch account lookup failed");
    this.session = { accessToken: auth.access_token, broadcasterId: me.data[0].id, login: me.data[0].login }; this.subscriptionCreated = false; this.setStatus("connecting", "Authorized; connecting to Twitch chat"); this.connectEventSub();
  }
  private setStatus(connection: Connection, message: string) { this.connection = connection; this.message = message; this.onChange(); }
  private async helix<T>(path: string, token: string) { const response = await fetch(`https://api.twitch.tv/helix${path}`, { headers: { "Client-Id": this.credentials.clientId, Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error(`Twitch Helix request failed (${response.status})`); return response.json() as Promise<T>; }
  private connectEventSub() { this.socket?.close(); this.openEventSub("wss://eventsub.wss.twitch.tv/ws", false); }
  private openEventSub(url: string, reconnecting: boolean) {
    const socket = this.socket = new WebSocket(url);
    socket.addEventListener("error", () => this.setStatus("error", "Twitch EventSub connection error"));
    socket.addEventListener("message", async (event) => { try { const payload = JSON.parse(String(event.data)); const type = payload.metadata?.message_type;
      if (type === "session_welcome") { if (!reconnecting && !this.subscriptionCreated) { await this.subscribe(payload.payload.session.id); this.subscriptionCreated = true; } this.setStatus("connected", `Twitch chat connected as ${this.session?.login ?? "broadcaster"}`); }
      else if (type === "session_reconnect") { this.setStatus("connecting", "Twitch requested an EventSub reconnect"); this.openEventSub(payload.payload.session.reconnect_url, true); }
      else if (type === "notification" && payload.payload.subscription.type === "channel.chat.message") { const chat = payload.payload.event; this.onChat(chat.chatter_user_id, chat.chatter_user_name, chat.message.text); }
      else if (type === "revocation") this.setStatus("error", "Twitch revoked the chat subscription; reconnect Twitch");
    } catch (error) { this.setStatus("error", error instanceof Error ? error.message : "Twitch EventSub message error"); } });
    socket.addEventListener("close", () => { if (this.socket === socket && this.connection !== "error") this.setStatus("disconnected", "Twitch chat disconnected"); });
  }
  private async subscribe(sessionId: string) { if (!this.session) throw new Error("No authorized Twitch session"); const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", { method: "POST", headers: { "Content-Type": "application/json", "Client-Id": this.credentials.clientId, Authorization: `Bearer ${this.session.accessToken}` }, body: JSON.stringify({ type: "channel.chat.message", version: "1", condition: { broadcaster_user_id: this.session.broadcasterId, user_id: this.session.broadcasterId }, transport: { method: "websocket", session_id: sessionId } }) }); if (!response.ok) throw new Error(`EventSub subscription failed (${response.status})`); }
}
