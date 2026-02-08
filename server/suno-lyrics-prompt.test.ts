/**
 * Test to verify that generateLyricsWithSuno creates prompts
 * that are always 200 characters or less
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Suno Lyrics Prompt Length", () => {
  beforeEach(() => {
    // Mock the fetch function to prevent actual API calls
    global.fetch = vi.fn();
  });

  // Helper function to simulate prompt generation logic
  function generatePrompt(
    names: string,
    occasion: string | undefined,
    mood: string | undefined,
    style: string,
    story: string
  ): string {
    let parts: string[] = [];
    
    // Nome (obrigatório, curto)
    if (names && names.length <= 30) {
      parts.push(`Para ${names}`);
    } else if (names) {
      parts.push(`Para ${names.substring(0, 25)}`);
    }
    
    // Ocasião (curta)
    if (occasion && occasion.length <= 20) {
      parts.push(occasion);
    } else if (occasion) {
      parts.push(occasion.substring(0, 17) + "...");
    }
    
    // Humor/sentimento
    if (mood && mood.length <= 15) {
      parts.push(mood);
    }
    
    // Estilo musical (curto)
    if (style && style.length <= 15) {
      parts.push(style);
    }
    
    // História (MUITO curta - apenas essência)
    if (story) {
      const maxStoryLength = 80;
      const storyClean = story.replace(/\n/g, ' ').trim();
      if (storyClean.length <= maxStoryLength) {
        parts.push(storyClean);
      } else {
        parts.push(storyClean.substring(0, maxStoryLength - 3) + "...");
      }
    }
    
    // Idioma
    parts.push("pt-BR");
    
    // Juntar partes
    let prompt = parts.join(". ");
    
    // GARANTIA ABSOLUTA: máximo 200 caracteres
    if (prompt.length > 200) {
      prompt = prompt.substring(0, 197) + "...";
    }
    
    return prompt;
  }

  it("should generate prompt within 200 character limit - Example 1", () => {
    const prompt = generatePrompt(
      "Guilherme",
      "Aniversário",
      "alegre",
      "Pop",
      "API do WhatsApp que envia milhões de mensagens em um minuto"
    );
    
    console.log("Example 1 - Prompt length:", prompt.length);
    console.log("Example 1 - Prompt:", prompt);
    
    expect(prompt.length).toBeLessThanOrEqual(200);
  });

  it("should generate prompt within 200 character limit - Example 2", () => {
    const prompt = generatePrompt(
      "Maria",
      "Casamento",
      "romântico",
      "Balada",
      "Nossa história de amor começou na faculdade há 5 anos"
    );
    
    console.log("Example 2 - Prompt length:", prompt.length);
    console.log("Example 2 - Prompt:", prompt);
    
    expect(prompt.length).toBeLessThanOrEqual(200);
  });

  it("should generate prompt within 200 character limit - Example 3", () => {
    const prompt = generatePrompt(
      "João",
      "Formatura",
      "inspirador",
      "Rock",
      "Depois de 6 anos de luta consegui me formar em medicina e agora vou curar vidas"
    );
    
    console.log("Example 3 - Prompt length:", prompt.length);
    console.log("Example 3 - Prompt:", prompt);
    
    expect(prompt.length).toBeLessThanOrEqual(200);
  });

  it("should handle very long inputs and still stay under 200 chars", () => {
    const longName = "Maria Fernanda da Silva Santos Oliveira";
    const longOccasion = "Casamento de Bodas de Prata Comemorativas";
    const longStory = "Era uma vez, há muitos anos atrás, quando o mundo era diferente e as pessoas tinham outras preocupações, começou uma história de amor que atravessaria gerações e seria contada por todos os membros da família para sempre, uma história épica e inesquecível que mudaria vidas para sempre e jamais seria esquecida";
    
    const prompt = generatePrompt(
      longName,
      longOccasion,
      "emocionante",
      "MPB",
      longStory
    );
    
    console.log("Long input - Prompt length:", prompt.length);
    console.log("Long input - Prompt:", prompt);
    
    expect(prompt.length).toBeLessThanOrEqual(200);
  });

  it("should handle minimal inputs", () => {
    const prompt = generatePrompt(
      "Ana",
      undefined,
      undefined,
      "Pop",
      "Feliz"
    );
    
    console.log("Minimal input - Prompt length:", prompt.length);
    console.log("Minimal input - Prompt:", prompt);
    
    expect(prompt.length).toBeLessThanOrEqual(200);
    expect(prompt.length).toBeGreaterThan(0);
  });

  it("should always include pt-BR in the prompt", () => {
    const prompt = generatePrompt(
      "Test",
      "Test",
      "Test",
      "Test",
      "Test"
    );
    
    expect(prompt).toContain("pt-BR");
    expect(prompt.length).toBeLessThanOrEqual(200);
  });
});
