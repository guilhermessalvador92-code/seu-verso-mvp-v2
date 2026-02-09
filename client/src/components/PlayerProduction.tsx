import { Button } from "@/components/ui/button";
import { Download, MessageSquare, Star, Send, Loader2, Music2, Unlock, Gift } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Song {
  title: string;
  audioUrl: string;
  lyrics: string;
  shareSlug: string;
}

interface PlayerProductionProps {
  songs: Song[];
  jobId?: string;
}

/**
 * Componente de Player unificado para Produção.
 * Agora suporta múltiplas músicas e questionário de feedback obrigatório.
 */
export default function PlayerProduction({ songs, jobId }: PlayerProductionProps) {
  const [, setLocation] = useLocation();
  const [isLocked, setIsLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSongIndex, setActiveSongIndex] = useState(0);
  
  // Form state
  const [nps, setNps] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [consent, setConsent] = useState(false);

  const storageKey = `feedback_post_done_${jobId}`;
  const activeSong = songs[activeSongIndex] || songs[0];

  // Check if feedback was already given
  useEffect(() => {
    if (jobId) {
      const done = localStorage.getItem(storageKey);
      if (done === "true") {
        setIsLocked(false);
      }
    }
  }, [jobId, storageKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nps === null) {
      toast.error("Por favor, selecione uma nota de 0 a 10");
      return;
    }

    if (!consent) {
      toast.error("Por favor, autorize o uso do feedback");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tester-feedback/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          nps,
          feedback,
          consent
        }),
      });

      if (!response.ok) throw new Error("Erro ao enviar feedback");

      const data = await response.json();
      if (data.success) {
        toast.success("Obrigado pelo seu feedback! Versões liberadas.");
        localStorage.setItem(storageKey, "true");
        setIsLocked(false);
      } else {
        throw new Error(data.error || "Erro ao enviar feedback");
      }
    } catch (error) {
      console.error("[Feedback] Submit error:", error);
      toast.error("Não foi possível enviar o feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de Status de Bônus */}
      {isLocked && songs.length > 1 && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <div className="bg-purple-600 p-2 rounded-full text-white">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-900">Bônus Detectado!</p>
            <p className="text-xs text-purple-700">Temos 2 versões da sua música. Envie o feedback para liberar ambas.</p>
          </div>
        </div>
      )}

      {/* Song Selection Tabs (only if multiple songs and unlocked) */}
      {songs.length > 1 && !isLocked && (
        <div className="flex p-1 bg-slate-100 rounded-lg gap-1">
          {songs.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSongIndex(index)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeSongIndex === index 
                  ? "bg-white text-purple-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Music2 className="w-4 h-4" />
              Versão {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* Song Title */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {activeSong.title} {songs.length > 1 && !isLocked && <span className="text-purple-500 text-sm ml-2">(Versão {activeSongIndex + 1})</span>}
        </h3>
      </div>

      {/* Main Content Area (Feedback or Download) */}
      <div className="relative min-h-[400px]">
        {isLocked ? (
          <div className="bg-white rounded-xl border border-purple-200 shadow-lg p-6 space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">Sua opinião é importante!</h4>
              <p className="text-slate-600 mt-2">
                Responda rapidinho para liberar o download das <strong>{songs.length} versões</strong> da sua música.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* NPS Question */}
              <div className="space-y-4">
                <label className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  O quanto você gostou da experiência? (0-10)
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
                  {[...Array(11)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNps(i)}
                      className={`aspect-square rounded-lg text-sm font-bold transition-all border-2 ${
                        nps === i 
                          ? "bg-purple-600 text-white border-purple-600 scale-110 shadow-lg" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:bg-purple-50"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                  <span>Não gostei</span>
                  <span>Amei!</span>
                </div>
              </div>

              {/* Text Feedback */}
              <div className="space-y-3">
                <label className="text-base font-semibold text-slate-800">
                  O que podemos melhorar? (Opcional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Sua sugestão nos ajuda a criar músicas ainda melhores..."
                  className="w-full min-h-[120px] p-4 text-base rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Consent */}
              <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="consent" className="text-sm text-slate-600 leading-relaxed cursor-pointer select-none">
                  Autorizo o uso do meu feedback e nome para fins de melhoria e divulgação do Seu Verso.
                </label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl py-8 text-xl font-black uppercase tracking-wider rounded-2xl transition-transform active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6 mr-3" />
                    Enviar e liberar músicas
                  </>
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            {/* Download Section */}
            <div className="bg-white rounded-2xl border-2 border-purple-100 p-8 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <Unlock className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-6">Música Liberada!</h4>
              
              <a
                href={activeSong.audioUrl}
                download={`${activeSong.title}.mp3`}
                className="inline-flex items-center justify-center gap-3 w-full px-8 py-5 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-2xl shadow-lg transition-all hover:shadow-purple-200 hover:-translate-y-1 active:translate-y-0"
              >
                <Download className="w-6 h-6" />
                Baixar Versão {activeSongIndex + 1}
              </a>
              
              <p className="text-sm text-slate-500 mt-4">
                O arquivo MP3 será salvo no seu dispositivo.
              </p>
            </div>

            {/* Lyrics */}
            {activeSong.lyrics && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Music2 className="w-5 h-5 text-purple-600" />
                  <h4 className="font-bold text-slate-900">Letra da Música</h4>
                </div>
                <pre className="text-base text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {activeSong.lyrics}
                </pre>
              </div>
            )}

            {/* Share & Create Another */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <Button
                size="lg"
                variant="outline"
                className="py-6 text-lg font-bold border-2 rounded-xl"
                onClick={() => setLocation("/")}
              >
                Criar Outra Música
              </Button>
              <Button
                size="lg"
                className="py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md"
                onClick={() => {
                  const text = `Criei uma música personalizada no Seu Verso! 🎵\n${activeSong.title}\n\nOuça aqui: ${window.location.href}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                }}
              >
                Compartilhar no WhatsApp
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
