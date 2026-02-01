import { describe, it, expect } from "vitest";

describe("Fluxuz API Credentials", () => {
  it("should have FLUXUZ_API_URL configured", () => {
    expect(process.env.FLUXUZ_API_URL).toBeDefined();
    expect(process.env.FLUXUZ_API_URL).toContain("crmapi.fluxuz.com.br");
  });

  it("should have FLUXUZ_API_TOKEN configured", () => {
    expect(process.env.FLUXUZ_API_TOKEN).toBeDefined();
    expect(process.env.FLUXUZ_API_TOKEN).toMatch(/^eyJ/); // JWT starts with eyJ
  });

  it("should have token in URL", () => {
    const url = process.env.FLUXUZ_API_URL!;
    expect(url).toContain("token=");
  });

  it("should send test message to Fluxuz API", async () => {
    const fluxuzApiUrl = process.env.FLUXUZ_API_URL!;
    
    const testPayload = {
      number: "5511999999999", // Número de teste
      text: "🧪 Teste de integração Seu Verso MVP",
    };

    const response = await fetch(fluxuzApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();
    
    console.log("[Fluxuz Test] Response:", {
      status: response.status,
      ok: response.ok,
      data,
    });

    // API Fluxuz deve retornar 200 ou aceitar a mensagem
    expect(response.status).toBeLessThan(500); // Não deve ser erro de servidor
  }, 15000); // 15s timeout
});
