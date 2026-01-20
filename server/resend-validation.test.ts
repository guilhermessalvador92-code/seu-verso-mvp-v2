import { describe, it, expect } from "vitest";

describe("Resend API Validation", () => {
  it("should validate Resend API key by sending test email", async () => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const RESEND_API_URL = "https://api.resend.com/emails";

    expect(RESEND_API_KEY).toBeDefined();
    expect(RESEND_API_KEY?.length).toBeGreaterThan(0);

    console.log("✅ RESEND_API_KEY is configured");

    // Testar envio de email de teste
    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@seu-verso.com",
          to: "delivered@resend.dev", // Email de teste da Resend
          subject: "🎵 Seu Verso - Teste de Configuração",
          html: `
            <html>
              <body>
                <h1>Teste de Configuração</h1>
                <p>Se você recebeu este email, a Resend API está funcionando corretamente!</p>
                <p>Seu Verso - Músicas Personalizadas com IA</p>
              </body>
            </html>
          `,
        }),
      });

      const data = await response.json();

      console.log("Resend API Response:", {
        status: response.status,
        statusText: response.statusText,
        data,
      });

      if (response.ok) {
        console.log("✅ Resend API is working correctly!");
        console.log("✅ Email sent successfully:", data.id);
        expect(response.status).toBe(200);
        expect(data.id).toBeDefined();
      } else {
        console.error("❌ Resend API returned error:", data);
        throw new Error(`Resend API error: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("❌ Failed to validate Resend API:", error);
      throw error;
    }
  });

  it("should validate email sending function", async () => {
    const { sendEmail } = await import("./email");

    const result = await sendEmail({
      to: "delivered@resend.dev",
      subject: "🎵 Seu Verso - Teste de Função",
      html: "<h1>Teste de Função</h1><p>Se você recebeu este email, a função sendEmail está funcionando!</p>",
    });

    console.log("✅ sendEmail function result:", result);
    expect(result).toBe(true);
  });
});
