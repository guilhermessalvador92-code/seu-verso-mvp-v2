import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Share2, Music as MusicIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function MusicPage() {
  const [match, params] = useRoute("/m/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug;

  const { data: song, isLoading, error } = trpc.music.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const recordDownloadMutation = trpc.music.recordDownload.useMutation();

  useEffect(() => {
    if (song) {
      document.title = `${song.title} - Seu Verso`;
    }
  }, [song]);

  const handleDownload = async () => {
    if (!song) return;

    try {
      // Registrar download
      await recordDownloadMutation.mutateAsync({ slug: slug || "" });

      // Download do arquivo
      const link = document.createElement("a");
      link.href = song.audioUrl || "";
      link.download = `${song.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Música baixada com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar:", error);
      toast.error("Erro ao baixar a música");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = song?.title || "Minha Música Personalizada";

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Ouça minha música personalizada criada com IA!",
          url,
        });
      } catch (error) {
        console.error("Erro ao compartilhar:", error);
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (!match || !slug) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Card className="border-slate-200 w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-900 font-semibold mb-4">Música não encontrada</p>
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
            <p className="text-slate-900 font-semibold">Carregando música...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center py-12">
        <div className="max-w-md w-full px-4">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-orange-600" />
                <div>
                  <CardTitle className="text-xl">Música Não Encontrada</CardTitle>
                  <CardDescription>Verifique o link ou acompanhe o status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-slate-700 text-sm">
                  A música que você está procurando não foi encontrada. Isso pode acontecer se a música ainda está sendo gerada ou o link está incorreto.
                </p>
                
                {slug && (
                  <div className="bg-slate-50 rounded p-3 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1 font-semibold">Slug da Música:</p>
                    <p className="text-xs font-mono text-slate-700 break-all">{slug}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => setLocation("/")}
                  >
                    Voltar para Home
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation("/create")}
                  >
                    Criar Nova Música
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <MusicIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Sua Música</h1>
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-slate-200 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
            <CardTitle className="text-2xl">{song.title}</CardTitle>
            <CardDescription>Criada com IA - Seu Verso</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-6">
              {/* Player */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Ouvir</h3>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-8">
                  <audio
                    controls
                    className="w-full"
                    src={song.audioUrl || ""}
                  >
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleDownload}
                  disabled={recordDownloadMutation.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {recordDownloadMutation.isPending ? "Baixando..." : "Baixar Música"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Letra */}
              {song.lyrics && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">Letra</h3>
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {song.lyrics}
                    </p>
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{song.downloadCount || 0}</p>
                  <p className="text-sm text-slate-600">Downloads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">∞</p>
                  <p className="text-sm text-slate-600">Compartilhamentos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-slate-200 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> Você pode compartilhar este link com amigos e familiares. Eles poderão ouvir e baixar sua música!
            </p>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setLocation("/create")}
          >
            Criar Outra Música
          </Button>
        </div>
      </div>
    </div>
  );
}
