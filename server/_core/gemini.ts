/**
 * Gemini API integration for lyrics enhancement
 * Uses Google's Gemini API to improve and enhance music lyrics
 */

import { ENV } from './env';

export interface LyricsEnhancementOptions {
  story: string;
  style: string;
  title: string;
  occasion?: string;
  mood?: string;
  originalLyrics?: string;
}

export interface EnhancedLyrics {
  lyrics: string;
  structure: string;
  theme: string;
  improved: boolean;
  originalLyrics?: string;
}

/**
 * Call Gemini API to enhance lyrics
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  if (!ENV.forgeApiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${ENV.forgeApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Invalid response from Gemini API");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("[Gemini] API call failed:", error);
    throw error;
  }
}

/**
 * Enhance lyrics using Gemini AI
 */
export async function enhanceLyrics(options: LyricsEnhancementOptions): Promise<EnhancedLyrics> {
  const {
    story,
    style,
    title,
    occasion,
    mood,
    originalLyrics,
  } = options;

  // Build contextual prompt for Gemini
  const prompt = `Você é um compositor profissional brasileiro especializado em criar letras emocionantes e personalizadas.

CONTEXTO DA MÚSICA:
- Título: "${title}"
- Estilo Musical: ${style}
- História/Contexto: ${story}
${occasion ? `- Ocasião: ${occasion}` : ''}
${mood ? `- Clima desejado: ${mood}` : ''}
${originalLyrics ? `\nLETRA ORIGINAL:\n${originalLyrics}` : ''}

INSTRUÇÕES:
1. ${originalLyrics ? 'Melhore e aprimore a letra original mantendo a essência' : 'Crie uma letra original baseada na história'}
2. Use estrutura musical brasileira (Verso, Pré-Refrão, Refrão)
3. Conecte emocionalmente com a história pessoal
4. Mantenha o estilo ${style} autêntico
5. Use linguagem brasileira natural e acessível
6. Inclua detalhes específicos da história quando possível

FORMATO DE RESPOSTA:
[Verso 1]
(letra do primeiro verso)

[Pré-Refrão]
(preparação para o refrão)

[Refrão]
(refrão principal - mais forte emocionalmente)

[Verso 2]
(segundo verso desenvolvendo a história)

[Pré-Refrão]
(preparação para o refrão)

[Refrão]
(refrão principal repetido)

[Bridge/Ponte]
(momento de maior emoção)

[Refrão Final]
(refrão com variação final)

Crie uma letra que faça a pessoa se emocionar e se identificar com a história!`;

  try {
    console.log("[Gemini] Enhancing lyrics with context:", {
      title,
      style,
      hasOriginalLyrics: !!originalLyrics,
      storyLength: story.length,
    });

    const enhancedText = await callGeminiAPI(prompt);

    // Parse the response to extract lyrics and structure
    const structureMatch = enhancedText.match(/\[(Verso|Refrão|Pre-Refrão|Pré-Refrão|Bridge|Ponte|Final)\]/gi);
    const structure = structureMatch ? structureMatch.join(', ') : 'Verso, Refrão, Verso, Refrão';

    // Determine theme from the story
    const themeKeywords = [
      'amor', 'amizade', 'família', 'saudade', 'alegria', 
      'celebração', 'superação', 'gratidão', 'esperança'
    ];
    const theme = themeKeywords.find(keyword => 
      story.toLowerCase().includes(keyword)
    ) || 'vida';

    return {
      lyrics: enhancedText.trim(),
      structure,
      theme,
      improved: !!originalLyrics,
      originalLyrics,
    };
  } catch (error) {
    console.error("[Gemini] Enhancement failed:", error);
    
    // Fallback: return original lyrics or generate basic structure
    if (originalLyrics) {
      return {
        lyrics: originalLyrics,
        structure: 'Original',
        theme: 'historia',
        improved: false,
        originalLyrics,
      };
    }

    // Generate basic fallback lyrics
    const fallbackLyrics = `[Verso 1]
${title}
Uma história especial para contar
${story.slice(0, 100)}...
Momentos que vão sempre ficar

[Refrão]
Essa é nossa canção
Feita com o coração
${title}
Uma história de emoção`;

    return {
      lyrics: fallbackLyrics,
      structure: 'Verso, Refrão',
      theme: 'historia',
      improved: false,
    };
  }
}

/**
 * Quick lyrics improvement for existing songs
 */
export async function improveLyrics(originalLyrics: string, context: string): Promise<string> {
  if (!ENV.forgeApiKey) {
    console.warn("[Gemini] API key not configured, returning original lyrics");
    return originalLyrics;
  }

  const prompt = `Melhore esta letra de música brasileira mantendo a essência e emoção:

CONTEXTO: ${context}

LETRA ORIGINAL:
${originalLyrics}

Instrucoes:
- Mantenha a estrutura musical
- Melhore a métrica e rimas
- Torne mais emocionante e brasileira
- Corrija problemas de fluência
- Mantenha o mesmo tamanho

Retorne apenas a letra melhorada:`;

  try {
    const improved = await callGeminiAPI(prompt);
    return improved.trim();
  } catch (error) {
    console.error("[Gemini] Lyrics improvement failed:", error);
    return originalLyrics;
  }
}

/**
 * Test Gemini API connectivity
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    await callGeminiAPI("Responda apenas: 'OK'. Teste de conexão Gemini.");
    return true;
  } catch (error) {
    console.error("[Gemini] Connection test failed:", error);
    return false;
  }
}