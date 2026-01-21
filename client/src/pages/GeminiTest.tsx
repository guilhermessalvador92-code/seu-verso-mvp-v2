import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function GeminiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testMutation = trpc.ai.testConnection.useQuery(undefined, { enabled: false });
  const enhanceMutation = trpc.ai.enhanceLyrics.useMutation();

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await testMutation.refetch();
      setResult(response.data);
    } catch (error) {
      setResult({ success: false, message: "Erro na conexão" });
    }
    setIsLoading(false);
  };

  const testEnhancement = async () => {
    setIsLoading(true);
    try {
      const response = await enhanceMutation.mutateAsync({
        story: "Uma história de amizade e superação entre dois irmãos que sempre se apoiaram nos momentos mais difíceis.",
        style: "Sertanejo",
        title: "Irmãos para Sempre",
        mood: "Emocionante",
        originalLyrics: `[Verso 1]
Dois irmãos na caminhada
Sempre juntos, mão na mão
Nos momentos de alegria
E também na solidão

[Refrão]  
Irmãos para sempre
Coração a coração
Unidos pela vida
Força da nossa união`
      });
      setResult(response);
    } catch (error) {
      setResult({ success: false, message: "Erro no aprimoramento" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <CardTitle className="text-2xl">Gemini AI Integration</CardTitle>
                <CardDescription>Teste da integração com Google Gemini para aprimorar letras</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Test Connection */}
              <div>
                <Button
                  onClick={testConnection}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Testar Conexão Gemini API
                </Button>
              </div>

              {/* Test Enhancement */}
              <div>
                <Button
                  onClick={testEnhancement}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Testar Aprimoramento de Letras
                </Button>
              </div>

              {/* Results */}
              {result && (
                <div className="mt-6">
                  <div className={`border rounded-lg p-4 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <h3 className={`font-semibold ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? 'Sucesso!' : 'Erro'}
                      </h3>
                    </div>
                    <p className={`text-sm ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </p>

                    {/* Enhanced lyrics display */}
                    {result.data?.lyrics && (
                      <div className="mt-4">
                        <h4 className="font-medium text-slate-900 mb-2">Letras Aprimoradas:</h4>
                        <div className="bg-white rounded border p-3 max-h-64 overflow-y-auto">
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                            {result.data.lyrics}
                          </pre>
                        </div>
                        
                        {result.data.improved && (
                          <p className="text-xs text-purple-600 mt-2">
                            ✨ Letras aprimoradas pelo Gemini AI
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Como funciona:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Gemini API aprimora automaticamente as letras das músicas</li>
                  <li>• Considera o contexto da história, estilo musical e ocasião</li>
                  <li>• Mantém a estrutura musical brasileira (Verso, Refrão, etc.)</li>
                  <li>• Torna as letras mais emocionantes e personalizadas</li>
                  <li>• Funciona como fallback se falhar (mantém letra original)</li>
                </ul>
              </div>

              {/* Status */}
              <div className="text-center text-sm text-slate-500">
                <p>GEMINI_API_KEY: {process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ Não encontrada'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}