import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Loader2, Zap, Music } from "lucide-react";

export default function QuickTest() {
  const [, setLocation] = useLocation();
  const createJobMutation = trpc.jobs.create.useMutation();

  const handleQuickTest = async () => {
    try {
      const result = await createJobMutation.mutateAsync({
        name: "Teste Rápido",
        whatsapp: "5511999999999",
        story: "Uma história de teste para validar o sistema de geração de músicas com IA",
        style: "Pop",
        title: "Música de Teste",
        occasion: "Teste",
        mood: "Alegre",
        voiceGender: "Masculina",
        agreedToTerms: true,
      });
      
      toast.success("Música em criação! Redirecionando...");
      setTimeout(() => {
        setLocation(result.statusUrl);
      }, 1000);
    } catch (error: any) {
      toast.error("Erro ao criar música");
      console.error("Erro detalhado:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Teste Rápido</h1>
          </div>
          <p className="text-slate-600">Crie uma música de teste com um clique</p>
        </div>

        {/* Quick Test Card */}
        <Card className="border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              Teste Instantâneo
            </CardTitle>
            <CardDescription>
              Clique no botão abaixo para criar uma música de teste automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Data Preview */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
              <p><strong>Nome:</strong> Teste Rápido</p>
              <p><strong>WhatsApp:</strong> 5511999999999</p>
              <p><strong>História:</strong> Uma história de teste para validar o sistema...</p>
              <p><strong>Estilo:</strong> Pop</p>
              <p><strong>Título:</strong> Música de Teste</p>
              <p><strong>Ocasião:</strong> Teste</p>
              <p><strong>Mood:</strong> Alegre</p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleQuickTest}
              disabled={createJobMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
            >
              {createJobMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando música...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Criar Música de Teste
                </>
              )}
            </Button>

            {/* Status Messages */}
            {createJobMutation.isPending && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  ⏳ Enviando requisição para o servidor...
                </p>
              </div>
            )}

            {createJobMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm font-semibold">❌ Erro ao criar música</p>
                <p className="text-red-600 text-xs mt-1">
                  {createJobMutation.error?.message || "Erro desconhecido"}
                </p>
              </div>
            )}

            {createJobMutation.isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✅ Música criada com sucesso! Redirecionando...
                </p>
              </div>
            )}

            {/* Back to Form */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setLocation("/create")}
                className="w-full"
              >
                Voltar para Formulário Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-xs text-slate-600">
          <p><strong>Debug:</strong> Esta página facilita testes durante desenvolvimento</p>
          <p className="mt-1">URL: /quick-test</p>
        </div>
      </div>
    </div>
  );
}
