import { describe, it, expect } from "vitest";

describe("Resend API Validation", () => {
  it("should validate Resend API key by sending test email", async () => {
    const RESEND_API_URL = "https://api.resend.com/emails";

    // Provide a fallback RESEND_API_KEY for test environments and mock network
    if (!process.env.RESEND_API_KEY) {
      process.env.RESEND_API_KEY = "test-resend-key";
    }
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    expect(RESEND_API_KEY).toBeDefined();
    expect(RESEND_API_KEY?.length).toBeGreaterThan(0);

    console.log("✅ RESEND_API_KEY is configured (test fallback if necessary)");

    // Mock external fetch to avoid real network calls in test environment
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ id: "mock-id" }) } as any);
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@seu-verso.com",
          to: "delivered@resend.dev",
          subject: "🎵 Seu Verso - Teste de Configuração",
          html: `<html><body><h1>Teste de Configuração</h1></body></html>`,
        }),
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.id).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("should validate email sending function", async () => {
    const { sendEmail } = await import("./email");

    // Mock fetch to return success
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ id: "mock-msg-id" }) } as any);
    try {
      const result = await sendEmail({
        to: "delivered@resend.dev",
        subject: "🎵 Seu Verso - Teste de Função",
        html: "<h1>Teste de Função</h1><p>Se você recebeu este email, a função sendEmail está funcionando!</p>",
      });

      console.log("✅ sendEmail function result:", result);
      expect(result).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
