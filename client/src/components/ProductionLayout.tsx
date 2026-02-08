import { Music } from "lucide-react";
import React from "react";

interface ProductionLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout padrão utilizado no ambiente de Produção.
 * Mantém a estabilidade visual e funcional para os usuários finais.
 */
export default function ProductionLayout({ children }: ProductionLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Padrão de Produção */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Music className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-slate-900">Seu Verso</span>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
