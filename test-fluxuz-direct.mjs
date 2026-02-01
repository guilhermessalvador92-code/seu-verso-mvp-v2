#!/usr/bin/env node

/**
 * Teste direto da API Fluxuz
 * Executa: node test-fluxuz-direct.mjs
 */

const FLUXUZ_API_URL = "https://crmapi.fluxuz.com.br/v1/api/external/63099a7b-9c33-41fe-b705-0b9cddb1b73c/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5hbnRJZCI6MSwicHJvZmlsZSI6ImFkbWluIiwic2Vzc2lvbklkIjo3NiwiY2hhbm5lbFR5cGUiOiJ3aGF0c2FwcCIsImlhdCI6MTc2OTk2Nzg5NCwiZXhwIjoxODMzMDM5ODk0fQ.kEGC8t2waOtknsmHAxjIRTzY70nJy6ljqtCcLJSe89M";

const payload = {
  message: "🧪 Teste Seu Verso - Música pronta! 🎵",
  number: "+5553846158886",
  externalKey: `test-${Date.now()}`,
};

console.log("🚀 Testando API Fluxuz...\n");
console.log("📤 Payload:", JSON.stringify(payload, null, 2));
console.log("\n📡 Enviando...\n");

try {
  const response = await fetch(FLUXUZ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log("📥 Response Status:", response.status, response.statusText);

  const data = await response.json();
  console.log("\n📦 Response Body:");
  console.log(JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log("\n✅ SUCESSO! Mensagem enviada para Fluxuz");
    console.log("🎫 Ticket ID:", data.message?.ticketId);
    console.log("🔑 External Key:", data.message?.ticket?.externalKey);
  } else {
    console.log("\n❌ ERRO! Falha ao enviar mensagem");
  }
} catch (error) {
  console.error("\n❌ ERRO DE CONEXÃO:", error.message);
  process.exit(1);
}
