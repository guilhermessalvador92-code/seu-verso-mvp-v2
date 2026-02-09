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
import { Loader2, MessageCircle } from "lucide-react";
import { MUSIC_STYLES, MOODS, LANGUAGES, OCCASIONS } from "@shared/types";
import { isLabEnvironment } from "@/lib/environment";
import ProductionLayout from "@/components/ProductionLayout";
import LabLayout from "@/components/lab/LabLayout";

const createJobSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  ddi: z.string().min(1, "DDI é obrigatório"),
  ddd: z.string().regex(/^\d{2}$/, "DDD deve ter 2 dígitos"),
  phone: z.string().regex(/^\d{8,9}$/, "Telefone deve ter 8 ou 9 dígitos"),
  story: z.string().min(10, "História deve ter pelo menos 10 caracteres"),
  style: z.enum(MUSIC_STYLES as unknown as [string, ...string[]]),
  title: z.string().min(1, "Título da música é obrigatório"),
  occasion: z.enum(OCCASIONS as unknown as [string, ...string[]]).optional(),
  mood: z.enum(MOODS as unknown as [string, ...string[]]).optional(),
  language: z.enum(LANGUAGES as unknown as [string, ...string[]]).optional(),
  voiceGender: z.enum(["Masculina", "Feminina"]).optional(),
  agreedToTerms: z.boolean().refine(v => v === true, "Você deve concordar com os termos"),
});

type CreateJobInput = z.infer<typeof createJobSchema>;

export default function Create() {
  const Layout = isLabEnvironment() ? LabLayout : ProductionLayout;
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
      agreedToTerms: false,
      ddi: "55",
    },
  });

  const style = watch("style");
  const mood = watch("mood");
  const occasion = watch("occasion");
  const language = watch("language");
  const voiceGender = watch("voiceGender");
  const ddi = watch("ddi");
  const agreedToTerms = watch("agreedToTerms");

  const onSubmit = async (data: CreateJobInput) => {
    try {
      // Concatenar DDI + DDD + Telefone para o campo whatsapp esperado pelo backend
      const fullWhatsapp = `${data.ddi}${data.ddd}${data.phone}`;
      
      const result = await createJobMutation.mutateAsync({
        ...data,
        whatsapp: fullWhatsapp,
      } as any);
      
      toast.success("Música em criação! Você receberá uma mensagem no WhatsApp quando estiver pronta.");
      setLocation(result.statusUrl);
    } catch (error) {
      toast.error("Erro ao criar música. Tente novamente.");
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Criar Minha Música</h1>
          <p className="text-slate-600">Preencha os dados abaixo para criar uma música personalizada</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Dados da Música</CardTitle>
                <CardDescription>Compartilhe a história e preferências musicais</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                💬 WhatsApp
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-purple-800">
                  Seu Nome *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  className="border-slate-300 focus:border-purple-500 focus:ring-purple-500"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* WhatsApp com Seletor de DDI */}
              <div className="space-y-2">
                <Label className="font-semibold text-green-700 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp *
                </Label>
                <div className="flex gap-2">
                  {/* DDI */}
                  <div className="w-24">
                    <Select value={ddi} onValueChange={(value) => setValue("ddi", value)}>
                      <SelectTrigger className="border-slate-300 focus:border-green-500 focus:ring-green-500">
                        <SelectValue placeholder="DDI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="55">🇧🇷 +55</SelectItem>
                        <SelectItem value="1">🇺🇸 +1</SelectItem>
                        <SelectItem value="351">🇵🇹 +351</SelectItem>
                        <SelectItem value="34">🇪🇸 +34</SelectItem>
                        <SelectItem value="44">🇬🇧 +44</SelectItem>
                        <SelectItem value="49">🇩🇪 +49</SelectItem>
                        <SelectItem value="33">🇫🇷 +33</SelectItem>
                        <SelectItem value="39">🇮🇹 +39</SelectItem>
                        <SelectItem value="54">🇦🇷 +54</SelectItem>
                        <SelectItem value="56">🇨🇱 +56</SelectItem>
                        <SelectItem value="57">🇨🇴 +57</SelectItem>
                        <SelectItem value="52">🇲🇽 +52</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* DDD */}
                  <div className="w-20">
                    <Input
                      placeholder="DDD"
                      maxLength={2}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                      {...register("ddd")}
                    />
                  </div>
                  {/* Telefone */}
                  <div className="flex-1">
                    <Input
                      placeholder="Número do Telefone"
                      maxLength={9}
                      className="border-slate-300 focus:border-green-500 focus:ring-green-500"
                      {...register("phone")}
                    />
                  </div>
                </div>
                {(errors.ddi || errors.ddd || errors.phone) && (
                  <p className="text-sm text-red-600">
                    {errors.ddd?.message || errors.phone?.message || "Verifique os campos do telefone"}
                  </p>
                )}
                <p className="text-xs text-slate-500">Você receberá a música por WhatsApp quando estiver pronta</p>
              </div>

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
                <Select value={occasion || ""} onValueChange={(value) => setValue("occasion", value as any)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione uma ocasião" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o === "Aniversário" ? "🎂" : o === "Casamento" ? "💍" : o === "Serenata Romântica" ? "🌹" : o === "Mensagem Positiva" ? "✨" : o === "Jingle Político" ? "🗳️" : "😂"} {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Idioma */}
              <div className="space-y-2">
                <Label htmlFor="language" className="font-semibold">
                  Idioma da Música (Opcional)
                </Label>
                <Select value={language || ""} onValueChange={(value) => setValue("language", value as any)}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l === "Português Brasileiro" ? "🇧🇷" : l === "Espanhol" ? "🇪🇸" : l === "Inglês Americano" ? "🇺🇸" : "🇬🇧"} {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Padrão: Português Brasileiro
                </p>
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
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculina">👨 Masculina</SelectItem>
                    <SelectItem value="Feminina">👩 Feminina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Termos */}
              <div className="flex items-start space-x-3 pt-4">
                <Checkbox
                  id="agreedToTerms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setValue("agreedToTerms", checked as boolean)}
                  className="mt-1 border-slate-300 data-[state=checked]:bg-purple-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="agreedToTerms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Concordo com os termos de uso e privacidade *
                  </Label>
                  <p className="text-xs text-slate-500">
                    Ao criar a música, você autoriza o processamento dos dados fornecidos.
                  </p>
                </div>
              </div>
              {errors.agreedToTerms && (
                <p className="text-sm text-red-600">{errors.agreedToTerms.message}</p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={createJobMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-8 text-xl font-bold rounded-2xl shadow-lg transition-all hover:shadow-purple-200"
              >
                {createJobMutation.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Criando Sua Música...
                  </>
                ) : (
                  "🎵 Criar Minha Música Agora"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
