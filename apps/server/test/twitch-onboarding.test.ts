import { describe, expect, it } from "vitest";
import { TwitchClient } from "../src/twitch";

const mk = (clientId = "", clientSecret = "", redirectUri = "") =>
  new TwitchClient({clientId,clientSecret,redirectUri},()=>{},()=>{});

describe("Twitch connection readiness without exchanging secrets",()=>{
  it("reports missing credentials clearly and refuses OAuth without configuration",()=>{
    const client=mk();
    expect(client.status()).toMatchObject({configured:false,connected:false,connection:"not_configured"});
    expect(()=>client.authorizeUrl()).toThrow("Twitch credentials are not configured");
  });
  it("shows ready-to-authorize once server settings exist, without pretending to be live",()=>{
    const client=mk("test-id","test-secret","http://localhost:3001/auth/twitch/callback");
    expect(client.status()).toMatchObject({configured:true,connected:false,connection:"disconnected"});
    expect(client.status().message).toContain("Authorize your broadcaster account");
    const url = new URL(client.authorizeUrl());
    expect(url.origin).toBe("https://id.twitch.tv");
    expect(url.pathname).toBe("/oauth2/authorize");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3001/auth/twitch/callback");
    expect(url.searchParams.get("scope")).toBe("user:read:chat");
    expect(url.searchParams.get("client_secret")).toBeNull();
    expect(client.status().connection).toBe("authorizing");
    expect(client.status().connected).toBe(false);
  });
});
