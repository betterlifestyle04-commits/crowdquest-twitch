import { describe, expect, it, vi } from "vitest";
import { classifyOAuthFailure } from "../src/oauth-diagnostics.js";
import { TwitchClient } from "../src/twitch.js";

describe("safe OAuth callback diagnostics", () => {
  it("distinguishes cancellation, stale state, token rejection and user lookup", () => {
    expect(classifyOAuthFailure(undefined,"access_denied")).toBe("access_denied");
    expect(classifyOAuthFailure(undefined,"redirect_mismatch")).toBe("twitch_rejected");
    expect(classifyOAuthFailure(new Error("Invalid or expired OAuth state"))).toBe("invalid_state");
    expect(classifyOAuthFailure(new Error("Twitch token exchange failed (400)"))).toBe("token_exchange");
    expect(classifyOAuthFailure(new Error("Twitch API request failed (401)"))).toBe("user_lookup");
  });
  it("never exposes unknown secrets and permits retrying from a new OAuth URL", () => {
    const secret="secret-access-token-for-test-only";
    expect(classifyOAuthFailure(new Error(secret))).toBe("unexpected");
    expect(classifyOAuthFailure(undefined,secret)).toBe("twitch_rejected");
    const onChange=vi.fn();
    const client=new TwitchClient({clientId:"id",clientSecret:"hidden",redirectUri:"http://localhost:3001/auth/twitch/callback"},vi.fn(),onChange);
    client.authorizationFailed("invalid_state");
    expect(client.status()).toMatchObject({connection:"error",connected:false});
    expect(client.status().message).not.toContain("hidden");
    expect(new URL(client.authorizeUrl()).pathname).toBe("/oauth2/authorize");
    expect(client.status().connection).toBe("authorizing");
    expect(onChange).toHaveBeenCalled();
  });
});
