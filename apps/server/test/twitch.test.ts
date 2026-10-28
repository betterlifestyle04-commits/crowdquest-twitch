import { afterEach, describe, expect, it, vi } from "vitest";
import { TwitchClient } from "../src/twitch.js";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  private handlers = new Map<string, Array<(event: { data?: string }) => unknown>>();
  constructor(readonly url: string) { FakeWebSocket.instances.push(this); }
  addEventListener(type: string, listener: (event: { data?: string }) => unknown) { this.handlers.set(type, [...(this.handlers.get(type) ?? []), listener]); }
  close() { void this.emit("close"); }
  async emit(type: string, data?: unknown) { for (const listener of this.handlers.get(type) ?? []) await listener({ data: JSON.stringify(data) }); }
}

afterEach(() => { vi.unstubAllGlobals(); FakeWebSocket.instances = []; });
describe("TwitchClient", () => {
  it("creates the documented OAuth URL without putting a secret in it", () => {
    const twitch = new TwitchClient({ clientId: "client-id", clientSecret: "very-secret", redirectUri: "http://localhost:3001/auth/twitch/callback" }, vi.fn(), vi.fn());
    const url = new URL(twitch.authorizeUrl());
    expect(url.origin).toBe("https://id.twitch.tv"); expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3001/auth/twitch/callback"); expect(url.searchParams.get("scope")).toBe("user:read:chat"); expect(url.toString()).not.toContain("very-secret");
  });
  it("uses authenticated broadcaster ID and token for chat subscription", async () => {
    vi.stubGlobal("WebSocket", FakeWebSocket); const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "access-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "42", login: "quester" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 202 })); vi.stubGlobal("fetch", fetchMock);
    const onChat = vi.fn(); const twitch = new TwitchClient({ clientId: "client-id", clientSecret: "server-secret", redirectUri: "http://localhost:3001/auth/twitch/callback" }, onChat, vi.fn());
    const url = new URL(twitch.authorizeUrl()); await twitch.callback("code", url.searchParams.get("state")!); await FakeWebSocket.instances[0].emit("message", { metadata: { message_type: "session_welcome" }, payload: { session: { id: "session-1" } } });
    const request = fetchMock.mock.calls[2]; expect(request[0]).toBe("https://api.twitch.tv/helix/eventsub/subscriptions"); expect((request[1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer access-token", "Client-Id": "client-id" }); expect(JSON.parse(String((request[1] as RequestInit).body))).toMatchObject({ type: "channel.chat.message", condition: { broadcaster_user_id: "42", user_id: "42" }, transport: { method: "websocket", session_id: "session-1" } }); expect(twitch.status().connected).toBe(true);
    await FakeWebSocket.instances[0].emit("message", { metadata: { message_type: "notification" }, payload: { subscription: { type: "channel.chat.message" }, event: { chatter_user_id: "u1", chatter_user_name: "Viewer", message: { text: "!join" } } } }); expect(onChat).toHaveBeenCalledWith("u1", "Viewer", "!join");
  });
  it("deduplicates EventSub notifications by Twitch message ID", async () => {
    vi.stubGlobal("WebSocket", FakeWebSocket); const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "42", login: "quester" }] }), { status: 200 })).mockResolvedValueOnce(new Response("{}", { status: 202 })); vi.stubGlobal("fetch", fetchMock);
    const onChat = vi.fn(); const twitch = new TwitchClient({ clientId: "id", clientSecret: "secret", redirectUri: "http://localhost/callback" }, onChat, vi.fn()); const state = new URL(twitch.authorizeUrl()).searchParams.get("state")!; await twitch.callback("code", state); const socket = FakeWebSocket.instances[0]; await socket.emit("message", { metadata: { message_type: "session_welcome" }, payload: { session: { id: "one" } } }); const event = { metadata: { message_type: "notification", message_id: "delivery-1" }, payload: { subscription: { type: "channel.chat.message" }, event: { chatter_user_id: "u", chatter_user_name: "A", message: { text: "!join" } } } }; await socket.emit("message", event); await socket.emit("message", event); expect(onChat).toHaveBeenCalledTimes(1);
  });
  it("refreshes the token after a 401 while creating a subscription", async () => {
    vi.stubGlobal("WebSocket", FakeWebSocket); const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "initial", refresh_token: "refresh" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "42", login: "quester" }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "renewed", refresh_token: "renewed-refresh" }), { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 202 })); vi.stubGlobal("fetch", fetchMock);
    const twitch = new TwitchClient({ clientId: "id", clientSecret: "secret", redirectUri: "http://localhost/callback" }, vi.fn(), vi.fn()); const state = new URL(twitch.authorizeUrl()).searchParams.get("state")!; await twitch.callback("code", state); await FakeWebSocket.instances[0].emit("message", { metadata: { message_type: "session_welcome" }, payload: { session: { id: "one" } } });
    expect(fetchMock).toHaveBeenCalledTimes(5); expect(String((fetchMock.mock.calls[3][1] as RequestInit).body)).toContain("grant_type=refresh_token"); expect((fetchMock.mock.calls[4][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer renewed" }); expect(twitch.status().connected).toBe(true);
  });
  it("reports an EventSub subscription failure", async () => {
    vi.stubGlobal("WebSocket", FakeWebSocket); const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "42", login: "quester" }] }), { status: 200 })).mockResolvedValueOnce(new Response("{}", { status: 403 })); vi.stubGlobal("fetch", fetchMock);
    const twitch = new TwitchClient({ clientId: "id", clientSecret: "secret", redirectUri: "http://localhost/callback" }, vi.fn(), vi.fn()); const state = new URL(twitch.authorizeUrl()).searchParams.get("state")!; await twitch.callback("code", state); await FakeWebSocket.instances[0].emit("message", { metadata: { message_type: "session_welcome" }, payload: { session: { id: "one" } } }); expect(twitch.status()).toMatchObject({ connection: "error", connected: false });
  });
  it("preserves the subscription during a Twitch-directed reconnect", async () => {
    vi.stubGlobal("WebSocket", FakeWebSocket); const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "token" }), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "42", login: "quester" }] }), { status: 200 })).mockResolvedValueOnce(new Response("{}", { status: 202 })); vi.stubGlobal("fetch", fetchMock);
    const twitch = new TwitchClient({ clientId: "id", clientSecret: "secret", redirectUri: "http://localhost/callback" }, vi.fn(), vi.fn()); const state = new URL(twitch.authorizeUrl()).searchParams.get("state")!; await twitch.callback("code", state); const first = FakeWebSocket.instances[0]; await first.emit("message", { metadata: { message_type: "session_welcome" }, payload: { session: { id: "one" } } }); await first.emit("message", { metadata: { message_type: "session_reconnect" }, payload: { session: { reconnect_url: "wss://reconnect.example" } } }); expect(FakeWebSocket.instances[1].url).toBe("wss://reconnect.example"); await FakeWebSocket.instances[1].emit("message", { metadata: { message_type: "session_welcome" }, payload: { session: { id: "two" } } }); expect(fetchMock).toHaveBeenCalledTimes(3); expect(twitch.status().connected).toBe(true);
  });
});
