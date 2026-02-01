import { describe, it, expect } from "vitest";

describe("APP_URL Configuration", () => {
  it("should have APP_URL environment variable set", () => {
    const appUrl = process.env.APP_URL;
    
    expect(appUrl).toBeDefined();
    expect(appUrl).not.toBe("");
    expect(appUrl).toMatch(/^https?:\/\//);
    
    console.log("[Test] APP_URL configured:", appUrl);
  });

  it("should construct valid webhook URL", () => {
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/webhook/suno`;
    
    expect(webhookUrl).toMatch(/^https?:\/\/.+\/api\/webhook\/suno$/);
    expect(webhookUrl).not.toContain("localhost");
    
    console.log("[Test] Webhook URL:", webhookUrl);
  });
});
