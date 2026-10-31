import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTwitchSetupProgress, TwitchConnectionGuide } from "../src/TwitchConnectionGuide";

const offline = { configured: false, connected: false, login: null, connection: "not_configured", message: "Twitch credentials are not configured" };

describe("Clear Twitch channel onboarding", () => {
  it("shows why hosted Twitch is blocked without pretending it is connected", () => {
    const html = renderToStaticMarkup(createElement(TwitchConnectionGuide, {
      twitch: offline, controlsProtected: true, hostTokenConfigured: false, controlToken: "", apiUrl: "https://example.invalid"
    }));
    expect(html).toContain("SETUP NEEDED");
    expect(html).toContain("TWITCH_CLIENT_ID");
    expect(html).toContain("TWITCH_CLIENT_SECRET");
    expect(html).toContain("TWITCH_REDIRECT_URI");
    expect(html).toContain("STREAMER_CONTROL_TOKEN");
    expect(html).toContain("Twitch Developer Console");
    expect(html).toContain("Connect Twitch securely");
    expect(html).toContain("disabled");
    expect(html).not.toContain("LIVE TWITCH");
  });
  it("does not mistake a private token entered in the browser for a configured server token", () => {
    const blocked = getTwitchSetupProgress({...offline,configured:true},true,false,true);
    expect(blocked.needsServerToken).toBe(true);
    expect(blocked.accessReady).toBe(false);
    expect(getTwitchSetupProgress({...offline,configured:true},true,true,false).accessReady).toBe(false);
    expect(getTwitchSetupProgress({...offline,configured:true},true,true,true)).toMatchObject({
      appReady:true,accessReady:true,online:false
    });
  });
  it("supports the earlier local flow when server protections are disabled",()=>{
    expect(getTwitchSetupProgress({...offline,configured:true},false,false,false).accessReady).toBe(true);
  });
  it("shows real channel instructions only after server actually confirms connection",()=>{
    const html = renderToStaticMarkup(createElement(TwitchConnectionGuide, {
      twitch:{...offline,configured:true,connected:true,login:"teststreamer",connection:"connected",message:"Twitch chat connected"},
      controlsProtected:true,hostTokenConfigured:true,controlToken:"test-only",apiUrl:"https://example.invalid"
    }));
    expect(html).toContain("LIVE TWITCH");
    expect(html).toContain("@teststreamer");
    expect(html).toContain("!join");
    expect(html).toContain("!role warrior");
    expect(html).toContain("!path B");
    expect(html).toContain("!act attack");
    expect(html).not.toContain("TWITCH_CLIENT_SECRET");
  });
});
