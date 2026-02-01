/**
 * Teste do novo payload Fluxuz (estrutura plana)
 */

import { createFluxuzPayload } from "./fluxuz";

console.log("🧪 Testando novo payload Fluxuz...\n");

const payload = createFluxuzPayload(
  "job-123",
  "João Silva",
  "5511999999999",
  "Música do João",
  "https://cdn.suno.com/audio/123.mp3",
  "joao-silva-123",
  "Essa é a letra da música\nCom várias linhas\nPara testar",
  "https://cdn.suno.com/image/123.jpg"
);

console.log("✅ Payload gerado:");
console.log(JSON.stringify(payload, null, 2));

console.log("\n📋 Variáveis disponíveis no Fluxuz:");
console.log("- {{name}} →", payload.name);
console.log("- {{whatsapp}} →", payload.whatsapp);
console.log("- {{musicTitle}} →", payload.musicTitle);
console.log("- {{audioUrl}} →", payload.audioUrl);
console.log("- {{musicUrl}} →", payload.musicUrl);
console.log("- {{shareSlug}} →", payload.shareSlug);
console.log("- {{jobId}} →", payload.jobId);

console.log("\n💬 Exemplo de mensagem WhatsApp:");
console.log(`
Olá {{name}}! 🎵

Sua música "{{musicTitle}}" está pronta!

🎧 Ouça agora: {{musicUrl}}

Compartilhe com seus amigos usando o código: {{shareSlug}}
`);
