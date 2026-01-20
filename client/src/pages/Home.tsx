import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Zap, Heart, Share2, Download, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "Quanto tempo leva para minha música ficar pronta?",
      answer: "Geralmente entre 3 a 10 minutos. Você receberá um email assim que estiver pronta!",
    },
    {
      question: "Posso usar a música comercialmente?",
      answer: "Sim! A música é sua. Você pode usar em redes sociais, eventos, apresentações e até comercialmente.",
    },
    {
      question: "E se eu não gostar da música?",
      answer: "Oferecemos uma garantia de satisfação. Se não gostar, podemos gerar uma nova versão.",
    },
    {
      question: "Qual é a qualidade do áudio?",
      answer: "Nossas músicas são geradas em alta qualidade, prontas para compartilhar em qualquer plataforma.",
    },
    {
      question: "Posso compartilhar a música?",
      answer: "Sim! Cada música tem um link único que você pode compartilhar com amigos e familiares.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold text-slate-900">Seu Verso</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-sm text-slate-600 hover:text-slate-900">
              Como Funciona
            </a>
            <a href="#exemplos" className="text-sm text-slate-600 hover:text-slate-900">
              Exemplos
            </a>
            <a href="#preco" className="text-sm text-slate-600 hover:text-slate-900">
              Preço
            </a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Crie Músicas Personalizadas com IA
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Transforme histórias e memórias em músicas únicas. Perfeito para homenagens, celebrações e momentos especiais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => setLocation("/create")}
              >
                Criar Minha Música
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300"
                onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
              >
                Saber Mais
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-6">✨ Primeira música com 50% de desconto</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl h-80 flex items-center justify-center">
            <div className="text-center">
              <Music className="w-24 h-24 text-purple-400 mx-auto mb-4" />
              <p className="text-slate-600">Sua música aqui</p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Conte Sua História",
                description: "Compartilhe a história, memória ou contexto da pessoa homenageada",
                icon: Heart,
              },
              {
                step: 2,
                title: "Escolha o Estilo",
                description: "Selecione o gênero musical que melhor combina com a ocasião",
                icon: Sparkles,
              },
              {
                step: 3,
                title: "Receba Sua Música",
                description: "Em poucos minutos, sua música personalizada estará pronta para compartilhar",
                icon: Music,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="border-slate-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-lg font-bold text-purple-600">{item.step}</span>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Exemplos */}
      <section id="exemplos" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Ocasiões Perfeitas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Aniversários", emoji: "🎂" },
              { title: "Casamentos", emoji: "💍" },
              { title: "Formaturas", emoji: "🎓" },
              { title: "Aposentadorias", emoji: "🎉" },
              { title: "Homenagens", emoji: "🙏" },
              { title: "Pedidos de Casamento", emoji: "💕" },
              { title: "Despedidas", emoji: "👋" },
              { title: "Celebrações", emoji: "🌟" },
            ].map((item) => (
              <Card key={item.title} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Preço Simples e Justo</h2>
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-purple-600 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Música Personalizada</CardTitle>
                <CardDescription className="text-purple-100">Tudo incluído</CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-slate-900 mb-2">R$ 49</div>
                  <p className="text-slate-600">Uma única música personalizada</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Música em alta qualidade",
                    "Letra completa em português",
                    "Download ilimitado",
                    "Link para compartilhar",
                    "Garantia de satisfação",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-purple-600" />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setLocation("/create")}
                >
                  Criar Minha Música
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Perguntas Frequentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
                <div
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                    <span className="text-purple-600">
                      {expandedFaq === index ? "−" : "+"}
                    </span>
                  </div>
                  {expandedFaq === index && (
                    <p className="text-slate-600 mt-4">{faq.answer}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Pronto para Criar Sua Música?</h2>
          <p className="text-purple-100 mb-8 text-lg">
            Transforme uma história especial em uma música memorável hoje mesmo.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-slate-100 font-semibold"
            onClick={() => setLocation("/create")}
          >
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-white">Seu Verso</span>
              </div>
              <p className="text-sm">Músicas personalizadas com IA</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#como-funciona" className="hover:text-white">Como Funciona</a></li>
                <li><a href="#preco" className="hover:text-white">Preço</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/termos" className="hover:text-white">Termos de Uso</a></li>
                <li><a href="/privacidade" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contato</h4>
              <p className="text-sm">suporte@seu-verso.com</p>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Seu Verso. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
