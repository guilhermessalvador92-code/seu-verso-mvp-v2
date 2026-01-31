import { invokeLLM } from "./_core/llm";

export interface SunoGenerateRequest {
  customMode: boolean;
  instrumental: boolean;
  model: "V5" | "V4_5PLUS" | "V4_5ALL" | "V4_5" | "V4";
  callBackUrl: string;
  prompt: string;
  style: string;
  title: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoGenerateResponse {
  code: number;
  msg: string;
  data?: {
    taskId: string;
  };
}

export interface SunoTaskDetails {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    status: string;
    audioUrl?: string;
    audioUrls?: string[];
    videoUrl?: string;
    imageUrl?: string;
    title?: string;
    prompt?: string;
    style?: string;
    lyrics?: string;
    gpt_description_prompt?: string;
    tags?: string;
    type?: string;
    duration?: number;
    create_time?: number;
    finish_time?: number;
    error?: string;
  };
}

const SUNO_API_BASE = "https://api.sunoapi.org";

// Usar endpoint de geração normal (não cover) conforme documentação oficial
const USE_SUNO_COVER = false; // Desativado - usar /api/v1/generate

import { nanoid } from "nanoid";

export async function generateMusicWithSuno(
  jobId: string,
  story: string,
  style: string,
  names: string,
  occasion: string | undefined,
  mood: string | undefined,
  callbackUrl: string
): Promise<string | null> {
  // In test or CI environments we avoid making external API calls to prevent
  // consuming credits or introducing flakiness. Return a mock task id instead.
  if (process.env.NODE_ENV === "test" || process.env.DISABLE_EXTERNAL_APIS === "true") {
    console.log("[Suno] Skipping external call in test mode; returning mock taskId");
    return `test-${nanoid(8)}`;
  }

  // Mock mode for testing without spending credits
  if (process.env.MOCK_SUNO_API === "true") {
    const mockTaskId = `mock-${nanoid(8)}`;
    console.log("[Suno] MOCK MODE - Returning mock task ID:", mockTaskId);
    console.log("[Suno] To disable mock mode, set MOCK_SUNO_API=false or remove it");
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockTaskId;
  }

  const SUNO_API_KEY = process.env.SUNO_API_KEY;
  if (!SUNO_API_KEY) {
    console.error("[Suno] API Key not configured");
    return null;
  }

  // Usar endpoint de geração normal conforme documentação oficial

  try {
    // Gerar prompt otimizado com LLM (Gemini)
    const prompt = await buildPromptWithLLM(story, names, occasion, mood);

    // Mapear estilo musical para o formato esperado pela Suno
    const sunoStyle = mapMusicStyle(style);

    // Criar título da música
    const title = `Música para ${names}`;

    // Create song prompt WITH lyrics - we want a proper song with vocals
    const songPrompt = `${prompt}\n\nIMPORTANT: This MUST be a SONG with VOCALS and LYRICS. Include singing with clear lyrics in Portuguese. The lyrics should tell the story or celebrate the person/occasion mentioned.`;

    const payload: SunoGenerateRequest = {
      customMode: true,
      instrumental: false,  // WITH vocals and lyrics
      model: "V4_5PLUS",
      callBackUrl: callbackUrl,
      prompt: songPrompt,
      style: sunoStyle,
      title: title,
      styleWeight: 0.8,
      weirdnessConstraint: 0.4,
      audioWeight: 0.7,
    };

    console.log("[Suno] Sending request to generate music WITH LYRICS", {
      taskId: "pending",
      style: sunoStyle,
      title: title,
      hasLyrics: true,
      costEstimate: "Standard (with vocals and lyrics)",
    });

    const response = await fetch(`${SUNO_API_BASE}/api/v1/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: SunoGenerateResponse = await response.json();

    if (data.code !== 200) {
      console.error("[Suno] Generation failed", {
        code: data.code,
        msg: data.msg,
      });
      return null;
    }

    const taskId = data.data?.taskId;
    console.log("[Suno] Generation started", { taskId, jobId });

    // Armazenar sunoTaskId no banco de dados para polling
    if (taskId) {
      try {
        const { updateJobSunoTaskId } = await import("./db");
        await updateJobSunoTaskId(jobId, taskId);
      } catch (error) {
        console.error("[Suno] Failed to store sunoTaskId:", error);
      }
    }

    return taskId || null;
  } catch (error) {
    console.error("[Suno] Error generating music:", error);
    return null;
  }
}



export async function getSunoTaskDetails(taskId: string): Promise<SunoTaskDetails | null> {
  // Mock mode for testing without spending credits
  if (process.env.MOCK_SUNO_API === "true" && taskId.startsWith("mock-")) {
    console.log("[Suno] MOCK MODE - Returning mock task details for:", taskId);
    
    // Return a completed mock task
    return {
      code: 200,
      msg: "success",
      data: {
        taskId: taskId,
        status: "complete",
        gpt_description_prompt: "Mock music generated",
        prompt: "Mock prompt",
        title: "Mock Music",
        imageUrl: "https://via.placeholder.com/300",
        lyrics: "Mock lyrics for testing",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: 180,
        tags: "mock, test",
      },
    };
  }

  // Try to fetch from Suno API with fallback endpoints
  const SUNO_API_KEY = process.env.SUNO_API_KEY;
  if (!SUNO_API_KEY) {
    console.error("[Suno] API Key not configured");
    return null;
  }

  try {
    // Use /api/v1/fetch endpoint with ids parameter
    const url = `${SUNO_API_BASE}/api/v1/fetch?ids=${taskId}`;
    console.log("[Suno] Fetching task details from:", url);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("[Suno] Response status:", response.status);
    
    const data: SunoTaskDetails = await response.json();
    
    console.log("[Suno] Response data:", JSON.stringify(data).substring(0, 200));

    if (!data.code) {
      console.error("[Suno] Invalid response structure", { data });
      return null;
    }
    
    if (data.code !== 200) {
      console.error("[Suno] Failed to get task details", {
        code: data.code,
        msg: data.msg,
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Suno] Error getting task details:", error);
    return null;
  }
}

async function buildPromptWithLLM(
  story: string,
  names: string,
  occasion: string | undefined,
  mood: string | undefined
): Promise<string> {
  try {
    const systemPrompt = `Você é um especialista em criar prompts para geração de músicas personalizadas. 
Seu objetivo é transformar uma história/contexto em um prompt detalhado e inspirador para a Suno API gerar uma música em português brasileiro.

REGRAS IMPORTANTES:
- A música DEVE ser 100% em português brasileiro
- Evitar mistura de idiomas
- Criar letras coerentes, bem estruturadas e profissionais
- Incluir verso, pré-refrão e refrão
- Rimas naturais e bem pensadas
- Métrica e ritmo consistentes
- Mensagem clara e emocionante
- Duração: 2-3 minutos

Retorne APENAS o prompt otimizado, sem explicações adicionais.`;

    const userMessage = `Crie um prompt para gerar uma música personalizada com os seguintes dados:

Nome(s) do(s) homenageado(s): ${names}
${occasion ? `Ocasião: ${occasion}` : ""}
${mood ? `Clima/Emoção: ${mood}` : ""}

Contexto/História:
${story}

Gere um prompt detalhado e inspirador para a Suno API criar uma música memorável.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("[LLM] Empty response, using fallback prompt");
      return buildFallbackPrompt(story, names, occasion, mood);
    }

    // Limitar a 5000 caracteres (limite do modelo V4_5PLUS)
    const prompt = typeof content === "string" ? content : JSON.stringify(content);
    if (prompt.length > 5000) {
      return prompt.substring(0, 4997) + "...";
    }

    return prompt;
  } catch (error) {
    console.error("[LLM] Error building prompt:", error);
    return buildFallbackPrompt(story, names, occasion, mood);
  }
}

