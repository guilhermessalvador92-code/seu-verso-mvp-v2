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
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Music className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-slate-900">Seu Verso</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div>
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight">
            Crie Sua Música com IA
          </h1>
          <p className="text-3xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Transforme histórias em músicas únicas e personalizadas
          </p>
          <div className="mb-12">
            <Button
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-2xl rounded-2xl"
              onClick={() => setLocation("/create")}
            >
              🎵 Criar Minha Música
            </Button>
          </div>
          <p className="text-xl text-slate-500">✨ Primeira música com 50% de desconto</p>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="bg-slate-50 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-slate-900 text-center mb-16">Como Funciona</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: 1,
                title: "Conte Sua História",
                description: "Compartilhe a história ou contexto da pessoa homenageada",
                emoji: "❤️",
              },
              {
                step: 2,
                title: "IA Cria a Música",
                description: "Nossa IA compõe uma música personalizada em poucos minutos",
                emoji: "✨",
              },
              {
                step: 3,
                title: "Receba e Compartilhe",
                description: "Sua música estará pronta para ouvir e compartilhar",
                emoji: "🎵",
              },
            ].map((item) => {
              return (
                <Card key={item.step} className="border-slate-200 p-8 text-center">
                  <CardHeader>
                    <div className="text-6xl mb-6">{item.emoji}</div>
                    <CardTitle className="text-2xl mb-4">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>



      {/* CTA Final */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto para Criar Sua Música?</h2>
          <p className="text-2xl text-purple-100 mb-10">
            Transforme uma história especial em uma música memorável
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-slate-100 font-semibold px-10 py-4 text-xl rounded-xl"
            onClick={() => setLocation("/create")}
          >
            🎵 Começar Agora
          </Button>
        </div>
      </section>
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

    </div>
  );
}
