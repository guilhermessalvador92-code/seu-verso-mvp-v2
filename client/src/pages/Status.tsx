import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Music } from "lucide-react";
import { JOB_STEPS } from "@shared/types";

export default function Status() {
  const [match, params] = useRoute("/status/:jobId");
  const [, setLocation] = useLocation();
  const jobId = params?.jobId;

  const [currentStep, setCurrentStep] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [hasFinished, setHasFinished] = useState(false);

  const { data: status, isLoading, refetch } = trpc.jobs.getStatus.useQuery(
    { jobId: jobId || "" },
    { 
      enabled: !!jobId && !hasFinished, 
      refetchInterval: autoRefresh && !hasFinished ? 3000 : false 
    }
  );

  // Sincronizar steps com status real
  useEffect(() => {
    if (!status) return;

    if (status.status === "QUEUED") {
      setCurrentStep(0);
    } else if (status.status === "PROCESSING") {
      // Animar enquanto está processando
      setCurrentStep(1);
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < JOB_STEPS.length - 2 ? prev + 1 : JOB_STEPS.length - 2));
      }, 1500);
      return () => clearInterval(interval);
    } else if (status.status === "DONE") {
      setCurrentStep(JOB_STEPS.length - 1);
      setAutoRefresh(false);
      setHasFinished(true);
    } else if (status.status === "FAILED") {
      setAutoRefresh(false);
      setHasFinished(true);
    }
  }, [status?.status]);

  if (!match || !jobId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="border-slate-200 w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold mb-4">Job não encontrado</p>
            <Button onClick={() => setLocation("/")} className="bg-purple-600 hover:bg-purple-700">
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="border-slate-200 w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-slate-900 font-semibold">Carregando status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="border-slate-200 w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold mb-4">Erro ao carregar status</p>
            <Button onClick={() => refetch()} className="bg-purple-600 hover:bg-purple-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status.status === "DONE" && status.song) {
    const song = status.song;
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle className="text-2xl">Sua Música Está Pronta!</CardTitle>
                  <CardDescription>Parabéns! 🎉</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Título</h3>
                  <p className="text-slate-700">{song.title}</p>
                </div>

                {/* Player */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Ouvir</h3>
                  <audio
                    controls
                    className="w-full"
                    src={song.audioUrl}
                  >
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>

                {/* Letra */}
                {song.lyrics && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Letra</h3>
                    <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm">
                        {song.lyrics}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => song.shareSlug ? setLocation(`/m/${song.shareSlug}`) : alert('Slug não disponível ainda')}
                    disabled={!song.shareSlug}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Ver Página de Compartilhamento
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/")}
                  >
                    Criar Outra Música
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status.status === "FAILED") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <CardTitle className="text-2xl">Erro ao Gerar Música</CardTitle>
                  <CardDescription>Algo deu errado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 mb-6">
                Desculpe, houve um erro ao gerar sua música. Por favor, tente novamente ou entre em contato com suporte.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setLocation("/create")}
                >
                  Tentar Novamente
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/")}
                >
                  Voltar para Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // QUEUED or PROCESSING
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
            <CardTitle className="text-2xl">Sua Música Está Sendo Criada</CardTitle>
            <CardDescription>Acompanhe o progresso abaixo</CardDescription>
            <div className="mt-4 p-3 bg-white rounded border border-slate-200">
              <p className="text-sm text-slate-600"><strong>ID da Requisição:</strong></p>
              <p className="text-sm font-mono text-purple-600 break-all">{jobId}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Steps */}
              <div className="space-y-4">
                {JOB_STEPS.map((step, index) => (
                  <div key={step.key} className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                        index < currentStep
                          ? "bg-green-100 text-green-700"
                          : index === currentStep
                          ? "bg-purple-100 text-purple-700 animate-pulse"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index < currentStep ? "✓" : index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p
                        className={`font-semibold transition-colors ${
                          index <= currentStep ? "text-slate-900" : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-500"
                    style={{ width: `${((currentStep + 1) / JOB_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Dica:</strong> Você receberá um email quando sua música estiver pronta. Pode fechar esta página.
                </p>
              </div>

              {/* Manual Refresh */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => refetch()}
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Atualizar Agora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/webhook/test?jobId=${jobId}`, {
                        method: "POST",
                      });
                      if (response.ok) {
                        console.log("[Status] Webhook test triggered, refetching...");
                        setTimeout(() => refetch(), 1000);
                      }
                    } catch (error) {
                      console.error("[Status] Webhook test failed:", error);
                    }
                  }}
                >
                  🧪 Simular Webhook (Dev)
                </Button>
                {status?.song?.shareSlug ? (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setLocation(`/m/${status.song!.shareSlug}`)}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Ir para Download
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Ir para Download (Aguarde)
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
