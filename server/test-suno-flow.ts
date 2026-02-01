/**
 * Teste Completo do Fluxo Suno API
 * Identifica exatamente onde o fluxo está quebrando
 */

import { generateMusicWithSuno } from "./suno";

async function testSunoFlow() {
  console.log("=".repeat(80));
  console.log("🔬 TESTE COMPLETO DO FLUXO SUNO API");
  console.log("=".repeat(80));
  console.log("");

  // TESTE 1: Verificar chave API
  console.log("📋 TESTE 1: Verificar SUNO_API_KEY");
  console.log("-".repeat(80));
  const sunoKey = process.env.SUNO_API_KEY;
  if (!sunoKey) {
    console.error("❌ SUNO_API_KEY não configurada!");
    process.exit(1);
  }
  console.log(`✅ SUNO_API_KEY configurada: ${sunoKey.substring(0, 8)}...${sunoKey.substring(sunoKey.length - 4)}`);
  console.log(`   Tamanho: ${sunoKey.length} caracteres`);
  console.log("");

  // TESTE 2: Verificar URL base
  console.log("📋 TESTE 2: Verificar URL base da Suno API");
  console.log("-".repeat(80));
  const baseUrl = "https://apibox.erweima.ai/api/v1";
  console.log(`✅ URL base: ${baseUrl}`);
  console.log("");

  // TESTE 3: Testar conexão com endpoint de detalhes
  console.log("📋 TESTE 3: Testar conexão com Suno API (GET /getDetails)");
  console.log("-".repeat(80));
  try {
    const testUrl = `${baseUrl}/getDetails?taskId=test123`;
    console.log(`   Testando: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${sunoKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      console.error("❌ ERRO 401: Chave API inválida ou sem permissão!");
      const errorBody = await response.text();
      console.error(`   Resposta: ${errorBody}`);
      process.exit(1);
    }

    const responseBody = await response.text();
    console.log(`   Resposta: ${responseBody.substring(0, 200)}...`);
    console.log("✅ Conexão com Suno API OK");
  } catch (error: any) {
    console.error(`❌ Erro ao conectar: ${error.message}`);
    process.exit(1);
  }
  console.log("");

  // TESTE 4: Testar payload de geração
  console.log("📋 TESTE 4: Preparar payload de teste");
  console.log("-".repeat(80));
  const testPayload = {
    title: "Música de Teste Diagnóstico",
    prompt: "Crie uma música de teste em português brasileiro com vocais masculinos sobre um dia ensolarado",
    style: "Pop",
    callBackUrl: "http://localhost:3000/api/webhook/suno",
  };
  console.log("   Payload:");
  console.log(JSON.stringify(testPayload, null, 2));
  console.log("");

  // TESTE 5: Fazer requisição real de geração
  console.log("📋 TESTE 5: Fazer requisição REAL de geração de música");
  console.log("-".repeat(80));
  console.log("⚠️  ATENÇÃO: Isso vai consumir créditos da sua conta Suno!");
  console.log("   Aguardando 3 segundos para cancelar se necessário...");
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    console.log("   Enviando requisição...");
    const result = await generateMusicWithSuno(
      "test-job-id-" + Date.now(),
      testPayload.prompt,
      testPayload.style,
      testPayload.title,
      testPayload.callBackUrl,
      "m"
    );

    console.log("✅ SUCESSO! Música criada:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");
    console.log("🎉 TODOS OS TESTES PASSARAM!");
    console.log("   O problema NÃO está na integração Suno.");
    console.log("   Verifique o fluxo do frontend → backend.");
  } catch (error: any) {
    console.error("❌ ERRO ao gerar música:");
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    
    if (error.message?.includes("401")) {
      console.error("");
      console.error("💡 DIAGNÓSTICO: Chave API inválida");
      console.error("   Verifique se a chave está correta e ativa");
    } else if (error.message?.includes("403")) {
      console.error("");
      console.error("💡 DIAGNÓSTICO: Sem permissão");
      console.error("   Verifique se a conta tem créditos");
    } else if (error.message?.includes("timeout")) {
      console.error("");
      console.error("💡 DIAGNÓSTICO: Timeout");
      console.error("   API Suno pode estar lenta ou indisponível");
    }
    
    process.exit(1);
  }
  
  console.log("=".repeat(80));
}

// Executar teste
testSunoFlow().catch(console.error);
