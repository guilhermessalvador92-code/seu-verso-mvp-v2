import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PreGenerationFeedbackProps {
  jobId: string;
  onComplete: () => void;
}

/**
 * Componente de Feedback Pré-Geração.
 * Atualizado para ser OBRIGATÓRIO (sem opção de pular ou fechar).
 */
export default function PreGenerationFeedback({ jobId, onComplete }: PreGenerationFeedbackProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Form state
  const [recipient, setRecipient] = useState("");
  const [emotion, setEmotion] = useState("");
  const [pricePerception, setPricePerception] = useState("");

  const storageKey = `feedback_pre_done_${jobId}`;

  // Check if already answered
  useEffect(() => {
    const done = localStorage.getItem(storageKey);
    if (done === "true") {
      setIsVisible(false);
      onComplete();
    }
  }, [jobId, storageKey, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !emotion || !pricePerception) {
      toast.error("Por favor, preencha todos os campos para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tester-feedback/pre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          recipient,
          emotion,
          pricePerception
        }),
      });

      if (!response.ok) throw new Error("Erro ao enviar feedback");

      localStorage.setItem(storageKey, "true");
      setIsVisible(false);
      onComplete();
      toast.success("Obrigado! Isso nos ajuda muito.");
    } catch (error) {
      console.error("[Feedback-PRE] Submit error:", error);
      // Em caso de erro de rede, permitimos seguir para não travar o usuário
      localStorage.setItem(storageKey, "true");
      setIsVisible(false);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="border-purple-200 bg-purple-50/50 shadow-md mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Enquanto preparamos sua música...</h4>
              <p className="text-xs text-slate-600">Conte-nos um pouco mais para continuarmos</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Para quem é a música?
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Ex: Minha mãe, namorado..."
                className="w-full p-2 text-sm rounded border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Qual emoção quer passar?
              </label>
              <input
                type="text"
                required
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                placeholder="Ex: Gratidão, amor, saudade..."
                className="w-full p-2 text-sm rounded border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Quanto você pagaria por uma música assim?
            </label>
            <select
              required
              value={pricePerception}
              onChange={(e) => setPricePerception(e.target.value)}
              className="w-full p-2 text-sm rounded border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">Selecione uma opção...</option>
              <option value="free">Deveria ser grátis</option>
              <option value="10-30">R$ 10 - R$ 30</option>
              <option value="30-60">R$ 30 - R$ 60</option>
              <option value="60-100">R$ 60 - R$ 100</option>
              <option value="100+">Mais de R$ 100</option>
            </select>
          </div>

          <div className="pt-2">
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold h-10"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar e continuar
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
