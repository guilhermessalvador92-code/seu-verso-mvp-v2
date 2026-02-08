import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLocation } from "wouter";

interface Song {
  title: string;
  audioUrl: string;
  lyrics: string;
  shareSlug: string;
}

interface PlayerProductionProps {
  song: Song;
}

/**
 * Componente de Player padrão para o ambiente de Produção.
 * Focado em estabilidade e experiência de usuário consolidada.
 */
export default function PlayerProduction({ song }: PlayerProductionProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      {/* Song Title */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{song.title}</h3>
      </div>

      {/* Audio Player */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <audio 
          controls 
          className="w-full" 
          preload="auto"
          controlsList="nodownload"
        >
          <source src={song.audioUrl} type="audio/mpeg" />
          <source src={song.audioUrl} type="audio/mp4" />
          <source src={song.audioUrl} type="audio/wav" />
          Seu navegador não suporta o elemento de áudio.
        </audio>
      </div>

      {/* Download Button */}
      <div>
        <a
          href={song.audioUrl}
          download={`${song.title}.mp3`}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Baixar Música
        </a>
      </div>

      {/* Lyrics */}
      {song.lyrics && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-3">Letra</h4>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans max-h-64 overflow-y-auto">
            {song.lyrics}
          </pre>
        </div>
      )}

      {/* Share */}
      <div className="flex gap-3 pt-4">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => setLocation("/")}
        >
          Criar Outra
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          onClick={() => {
            const text = `Criei uma música personalizada no Seu Verso! 🎵\n${song.title}`;
            const url = window.location.href;
            window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
          }}
        >
          Compartilhar
        </Button>
      </div>
    </div>
  );
}
