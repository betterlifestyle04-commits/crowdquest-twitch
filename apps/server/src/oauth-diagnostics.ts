/** Return safe error categories; never expose OAuth codes, secrets, response bodies or query contents. */
export type OAuthFailureCode = "access_denied" | "invalid_state" | "token_exchange" | "user_lookup" | "twitch_rejected" | "unexpected";
export function classifyOAuthFailure(error: unknown, providerError?: unknown): OAuthFailureCode {
  if (typeof providerError === "string") return providerError === "access_denied" ? "access_denied" : "twitch_rejected";
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Invalid or expired OAuth state")) return "invalid_state";
  if (message.includes("Twitch token exchange failed") || message.includes("Twitch token response")) return "token_exchange";
  if (message.includes("Twitch account lookup failed") || message.includes("Twitch API request failed")) return "user_lookup";
  return "unexpected";
}
