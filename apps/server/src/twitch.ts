/** Server-only OAuth + resilient EventSub client. Tokens never cross Socket.IO. */
import crypto from "node:crypto";
type Credentials = { clientId: string; clientSecret: string; redirectUri: string };
type Session = { accessToken: string; refreshToken: string | null; broadcasterId: string; login: string };
type Connection = "not_configured" | "authorizing" | "connecting" | "connected" | "disconnected" | "error";
type Message = { metadata?: { message_type?: string; message_id?: string }; payload?: Record<string, any> };
export type TwitchStatus = { configured: boolean; connected: boolean; login: string | null; connection: Connection; message: string };

const TWITCH_SOCKET = "wss://eventsub.wss.twitch.tv/ws";
const MAX_RETRIES = 5;

export class TwitchClient {
  private states = new Map<string, number>(); private session: Session | null = null; private socket: WebSocket | null = null; private pendingSocket: WebSocket | null = null;
  private connection: Connection = "not_configured"; private message = "Twitch credentials are not configured"; private subscriptionCreated = false; private reconnectAttempts = 0;
  private keepaliveTimer: ReturnType<typeof setTimeout> | null = null; private retryTimer: ReturnType<typeof setTimeout> | null = null; private seenEvents = new Map<string, number>();
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
    const expires = this.states.get(state); this.states.delete(state); if (!code || !expires || expires <= Date.now()) throw new Error("Invalid or expired OAuth state");
    const token = await this.exchangeToken(new URLSearchParams({ client_id: this.credentials.clientId, client_secret: this.credentials.clientSecret, code, grant_type: "authorization_code", redirect_uri: this.credentials.redirectUri }));
    const me = await this.request<{ data: Array<{ id: string; login: string }> }>("https://api.twitch.tv/helix/users", token.access_token, false); if (!me.data[0]) throw new Error("Twitch account lookup failed");
    this.session = { accessToken: token.access_token, refreshToken: token.refresh_token ?? null, broadcasterId: me.data[0].id, login: me.data[0].login }; this.subscriptionCreated = false; this.reconnectAttempts = 0; this.setStatus("connecting", "Authorized; connecting to Twitch chat"); this.startSocket(TWITCH_SOCKET, false, false);
  }
  private setStatus(connection: Connection, message: string) { this.connection = connection; this.message = message; this.onChange(); }
  private async exchangeToken(body: URLSearchParams) { const response = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }); if (!response.ok) throw new Error(`Twitch token exchange failed (${response.status})`); const token = await response.json() as { access_token?: string; refresh_token?: string }; if (!token.access_token) throw new Error("Twitch token response did not contain an access token"); return token as { access_token: string; refresh_token?: string }; }
  private async refreshSession() { if (!this.session?.refreshToken) throw new Error("Twitch authorization expired; reconnect Twitch"); const token = await this.exchangeToken(new URLSearchParams({ client_id: this.credentials.clientId, client_secret: this.credentials.clientSecret, grant_type: "refresh_token", refresh_token: this.session.refreshToken })); this.session.accessToken = token.access_token; this.session.refreshToken = token.refresh_token ?? this.session.refreshToken; }
  private async request<T>(url: string, accessToken: string, retryOnUnauthorized = true, init: RequestInit = {}) {
    const perform = (token: string) => fetch(url, { ...init, headers: { ...init.headers, "Client-Id": this.credentials.clientId, Authorization: `Bearer ${token}` } });
    let response = await perform(accessToken);
    if (response.status === 401 && retryOnUnauthorized && this.session && accessToken === this.session.accessToken) { await this.refreshSession(); response = await perform(this.session.accessToken); }
    if (!response.ok) throw new Error(`Twitch API request failed (${response.status})`); return response.json() as Promise<T>;
  }
  private startSocket(url: string, directedReconnect: boolean, retrying: boolean) {
    if (!directedReconnect) { this.clearRetry(); this.clearKeepalive(); if (this.socket) this.socket.close(); this.socket = null; this.subscriptionCreated = retrying ? false : this.subscriptionCreated; }
    const socket = new WebSocket(url); if (directedReconnect) this.pendingSocket = socket;
    socket.addEventListener("error", () => { if (socket === this.socket || socket === this.pendingSocket) { this.setStatus("connecting", "Twitch EventSub connection error; retrying connection"); socket.close(); } });
    socket.addEventListener("message", async (event) => { try { const message = JSON.parse(String(event.data)) as Message; this.resetKeepalive(message.payload?.session?.keepalive_timeout_seconds);
      if (message.metadata?.message_type === "session_welcome") await this.onWelcome(socket, String(message.payload?.session?.id ?? ""), directedReconnect);
      else if (message.metadata?.message_type === "session_reconnect") { const reconnectUrl = message.payload?.session?.reconnect_url; if (!reconnectUrl) throw new Error("Twitch reconnect message lacked a URL"); this.setStatus("connecting", "Twitch requested an EventSub reconnect"); this.startSocket(reconnectUrl, true, false); }
      else if (message.metadata?.message_type === "notification") this.onNotification(message);
      else if (message.metadata?.message_type === "revocation") { this.subscriptionCreated = false; this.setStatus("error", "Twitch revoked the chat subscription; reconnect Twitch"); }
    } catch (error) { this.setStatus("error", error instanceof Error ? error.message : "Twitch EventSub message error"); } });
    socket.addEventListener("close", () => this.onSocketClosed(socket, directedReconnect));
  }
  private async onWelcome(socket: WebSocket, sessionId: string, directedReconnect: boolean) {
    if (!sessionId) throw new Error("Twitch EventSub welcome lacked a session ID");
    if (directedReconnect) { const old = this.socket; this.socket = socket; this.pendingSocket = null; old?.close(); }
    else this.socket = socket;
    if (!this.subscriptionCreated) { await this.subscribe(sessionId); this.subscriptionCreated = true; }
    this.reconnectAttempts = 0; this.setStatus("connected", `Twitch chat connected as ${this.session?.login ?? "broadcaster"}`);
  }
  private onNotification(message: Message) {
    const id = message.metadata?.message_id; const now = Date.now(); for (const [seen, expires] of this.seenEvents) if (expires <= now) this.seenEvents.delete(seen); if (id && this.seenEvents.has(id)) return; if (id) this.seenEvents.set(id, now + 600000);
    if (message.payload?.subscription?.type !== "channel.chat.message") return; const chat = message.payload.event; if (typeof chat?.chatter_user_id !== "string" || typeof chat?.chatter_user_name !== "string" || typeof chat?.message?.text !== "string") return; this.onChat(chat.chatter_user_id, chat.chatter_user_name, chat.message.text);
  }
  private onSocketClosed(socket: WebSocket, directedReconnect: boolean) {
    if (socket === this.pendingSocket) { this.pendingSocket = null; if (this.socket) return; }
    if (socket !== this.socket || directedReconnect) return; this.socket = null; this.clearKeepalive(); if (this.connection === "error") return; this.scheduleRetry("Twitch chat disconnected; retrying connection");
  }
  private resetKeepalive(seconds: unknown) { this.clearKeepalive(); const timeoutSeconds = typeof seconds === "number" && seconds > 0 ? seconds : 30; this.keepaliveTimer = setTimeout(() => { this.socket?.close(); this.scheduleRetry("Twitch EventSub keepalive timed out; retrying connection"); }, (timeoutSeconds + 5) * 1000); }
  private scheduleRetry(message: string) { if (!this.session || this.reconnectAttempts >= MAX_RETRIES) return this.setStatus("error", this.reconnectAttempts >= MAX_RETRIES ? "Twitch chat reconnection limit reached; reconnect Twitch" : message); this.clearRetry(); const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000); this.reconnectAttempts += 1; this.setStatus("connecting", `${message} (attempt ${this.reconnectAttempts}/${MAX_RETRIES})`); this.retryTimer = setTimeout(() => this.startSocket(TWITCH_SOCKET, false, true), delay); }
  private clearKeepalive() { if (this.keepaliveTimer) clearTimeout(this.keepaliveTimer); this.keepaliveTimer = null; }
  private clearRetry() { if (this.retryTimer) clearTimeout(this.retryTimer); this.retryTimer = null; }
  private async subscribe(sessionId: string) { if (!this.session) throw new Error("No authorized Twitch session"); await this.request("https://api.twitch.tv/helix/eventsub/subscriptions", this.session.accessToken, true, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "channel.chat.message", version: "1", condition: { broadcaster_user_id: this.session.broadcasterId, user_id: this.session.broadcasterId }, transport: { method: "websocket", session_id: sessionId } }) }); }
}
