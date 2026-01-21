import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Music } from "lucide-react";
import { MUSIC_STYLES, MOODS } from "@shared/types";

const createJobSchema = z.object({
  story: z.string().min(10, "História deve ter pelo menos 10 caracteres"),
  style: z.enum(MUSIC_STYLES as unknown as [string, ...string[]]),
  title: z.string().min(1, "Título da música é obrigatório"),
  occasion: z.string().optional(),
  mood: z.enum(MOODS as unknown as [string, ...string[]]).optional(),
  voiceGender: z.enum(["Masculina", "Feminina"]).optional(),
  email: z.string().email("Email inválido"),
  agreedToTerms: z.boolean().refine(v => v === true, "Você deve concordar com os termos"),
});

type CreateJobInput = z.infer<typeof createJobSchema>;

export default function Create() {
  const [, setLocation] = useLocation();
  const createJobMutation = trpc.jobs.create.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      style: "Pop",
    },
  });

  const style = watch("style");
  const mood = watch("mood");
  const voiceGender = watch("voiceGender");
  const agreedToTerms = watch("agreedToTerms");

  const onSubmit = async (data: CreateJobInput) => {
    try {
      const result = await createJobMutation.mutateAsync(data);
      toast.success("Música em criação! Você receberá um email quando estiver pronta.");
      setLocation(result.statusUrl);
    } catch (error) {
      toast.error("Erro ao criar música. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Music className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Criar Minha Música</h1>
          </div>
          <p className="text-slate-600">Preencha os dados abaixo para criar uma música personalizada</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados da Música</CardTitle>
                <CardDescription>Compartilhe a história e preferências musicais</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                ✨ AI Gemini Ativo
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* História */}
              <div className="space-y-2">
                <Label htmlFor="story" className="font-semibold">
                  História / Contexto *
                </Label>
                <Textarea
                  id="story"
                  placeholder="Conte a história, memória ou contexto da pessoa homenageada. Quanto mais detalhes, melhor a música!"
                  className="min-h-32 border-slate-300"
                  {...register("story")}
                />
                {errors.story && (
                  <p className="text-sm text-red-600">{errors.story.message}</p>
                )}
              </div>

              {/* Título da História */}
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-purple-800">
                  Título da História *
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: O Aniversário da Maria, A Formatura do João"
                  className="border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-red-600">{errors.title.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Este será o título principal da sua música personalizada
                </p>
              </div>

              {/* Ocasião */}
              <div className="space-y-2">
                <Label htmlFor="occasion" className="font-semibold">
                  Ocasião (Opcional)
                </Label>
                <Input
                  id="occasion"
                  placeholder="Ex: Aniversário de 50 anos, Casamento, Formatura"
                  className="border-slate-300"
                  {...register("occasion")}
                />
              </div>

              {/* Estilo Musical */}
              <div className="space-y-2">
                <Label htmlFor="style" className="font-semibold text-purple-800">
                  Estilo Musical *
                </Label>
                <Select value={style} onValueChange={(value) => setValue("style", value as any)}>
                  <SelectTrigger className="border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {MUSIC_STYLES.map((s) => (
                      <SelectItem key={s} value={s} className="hover:bg-purple-50">
                        <span className="flex items-center gap-2">
                          🎵 {s}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.style && (
                  <p className="text-sm text-red-600">{errors.style.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Escolha o ritmo que mais combina com a personalidade da pessoa homenageada
                </p>
              </div>

              {/* Clima/Emoção */}
              <div className="space-y-2">
                <Label htmlFor="mood" className="font-semibold">
                  Clima / Emoção (Opcional)
                </Label>
                <Select value={mood || ""} onValueChange={(value) => setValue("mood", value as any)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione uma emoção" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m === "Épico" ? "🔥" : m === "Alegre" ? "😊" : m === "Romântico" ? "💕" : m === "Nostálgico" ? "🌅" : m === "Inspirador" ? "⭐" : m === "Calmo/Relaxante" ? "🧘" : m === "Energético" ? "⚡" : m === "Melancólico" ? "🌧️" : m === "Motivacional" ? "💪" : m === "Sensual" ? "🌹" : "🎭"} {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gênero da Voz */}
              <div className="space-y-2">
                <Label htmlFor="voiceGender" className="font-semibold">
                  Gênero da Voz (Opcional)
                </Label>
                <Select value={voiceGender || ""} onValueChange={(value) => setValue("voiceGender", value as any)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o gênero da voz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculina">
                      🎤 Voz Masculina
                    </SelectItem>
                    <SelectItem value="Feminina">
                      🎤 Voz Feminina
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Escolha se prefere que a música seja cantada com voz masculina ou feminina
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  Email para Entrega *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="border-slate-300"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
                <p className="text-xs text-slate-500">Você receberá um email com sua música quando estiver pronta</p>
              </div>

              {/* Termos */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms || false}
                    onCheckedChange={(checked) => setValue("agreedToTerms", checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer">
                    Concordo com os{" "}
                    <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      Termos de Uso
                    </a>
                    {" "}e{" "}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      Política de Privacidade
                    </a>
                    {" "}*
                  </label>
                </div>
                {errors.agreedToTerms && (
                  <p className="text-sm text-red-600">{errors.agreedToTerms.message}</p>
                )}
              </div>

              {/* Preço */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Valor da Música:</span>
                  <span className="text-2xl font-bold text-purple-600">R$ 49,00</span>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando Música...
                  </>
                ) : (
                  "Gerar Minha Música"
                )}
              </Button>

              <p className="text-xs text-slate-500 text-center">
                Ao clicar em "Gerar Minha Música", você será redirecionado para acompanhar o progresso
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="border-slate-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm text-slate-600"><strong>Rápido</strong> - Pronta em minutos</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">🎵</div>
              <p className="text-sm text-slate-600"><strong>Qualidade</strong> - Profissional</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm text-slate-600"><strong>Seguro</strong> - Seus dados protegidos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
