/**
 * Teste End-to-End Completo
 * Simula fluxo completo: criar job → Suno gera música → webhook → Fluxuz
 */

import { createFluxuzPayload, sendToFluxuz } from "./fluxuz";

console.log("🧪 Teste End-to-End Completo\n");
console.log("=" + "=".repeat(60) + "\n");

// Simular dados de uma música gerada
const mockJobId = "test-job-" + Date.now();
const mockName = "Maria Silva";
const mockWhatsApp = "5511987654321";
const mockMusicTitle = "Aniversário da Maria";
const mockAudioUrl = "https://cdn.suno.com/audio/test-123.mp3";
const mockShareSlug = "maria-silva-aniversario";
const mockLyrics = `Hoje é dia de festa
Maria está de parabéns
Vamos cantar e dançar
Com todos os nossos amigos`;
const mockImageUrl = "https://cdn.suno.com/image/test-123.jpg";

console.log("📋 Dados do Teste:");
console.log(`- Job ID: ${mockJobId}`);
console.log(`- Nome: ${mockName}`);
console.log(`- WhatsApp: ${mockWhatsApp}`);
console.log(`- Título: ${mockMusicTitle}`);
console.log(`- Slug: ${mockShareSlug}\n`);

// Criar payload Fluxuz
console.log("1️⃣ Criando payload Fluxuz...");
const payload = createFluxuzPayload(
  mockJobId,
  mockName,
  mockWhatsApp,
  mockMusicTitle,
  mockAudioUrl,
  mockShareSlug,
  mockLyrics,
  mockImageUrl
);

console.log("✅ Payload criado:");
console.log(JSON.stringify(payload, null, 2));
console.log();

// Testar envio para Fluxuz
console.log("2️⃣ Enviando para Fluxuz...");
console.log("⚠️  Nota: Este teste vai falhar se FLUXUZ_API_TOKEN não estiver configurado");
console.log("⚠️  Erro 403 é esperado se token estiver incorreto\n");

const result = await sendToFluxuz(payload);

if (result) {
  console.log("✅ Fluxuz enviado com sucesso!");
} else {
  console.log("❌ Fluxuz falhou (verifique logs acima)");
}

console.log("\n" + "=".repeat(60));
console.log("🎯 Teste Concluído");
console.log("=" + "=".repeat(60));

console.log("\n💬 Mensagem WhatsApp Esperada:");
console.log(`
Olá ${payload.name}! 🎵

Sua música "${payload.musicTitle}" está pronta!

🎧 Ouça agora: ${payload.musicUrl}

Compartilhe com seus amigos!
`);
