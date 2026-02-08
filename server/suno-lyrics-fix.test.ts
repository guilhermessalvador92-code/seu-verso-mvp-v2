import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateLyricsWithSuno } from "./suno";

describe("Suno Lyrics API Fix", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Set a mock API key for tests
    process.env.SUNO_API_KEY = "test-api-key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create a prompt with max 200 characters", async () => {
    // Mock fetch to capture the request
    let capturedPayload: any;
    global.fetch = async (url: string, options: any) => {
      capturedPayload = JSON.parse(options.body);
      return {
        json: async () => ({
          code: 200,
          msg: "success",
          data: { taskId: "test-task-id" }
        })
      } as Response;
    };

    const longStory = "Uma música para celebrar que o sistema está funcionando! ".repeat(20);
    
    await generateLyricsWithSuno(
      "test-job-id",
      longStory,
      "Guilherme",
      "Teste Final",
      "alegre",
      "Pop",
      "Português do Brasil",
      "http://test.com/callback"
    );

    // Check that prompt is under 200 characters
    expect(capturedPayload.prompt.length).toBeLessThanOrEqual(200);
    console.log("Prompt length:", capturedPayload.prompt.length);
    console.log("Prompt:", capturedPayload.prompt);
  });

  it("should include all required parameters", async () => {
    let capturedPayload: any;
    global.fetch = async (url: string, options: any) => {
      capturedPayload = JSON.parse(options.body);
      return {
        json: async () => ({
          code: 200,
          msg: "success",
          data: { taskId: "test-task-id" }
        })
      } as Response;
    };

    await generateLyricsWithSuno(
      "test-job-id",
      "Uma história curta para teste",
      "Maria",
      "Aniversário",
      "alegre",
      "Pop brasileiro",
      "Português do Brasil",
      "http://test.com/callback"
    );

    // Check all required parameters
    expect(capturedPayload).toHaveProperty("prompt");
    expect(capturedPayload).toHaveProperty("style");
    expect(capturedPayload).toHaveProperty("vocalGender");
    expect(capturedPayload).toHaveProperty("weirdnessConstraint");
    expect(capturedPayload).toHaveProperty("callBackUrl");

    // Verify parameter values
    expect(capturedPayload.vocalGender).toBe("male");
    expect(capturedPayload.weirdnessConstraint).toBe(0.45);
    expect(capturedPayload.style).toContain("Pop brasileiro");
    expect(capturedPayload.style).toContain("Português do Brasil");
    expect(capturedPayload.style).toContain("Aniversário");
    expect(capturedPayload.callBackUrl).toBe("http://test.com/callback");
  });

  it("should format prompt correctly with context only", async () => {
    let capturedPayload: any;
    global.fetch = async (url: string, options: any) => {
      capturedPayload = JSON.parse(options.body);
      return {
        json: async () => ({
          code: 200,
          msg: "success",
          data: { taskId: "test-task-id" }
        })
      } as Response;
    };

    await generateLyricsWithSuno(
      "test-job-id",
      "Ela adora dançar e viajar com a família.",
      "Maria",
      "Aniversário de 30 anos",
      "alegre",
      "Pop brasileiro",
      "Português do Brasil",
      "http://test.com/callback"
    );

    // Check that prompt contains expected parts
    expect(capturedPayload.prompt).toContain("Para Maria");
    expect(capturedPayload.prompt).toContain("Aniversário de 30 anos");
    expect(capturedPayload.prompt).toContain("Sentimento: alegre");
    expect(capturedPayload.prompt).toContain("dançar e viajar");
    
    console.log("Final payload:", JSON.stringify(capturedPayload, null, 2));
  });

  it("should truncate story when it's too long", async () => {
    let capturedPayload: any;
    global.fetch = async (url: string, options: any) => {
      capturedPayload = JSON.parse(options.body);
      return {
        json: async () => ({
          code: 200,
          msg: "success",
          data: { taskId: "test-task-id" }
        })
      } as Response;
    };

    const longStory = "A".repeat(150);
    
    await generateLyricsWithSuno(
      "test-job-id",
      longStory,
      "João",
      "Casamento",
      "romântico",
      "Balada romântica",
      "Português do Brasil",
      "http://test.com/callback"
    );

    // Story should be truncated to fit in 100 chars
    const storyInPrompt = capturedPayload.prompt.split(". ").find((part: string) => part.includes("A"));
    expect(storyInPrompt.length).toBeLessThanOrEqual(103); // 100 + "..."
    
    // Overall prompt should still be under 200
    expect(capturedPayload.prompt.length).toBeLessThanOrEqual(200);
  });
});
