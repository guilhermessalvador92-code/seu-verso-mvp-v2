import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
          <p className="text-slate-600">Última atualização: 20 de janeiro de 2024</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardContent className="pt-8 prose prose-sm max-w-none">
            <div className="space-y-8 text-slate-700">
              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introdução</h2>
                <p>
                  O Seu Verso ("nós", "nosso" ou "nos") opera o site e aplicativo Seu Verso. Esta página informa você sobre nossas políticas sobre a coleta, uso e divulgação de dados pessoais quando você usa nosso serviço.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Informações que Coletamos</h2>
                <p className="mb-3">Coletamos as seguintes informações:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Email:</strong> Para enviar sua música e comunicações relacionadas</li>
                  <li><strong>Nome(s):</strong> Para personalizar sua música</li>
                  <li><strong>História/Contexto:</strong> Para gerar a música personalizada</li>
                  <li><strong>Preferências Musicais:</strong> Estilo, ocasião e clima escolhidos</li>
                  <li><strong>Dados de Uso:</strong> Como você interage com nosso serviço</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Como Usamos Suas Informações</h2>
                <p className="mb-3">Usamos as informações coletadas para:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Gerar sua música personalizada</li>
                  <li>Enviar sua música e comunicações relacionadas por email</li>
                  <li>Melhorar nosso serviço e experiência do usuário</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Prevenir fraude e abuso</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Armazenamento de Dados</h2>
                <p>
                  Armazenamos sua história, email e preferências musicais em nossos servidores seguros. Esses dados são mantidos enquanto sua conta estiver ativa e por até 12 meses após a conclusão de sua solicitação, para fins de suporte e conformidade legal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Segurança dos Dados</h2>
                <p>
                  Implementamos medidas de segurança apropriadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela Internet é 100% seguro.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Compartilhamento de Dados</h2>
                <p>
                  Não vendemos, negociamos ou alugamos suas informações pessoais a terceiros. Podemos compartilhar dados com provedores de serviços que nos ajudam a operar nosso site e conduzir nossos negócios, desde que concordem em manter essas informações confidenciais.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Seus Direitos</h2>
                <p className="mb-3">Você tem o direito de:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados imprecisos</li>
                  <li>Solicitar a exclusão de seus dados</li>
                  <li>Optar por não receber comunicações de marketing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Cookies</h2>
                <p>
                  Usamos cookies para melhorar sua experiência. Você pode controlar o uso de cookies através das configurações do seu navegador.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Mudanças nesta Política</h2>
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas por email ou através de um aviso proeminente em nosso site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contato</h2>
                <p>
                  Se tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco em suporte@seu-verso.com
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
