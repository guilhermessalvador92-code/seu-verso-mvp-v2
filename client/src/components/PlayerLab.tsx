import { Button } from "@/components/ui/button";
import { Download, MessageSquare, Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Song {
  title: string;
  audioUrl: string;
  lyrics: string;
  shareSlug: string;
}

interface PlayerLabProps {
  song: Song;
  jobId?: string;
}

/**
 * Componente de Player para o ambiente LAB (Experimentos).
 * Atualmente inclui um questionário de feedback obrigatório para liberar o áudio.
 * Permite testar novas mecânicas de engajamento e coleta de dados.
 */
export default function PlayerLab({ song, jobId }: PlayerLabProps) {
  const [, setLocation] = useLocation();
  const [isLocked, setIsLocked] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [nps, setNps] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [consent, setConsent] = useState(false);

  const storageKey = `feedback_post_done_${jobId}`;

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
        toast.success("Obrigado pelo seu feedback!");
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
      {/* Song Title */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{song.title}</h3>
      </div>

      {/* Audio Player with Overlay */}
      <div className="relative">
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

        {/* Overlay LAB - Questionnaire */}
        {isLocked && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-lg z-10 border border-purple-200 shadow-xl overflow-y-auto p-6 flex flex-col">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Sua opinião é importante!</h4>
              <p className="text-sm text-slate-600">Responda rapidinho para liberar o player</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1">
              {/* NPS Question */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  O quanto você gostou da experiência? (0-10)
                </label>
                <div className="flex flex-wrap justify-between gap-1">
                  {[...Array(11)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNps(i)}
                      className={`w-8 h-8 rounded-md text-xs font-bold transition-all border ${
                        nps === i 
                          ? "bg-purple-600 text-white border-purple-600 scale-110 shadow-md" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:bg-purple-50"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 px-1">
                  <span>Não gostei</span>
                  <span>Amei!</span>
                </div>
              </div>

              {/* Text Feedback */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  O que podemos melhorar? (Opcional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Sua sugestão..."
                  className="w-full min-h-[80px] p-3 text-sm rounded-md border border-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              {/* Consent */}
              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="consent" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                  Autorizo o uso do meu feedback e nome para fins de melhoria e divulgação do Seu Verso.
                </label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg py-6 text-lg font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar e ouvir música
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
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
  );
}
