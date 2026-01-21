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
  const prompt = `Você é um compositor e storyteller brasileiro MESTRE em criar letras que EMOCIONAM e CONECTAM profundamente.

=== CONTEXTO EMOCIONAL ===
- Título: "${title}"
- Estilo Musical: ${style}
- História Real: ${story}
${occasion ? `- Ocasião Especial: ${occasion}` : ''}
${mood ? `- Clima Desejado: ${mood}` : ''}
${originalLyrics ? `\nLETRA BASE (para aprimorar):\n${originalLyrics}` : ''}

=== REGRAS RÍGIDAS ===
❌ JAMAIS inicie com frases genéricas como:
   - "Uma música forte e empolgante"
   - "Uma história de amor cantada em..."
   - "Esta é uma canção sobre..."
   - "Vamos contar a história de..."

✅ SEMPRE comece DIRETO na narrativa emocional
✅ MERGULHE imediatamente na história pessoal
✅ USE detalhes específicos da história fornecida

=== GATILHOS DE NEUROMARKETING ===
1. 🧠 NOSTALGIA: Evoque memórias afetivas específicas
2. 💝 PERTENCIMENTO: Crie conexão "essa música é sobre MIM"
3. 🎯 ESPECIFICIDADE: Use detalhes únicos da história
4. 😢 CONTRASTE EMOCIONAL: Alterne momentos doces/intensos
5. 🔄 REPETIÇÃO ESTRATÉGICA: Palavras-chave que grudam na mente
6. 🎭 IDENTIFICAÇÃO: O ouvinte se vê na história
7. ⚡ URGÊNCIA EMOCIONAL: "Este momento é único"

=== ESTRUTURA STORYTELLING ===
SIGA ESTA PROGRESSÃO NARRATIVA:

[Verso 1 - ESTABELECER O MUNDO]
- Contexto específico da história
- Detalhes sensoriais (cheiros, sons, lugares)
- Personagens reais da narrativa

[Pré-Refrão - TENSÃO EMOCIONAL]
- Momento de transição emocional
- Preparar para o clímax emocional

[Refrão - VERDADE UNIVERSAL + ESPECÍFICA]
- Mensagem central que ressoa universalmente
- MAS com detalhes específicos desta história
- Frase que o ouvinte vai cantar e lembrar

[Verso 2 - DESENVOLVIMENTO]
- Aprofundar a narrativa
- Mostrar evolução/crescimento
- Adicionar camada emocional

[Pré-Refrão]
- Intensificar a emoção

[Refrão]
- Repetir com variação sutil

[Ponte/Bridge - REVELAÇÃO EMOCIONAL]
- Momento mais íntimo e vulnerável
- Verdade profunda sobre a relação/história
- Clímax emocional da música

[Refrão Final]
- Versão mais poderosa
- Resolução emocional satisfatória

=== QUALIDADE TÉCNICA ===
- DICÇÃO PERFEITA: Palavras fáceis de cantar
- MÉTRICA CONSISTENTE: Flui naturalmente no ritmo
- RIMAS INTELIGENTES: Não forçadas, naturais
- PORTUGUÊS BRASILEIRO: Claro, sem estrangeirismos desnecessários
- PROGRESSÃO LÓGICA: Cada verso leva ao próximo

=== ELEMENTOS POÉTICOS ===
- METÁFORAS VISUAIS: Imagens que o ouvinte consegue "ver"
- ALITERAÇÕES SUTIS: Sons que fluem bem
- CAMPO SEMÂNTICO: Palavras que se conectam tematicamente
- SIMBOLISMO: Objetos/lugares que representam emoções

=== VALIDAÇÃO FINAL ===
Antes de entregar, verifique:
1. A letra conta UMA história específica?
2. Cada verso avança a narrativa?
3. O refrão é memorável e específico?
4. Remove introduções genéricas?
5. Conecta emocionalmente com quem vai ouvir?
6. Tem detalhes únicos desta história?

Crie uma letra que faça a pessoa CHORAR de emoção e pensar "essa música é sobre a MINHA vida!"

RESPONDA APENAS COM A LETRA FINAL:`;

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
 * Validate lyrics to ensure quality and remove generic introductions
 */
function validateLyrics(lyrics: string, context: string): { isValid: boolean; issues: string[]; cleanedLyrics: string } {
  const issues: string[] = [];
  let cleanedLyrics = lyrics;

  // Check for generic introductions that should never appear
  const genericPhrases = [
    /uma música forte e empolgante/gi,
    /uma história de amor cantada em/gi,
    /esta é uma canção sobre/gi,
    /vamos contar a história de/gi,
    /esta música fala sobre/gi,
    /aqui temos uma canção/gi,
    /apresentamos uma música/gi,
    /esta é a história de/gi
  ];

  genericPhrases.forEach(pattern => {
    if (pattern.test(lyrics)) {
      issues.push('Contains generic introduction phrases');
      cleanedLyrics = cleanedLyrics.replace(pattern, '');
    }
  });

  // Remove empty lines at the beginning
  cleanedLyrics = cleanedLyrics.replace(/^\s*\n+/, '');

  // Check if lyrics are too short
  if (cleanedLyrics.length < 200) {
    issues.push('Lyrics too short, need more content');
  }

  // Check if has proper structure
  const hasVerse = /\[Verso/i.test(cleanedLyrics);
  const hasChorus = /\[Refrão/i.test(cleanedLyrics);
  
  if (!hasVerse || !hasChorus) {
    issues.push('Missing essential song structure (Verso/Refrão)');
  }

  // Check if contains context elements
  const contextWords = context.toLowerCase().split(' ').filter(word => word.length > 3);
  const lyricsLower = cleanedLyrics.toLowerCase();
  const contextMatches = contextWords.some(word => lyricsLower.includes(word));
  
  if (!contextMatches && contextWords.length > 0) {
    issues.push('Lyrics dont connect with the provided story context');
  }

  return {
    isValid: issues.length === 0,
    issues,
    cleanedLyrics: cleanedLyrics.trim()
  };
}

/**
 * Generate and validate lyrics with multiple attempts
 */
export async function generateValidatedLyrics(options: LyricsEnhancementOptions): Promise<EnhancedLyrics> {
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Gemini] Generating lyrics attempt ${attempt}/${maxAttempts}`);
      
      const result = await enhanceLyrics(options);
      
      // Validate the generated lyrics
      const validation = validateLyrics(result.lyrics, options.story);
      
      if (validation.isValid) {
        console.log(`[Gemini] Lyrics validated successfully on attempt ${attempt}`);
        return {
          ...result,
          lyrics: validation.cleanedLyrics,
          improved: true
        };
      } else {
        console.warn(`[Gemini] Lyrics validation failed on attempt ${attempt}:`, validation.issues);
        
        if (attempt === maxAttempts) {
          // Last attempt - return cleaned version even if not perfect
          return {
            ...result,
            lyrics: validation.cleanedLyrics,
            improved: true
          };
        }
        
        // Try again with more specific instructions
        options = {
          ...options,
          originalLyrics: validation.cleanedLyrics + `\n\n[PREVIOUS ISSUES TO FIX: ${validation.issues.join(', ')}]`
        };
      }
    } catch (error) {
      console.error(`[Gemini] Attempt ${attempt} failed:`, error);
      lastError = error as Error;
    }
  }

  // All attempts failed, return fallback
  throw lastError || new Error('Failed to generate valid lyrics after multiple attempts');
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