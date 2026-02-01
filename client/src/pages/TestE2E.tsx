import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Music, Send, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function TestE2E() {
  const [logs, setLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "polling" | "success" | "error">("idle");

  const createMutation = trpc.jobs.create.useMutation();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR");
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleTest = async () => {
    setLogs([]);
    setStatus("creating");
    addLog("🚀 Iniciando teste end-to-end...");

    try {
      // 1. Criar música
      addLog("📝 Criando job de música...");
      const result = await createMutation.mutateAsync({
        name: "Teste E2E",
        whatsapp: "+5553846158886",
        story: "Uma história de teste para validar o sistema completo",
        style: "Pop",
        title: "Música de Teste E2E",
        occasion: "birthday",
        mood: "Romântico",
        agreedToTerms: true,
      });

      addLog(`✅ Job criado: ${result.jobId}`);
      setJobId(result.jobId);

      // 2. Aguardar processamento
      addLog("⏳ Aguardando Suno API gerar música...");
      setStatus("polling");

      // Polling manual (simples)
      let attempts = 0;
      const maxAttempts = 60; // 5 minutos (5s * 60)

      const checkStatus = async (): Promise<boolean> => {
        attempts++;
        addLog(`🔍 Verificando status (tentativa ${attempts}/${maxAttempts})...`);

        try {
          const statusResult = await fetch(`/api/trpc/jobs.getStatus?input=${encodeURIComponent(JSON.stringify({ jobId: result.jobId }))}`);
          const data = await statusResult.json();
          
          const job = data.result?.data;
          
          if (!job) {
            addLog("❌ Job não encontrado");
            return false;
          }

          addLog(`📊 Status: ${job.status}`);

          if (job.status === "completed") {
            addLog("🎉 Música gerada com sucesso!");
            addLog(`🎵 Título: ${job.musicTitle}`);
            addLog(`🔗 Audio URL: ${job.audioUrl}`);
            addLog(`📝 Share Slug: ${job.shareSlug}`);
            
            if (job.fluxuzSent) {
              addLog("✅ WhatsApp enviado via Fluxuz!");
            } else {
              addLog("⚠️ WhatsApp não foi enviado");
            }
            
            setStatus("success");
            return true;
          }

          if (job.status === "failed") {
            addLog(`❌ Falha: ${job.errorMessage || "Erro desconhecido"}`);
            setStatus("error");
            return false;
          }

          // Continuar polling
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s
            return checkStatus();
          } else {
            addLog("⏱️ Timeout: Música não foi gerada em 5 minutos");
            setStatus("error");
            return false;
          }
        } catch (error) {
          addLog(`❌ Erro ao verificar status: ${error}`);
          return false;
        }
      };

      await checkStatus();
    } catch (error: any) {
      addLog(`❌ Erro: ${error.message || error}`);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">🧪 Teste End-to-End</h1>
            <p className="text-muted-foreground">
              Teste completo: Criação de música + Envio WhatsApp
            </p>
          </div>

          {/* Botão de teste */}
          <div className="flex justify-center mb-8">
            <Button
              size="lg"
              onClick={handleTest}
              disabled={status === "creating" || status === "polling"}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {status === "creating" && (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando Música...
                </>
              )}
              {status === "polling" && (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-pulse" />
                  Aguardando Suno...
                </>
              )}
              {status === "success" && (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Teste Concluído!
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Erro - Tentar Novamente
                </>
              )}
              {status === "idle" && (
                <>
                  <Music className="mr-2 h-5 w-5" />
                  Iniciar Teste
                </>
              )}
            </Button>
          </div>

          {/* Job ID */}
          {jobId && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-mono">
                <strong>Job ID:</strong> {jobId}
              </p>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <Card className={`p-4 text-center ${status === "creating" ? "border-blue-500 border-2" : ""}`}>
              <Music className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-semibold">Criar Música</p>
              <p className="text-xs text-muted-foreground">Suno API</p>
            </Card>

            <Card className={`p-4 text-center ${status === "polling" ? "border-yellow-500 border-2" : ""}`}>
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-semibold">Processar</p>
              <p className="text-xs text-muted-foreground">Aguardar geração</p>
            </Card>

            <Card className={`p-4 text-center ${status === "success" ? "border-green-500 border-2" : ""}`}>
              <Send className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-semibold">Enviar WhatsApp</p>
              <p className="text-xs text-muted-foreground">Fluxuz</p>
            </Card>
          </div>

          {/* Informações */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">ℹ️ Informações do Teste:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Nome: Teste E2E</li>
              <li>WhatsApp: +5553846158886</li>
              <li>Idioma: Português Brasileiro</li>
              <li>Ocasião: Aniversário</li>
              <li>Tempo estimado: 1-3 minutos</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
