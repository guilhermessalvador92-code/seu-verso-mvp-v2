import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";
import { isLabEnvironment } from "@/lib/environment";
import ProductionLayout from "@/components/ProductionLayout";
import LabLayout from "@/components/LabLayout";

interface Song {
  title: string;
  audioUrl: string;
  lyrics: string;
  shareSlug: string;
}

interface StatusResponse {
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED" | "ERROR";
  songs?: Song[];
}

export default function Status() {
  const Layout = isLabEnvironment() ? LabLayout : ProductionLayout;
  const [match, params] = useRoute("/status/:jobId");
  const [, setLocation] = useLocation();
  const jobId = params?.jobId;

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Fetch status from REST endpoint
  const fetchStatus = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/status-simple/${jobId}`);
      if (!response.ok) {
        throw new Error("Falha ao buscar status");
      }
      const data: StatusResponse = await response.json();
      setStatus(data);
      setLastCheck(new Date());
      setError(null);
    } catch (err) {
      console.error("[Status] Erro ao buscar:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [jobId]);

  // Poll every 10 seconds while processing
  useEffect(() => {
    if (!jobId || status?.status === "DONE" || status?.status === "FAILED") {
      return;
    }

    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [jobId, status?.status]);

  if (!match || !jobId) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
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
      </Layout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Card className="border-slate-200 w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
              <p className="text-slate-900 font-semibold">Carregando...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Card className="border-slate-200 w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-slate-900 font-semibold mb-2">Erro</p>
              <p className="text-slate-600 mb-4">{error}</p>
              <Button onClick={fetchStatus} className="bg-purple-600 hover:bg-purple-700">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Failed state
  if (status?.status === "FAILED") {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      </Layout>
    );
  }

  // Success state - show music player
  if (status?.status === "DONE" && status.songs && status.songs.length > 0) {
    const song = status.songs[0];
    
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <CardTitle className="text-2xl">Sua Música Está Pronta!</CardTitle>
                  <CardDescription>Aproveite e compartilhe</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-6">
                {/* Song Title */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{song.title}</h3>
                </div>

                {/* Audio Player */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <audio 
                    controls 
                    className="w-full" 
                    preload="auto"
                    controlsList="nodownload"
                  >
                    <source src={song.audioUrl} type="audio/mpeg" />
                    <source src={song.audioUrl} type="audio/mp4" />
                    <source src={song.audioUrl} type="audio/wav" />
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>

                {/* Download Button */}
                <div>
                  <a
                    href={song.audioUrl}
                    download={`${song.title}.mp3`}
                    className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Baixar Música
                  </a>
                </div>

                {/* Lyrics */}
                {song.lyrics && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">Letra</h4>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
                      {song.lyrics}
                    </pre>
                  </div>
                )}

                {/* Share */}
                <div className="flex gap-3 pt-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation("/")}
                  >
                    Criar Outra
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      const text = `Criei uma música personalizada no Seu Verso! 🎵\n${song.title}`;
                      const url = window.location.href;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
                    }}
                  >
                    Compartilhar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Processing state
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              {/* Loading Animation */}
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
              </div>

              {/* Status Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-lg text-blue-900 text-center">
                  ⏱️ A música está sendo processada. Aguarde alguns minutos...
                </p>
              </div>

              {/* Refresh Button */}
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={fetchStatus}
              >
                Verificar Agora
              </Button>
              <p className="text-center text-sm text-slate-500">
                Atualiza automaticamente a cada 10 segundos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
