/**
 * Teste de validação das credenciais Fluxuz
 */

import { describe, it, expect } from "vitest";
import { createFluxuzPayload, sendToFluxuz } from "./fluxuz";

describe("Fluxuz Integration", () => {
  it("should have FLUXUZ_PUSH_URL configured", () => {
    const url = process.env.FLUXUZ_PUSH_URL || process.env.FLUXUZ_API_URL;
    expect(url).toBeDefined();
    expect(url).toContain("fluxuz.com.br");
  });

  it("should have FLUXUZ_API_TOKEN configured", () => {
    const token = process.env.FLUXUZ_API_TOKEN || process.env.FLUXUZ_API_KEY;
    expect(token).toBeDefined();
    expect(token).not.toBe("");
  });

  it("should create valid payload structure", () => {
    const payload = createFluxuzPayload(
      "test-job-123",
      "João Silva",
      "5511999999999",
      "Música Teste",
      "https://cdn.suno.com/audio.mp3",
      "joao-silva-123",
      "Letra da música",
      "https://cdn.suno.com/image.jpg"
    );

    expect(payload).toHaveProperty("name", "João Silva");
    expect(payload).toHaveProperty("whatsapp", "5511999999999");
    expect(payload).toHaveProperty("musicTitle", "Música Teste");
    expect(payload).toHaveProperty("audioUrl");
    expect(payload).toHaveProperty("musicUrl");
    expect(payload).toHaveProperty("shareSlug");
    expect(payload).toHaveProperty("jobId");
  });

  it("should send to Fluxuz successfully", async () => {
    const payload = createFluxuzPayload(
      "test-job-" + Date.now(),
      "Maria Teste",
      "5511987654321",
      "Música de Teste",
      "https://cdn.suno.com/audio-test.mp3",
      "maria-teste-123",
      "Esta é uma letra de teste",
      "https://cdn.suno.com/image-test.jpg"
    );

    // Este teste vai falhar se as credenciais estiverem incorretas
    const result = await sendToFluxuz(payload);
    
    // Se retornar false, as credenciais estão incorretas
    expect(result).toBe(true);
  }, 15000); // Timeout de 15s para requisição HTTP
});
