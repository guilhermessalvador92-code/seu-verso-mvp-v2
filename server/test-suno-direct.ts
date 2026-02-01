/**
 * Teste DIRETO da Suno API - SEM Gemini
 * Bypassa LLM e testa apenas a integração Suno
 */

const SUNO_API_KEY = "bdb9cda0f3656d035c741ae1885e9a46";
const SUNO_API_BASE = "https://apibox.erweima.ai";

async function testSunoDirectly() {
  console.log("=".repeat(80));
  console.log("🚀 TESTE DIRETO SUNO API - SEM GEMINI");
  console.log("=".repeat(80));
  console.log("");

  // TESTE 1: Verificar chave
  console.log("📋 TESTE 1: Verificar configuração");
  console.log("-".repeat(80));
  console.log(`✅ SUNO_API_KEY: ${SUNO_API_KEY.substring(0, 8)}...${SUNO_API_KEY.substring(SUNO_API_KEY.length - 4)}`);
  console.log(`✅ SUNO_API_BASE: ${SUNO_API_BASE}`);
  console.log("");

  // TESTE 2: Criar payload mínimo
  console.log("📋 TESTE 2: Criar payload de teste");
  console.log("-".repeat(80));
  
  const payload = {
    customMode: true,
    instrumental: false,
    model: "V4_5PLUS",
    callBackUrl: "https://3000-iicjteoujcg6swhq2c79e-ce173a8c.us1.manus.computer/api/webhook/suno",
    prompt: "Crie uma música alegre em português brasileiro sobre um dia ensolarado. IMPORTANTE: Esta DEVE ser uma MÚSICA com VOCAIS e LETRAS. Inclua canto com letras claras em português.",
    style: "Pop, upbeat, catchy melodies",
    title: "Dia Ensolarado - Teste",
    vocalGender: "m",
    styleWeight: 0.8,
    weirdnessConstraint: 0.4,
    audioWeight: 0.7,
  };

  console.log("Payload completo:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("");

  // TESTE 3: Enviar requisição
  console.log("📋 TESTE 3: Enviar requisição para Suno API");
  console.log("-".repeat(80));
  console.log("⚠️  ATENÇÃO: Isso vai consumir créditos!");
  console.log("   Aguardando 3 segundos...");
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const url = `${SUNO_API_BASE}/api/v1/generate`;
    console.log(`   POST ${url}`);
    console.log("");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`📊 Resposta HTTP: ${response.status} ${response.statusText}`);
    console.log("");

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("❌ Resposta não é JSON válido:");
      console.error(responseText);
      process.exit(1);
    }

    console.log("📦 Resposta completa:");
    console.log(JSON.stringify(data, null, 2));
    console.log("");

    // Analisar resposta
    if (data.code === 200) {
      console.log("✅ SUCESSO! Música em geração!");
      console.log(`   Task ID: ${data.data?.taskId}`);
      console.log("");
      console.log("🎉 TESTE PASSOU! Suno API está funcionando!");
      console.log("");
      console.log("📝 Próximos passos:");
      console.log("   1. Aguardar webhook em: " + payload.callBackUrl);
      console.log("   2. Verificar logs do servidor");
      console.log("   3. Conferir se música aparece no painel Suno");
    } else if (data.code === 401) {
      console.error("❌ ERRO 401: Chave API inválida!");
      console.error("   Verifique se a chave está correta");
    } else if (data.code === 400) {
      console.error("❌ ERRO 400: Payload inválido!");
      console.error(`   Mensagem: ${data.msg}`);
      console.error("   Verifique os campos obrigatórios");
    } else if (data.code === 403) {
      console.error("❌ ERRO 403: Sem créditos ou permissão!");
      console.error("   Verifique saldo da conta");
    } else {
      console.error(`❌ ERRO ${data.code}: ${data.msg}`);
    }

  } catch (error: any) {
    console.error("❌ ERRO na requisição:");
    console.error(`   ${error.message}`);
    console.error("");
    console.error("Stack trace:");
    console.error(error.stack);
    process.exit(1);
  }

  console.log("=".repeat(80));
}

// Executar
testSunoDirectly().catch(console.error);