function buildFallbackPrompt(
  story: string,
  names: string,
  occasion: string | undefined,
  mood: string | undefined
): string {
  let prompt = `Create a pure instrumental composition (NO vocals, NO singing, NO lyrics). Emotionally resonant background music inspired by:\n\n`;
  prompt += `For: ${names}\n`;

  if (occasion) {
    prompt += `Occasion: ${occasion}\n`;
  }

  let moodDescription = "";
  if (mood) {
    const moodMap: Record<string, string> = {
      "Emocionante": "emotional, touching, moving",
      "Alegre": "joyful, uplifting, celebratory",
      "Engraçado": "playful, lighthearted, fun",
      "Épico": "epic, grand, inspirational",
    };
    moodDescription = moodMap[mood] || mood.toLowerCase();
    prompt += `Mood: ${moodDescription}\n`;
  }

  prompt += `\nContext/Story:\n${story}\n\n`;
  prompt += `IMPORTANT:\n`;
  prompt += `- PURE INSTRUMENTAL - absolutely NO vocals, NO singing, NO words\n`;
  prompt += `- Emotionally coherent and well-structured\n`;
  prompt += `- Consistent rhythm and flow\n`;
  prompt += `- Clear emotional message through instrumentation\n`;
  prompt += `- Duration: 2-3 minutes\n`;
  prompt += `- Focus on atmospheric, immersive soundscapes`;

  if (prompt.length > 5000) {
    prompt = prompt.substring(0, 4997) + "...";
  }

  return prompt;
}

function mapMusicStyle(style: string): string {
  const styleMap: Record<string, string> = {
    "Sertanejo": "Brazilian Sertanejo, country, acoustic guitar",
    "Pop": "Pop, upbeat, catchy melodies",
    "Rock": "Rock, electric guitar, energetic",
    "MPB": "Brazilian MPB, bossa nova, sophisticated",
    "Gospel": "Gospel, spiritual, uplifting",
    "Funk": "Funk, groovy, rhythmic",
    "Romântica 80/90": "Romantic 80s 90s pop, sentimental, ballad",
    "Soul/Groove": "Soul, groove, smooth vocals",
  };

  return styleMap[style] || style;
}
