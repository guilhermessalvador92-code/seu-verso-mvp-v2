import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Music, Download } from "lucide-react";
import { JOB_STEPS } from "@shared/types";

export default function Status() {
  const [match, params] = useRoute("/status/:jobId");
  const [, setLocation] = useLocation();
  const jobId = params?.jobId;

  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [song, setSong] = useState<any>(null);
  const [songs, setSongs] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [enablePolling, setEnablePolling] = useState(true);

  // Use tRPC query with proper React Query integration
  const { data: status, error, refetch } = trpc.jobs.getStatus.useQuery(
    { jobId: jobId || "" },
    { 
      enabled: !!jobId && enablePolling && !isReady && !isFailed,
      refetchInterval: 15000, // 15 seconds
      retry: false
    }
  );

  // Test webhook mutation
  const testWebhookMutation = trpc.jobs.testWebhook.useMutation();

  // Process status changes
  useEffect(() => {
    if (!status) return;

    console.log("[Status] Status update:", {
      status: status.status,
      hasSong: !!status.song,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (status.status === "DONE" && (status.song || status.songs)) {
      if (status.songs && status.songs.length > 0) {
        setSongs(status.songs);
        setSong(status.songs[0]); // For compatibility
      } else if (status.song) {
        setSong(status.song);
        setSongs([status.song]); // Wrap single song in array
      }
      setIsReady(true);
      setEnablePolling(false);
      setCurrentStep(JOB_STEPS.length - 1);
    } else if (status.status === "FAILED") {
      setIsFailed(true);
      setEnablePolling(false);
    }

    setLastCheck(new Date());
  }, [status]);

  // Animação contínua enquanto processando
  useEffect(() => {
    if (isReady || isFailed) return;

    const animationInterval = setInterval(() => {
      setCurrentStep((prev) => {
        const maxStep = JOB_STEPS.length - 2;
        return prev < maxStep ? prev + 1 : 1; // Loop between 1 and max
      });
    }, 1000); // Atualiza a cada 1 segundo

    return () => clearInterval(animationInterval);
  }, [isReady, isFailed]);

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

  if (isFailed) {
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
                Desculpe, houve um erro ao gerar sua música. Por favor, tente novamente.
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

  if (isReady && songs.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle className="text-2xl">
                    Sua{songs.length > 1 ? 's' : ''} Música{songs.length > 1 ? 's' : ''} Está{songs.length > 1 ? 'ão' : ''} Pronta{songs.length > 1 ? 's' : ''}!
                  </CardTitle>
                  <CardDescription>Parabéns! 🎉</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Música{songs.length > 1 ? 's' : ''} Criada{songs.length > 1 ? 's' : ''}!</h3>
                  </div>
                  <p className="text-green-700 text-sm">
                    {songs.length > 1 
                      ? `${songs.length} versões da sua música foram geradas com sucesso!`
                      : "Sua música foi gerada com sucesso!"
                    }
                  </p>
                </div>

                {songs.map((currentSong, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Music className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-slate-900">
                        {currentSong.title}{songs.length > 1 ? ` (Versão ${index + 1})` : ''}
                      </h3>
                    </div>

                    {currentSong.audioUrl && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">🎵 Ouvir Agora</h4>
                        <audio 
                          controls 
                          className="w-full mb-4" 
                          preload="auto"
                          autoPlay={index === 0}
                          onError={(e) => {
                            console.error('Erro no audio:', e);
                            console.log('URL do audio:', currentSong.audioUrl);
                          }}
                        >
                          <source src={currentSong.audioUrl} type="audio/mpeg" />
                          <source src={currentSong.audioUrl} type="audio/mp4" />
                          <source src={currentSong.audioUrl} type="audio/wav" />
                          Seu navegador não suporta o elemento de áudio.
                        </audio>
                        
                        {/* Botão de Download Grande */}
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = currentSong.audioUrl;
                            link.download = `${currentSong.title}${songs.length > 1 ? ` - Versao ${index + 1}` : ''}.mp3`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          💾 Baixar Esta Música
                        </Button>
                      </div>
                    )}

                    {currentSong.lyrics && (
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Letra</h4>
                        <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm">
                            {currentSong.lyrics}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => song.shareSlug && setLocation(`/m/${song.shareSlug}`)}
                    disabled={!song?.shareSlug}
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Ver Página de Compartilhamento
                  </Button>
                  
                  {songs.length > 1 && (
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        songs.forEach((currentSong, index) => {
                          setTimeout(() => {
                            const link = document.createElement("a");
                            link.href = currentSong.audioUrl;
                            link.download = `${currentSong.title} - Versao ${index + 1}.mp3`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }, index * 500);
                        });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Todas ({songs.length})
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

  // Processando - Animação em loop
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
              {lastCheck && (
                <p className="text-xs text-slate-500 mt-2">
                  Último check: {lastCheck.toLocaleTimeString()}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Steps com animação em loop */}
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

              {/* Progress Bar Animada */}
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                    style={{
                      width: `${((currentStep + 1) / JOB_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ⏱️ A música está sendo processada. Verificaremos a cada 15 segundos se está pronta.
                </p>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-slate-600 hover:bg-slate-700"
                  onClick={() => window.location.reload()}
                >
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atualizar Página
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={async () => {
                    try {
                      await testWebhookMutation.mutateAsync({ jobId: jobId || "" });
                      // Wait a bit then refetch
                      setTimeout(() => {
                        refetch();
                      }, 1000);
                    } catch (error) {
                      console.error("Webhook simulation failed:", error);
                    }
                  }}
                  disabled={testWebhookMutation.isLoading}
                >
                  🧪 Simular Webhook (Dev)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
