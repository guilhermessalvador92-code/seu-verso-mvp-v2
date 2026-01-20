import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Terms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Termos de Uso</h1>
          <p className="text-slate-600">Última atualização: 20 de janeiro de 2024</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardContent className="pt-8 prose prose-sm max-w-none">
            <div className="space-y-8 text-slate-700">
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Aceitação dos Termos</h2>
                <p>
                  Ao acessar e usar o Seu Verso, você concorda com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não use o serviço.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Descrição do Serviço</h2>
                <p>
                  O Seu Verso é uma plataforma que utiliza inteligência artificial para gerar músicas personalizadas baseadas em histórias, contextos e preferências fornecidas pelos usuários.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Uso Aceitável</h2>
                <p className="mb-3">Você concorda em não usar o serviço para:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Criar músicas que imitem ou falsifiquem a voz de artistas reais sem autorização</li>
                  <li>Gerar conteúdo ofensivo, discriminatório ou ilegal</li>
                  <li>Violar direitos autorais ou de propriedade intelectual de terceiros</li>
                  <li>Usar o serviço de forma fraudulenta ou enganosa</li>
                  <li>Tentar contornar medidas de segurança ou limites de uso</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Direitos de Propriedade Intelectual</h2>
                <p className="mb-3">
                  As músicas geradas pelo Seu Verso são criadas especificamente para você. Você recebe uma licença não exclusiva para usar a música para fins pessoais e comerciais, incluindo:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Compartilhamento em redes sociais</li>
                  <li>Uso em eventos e celebrações</li>
                  <li>Uso comercial e monetização</li>
                  <li>Download e distribuição</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Limitações de Responsabilidade</h2>
                <p>
                  O Seu Verso fornece o serviço "no estado em que se encontra". Não garantimos que as músicas geradas atendam às suas expectativas específicas ou que sejam adequadas para todos os usos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Garantia de Satisfação</h2>
                <p>
                  Se você não ficar satisfeito com a música gerada, oferecemos uma garantia de satisfação. Entre em contato com nosso suporte para solicitar uma nova geração.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Pagamento e Reembolso</h2>
                <p className="mb-3">
                  O serviço custa R$ 49,00 por música. Os pagamentos são processados de forma segura. Oferecemos reembolso em até 7 dias se:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>A música não foi gerada com sucesso</li>
                  <li>Você não estiver satisfeito com o resultado (mediante solicitação)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Privacidade</h2>
                <p>
                  Sua privacidade é importante para nós. Consulte nossa Política de Privacidade para entender como coletamos, usamos e protegemos seus dados.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Modificações do Serviço</h2>
                <p>
                  Reservamos o direito de modificar ou descontinuar o serviço a qualquer momento. Notificaremos os usuários sobre mudanças significativas com antecedência.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contato</h2>
                <p>
                  Se tiver dúvidas sobre estes Termos de Uso, entre em contato conosco em suporte@seu-verso.com
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation("/")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Voltar para Home
          </Button>
        </div>
      </div>
    </div>
  );
}
