import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().optional(),
  
  // APIs Externas (optional because they may not be needed in all environments)
  RESEND_API_KEY: z.string().optional(),
  SUNO_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // Email
  FROM_EMAIL: z.string().email("FROM_EMAIL deve ser um email válido").default("noreply@seu-verso.com"),
  
  // App
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Feature Flags
  MOCK_SUNO_API: z.string().optional(),
  USE_SUNO_COVER_ENDPOINT: z.string().optional(),
  DISABLE_EXTERNAL_APIS: z.string().optional(),
  
  // OAuth/Auth
  VITE_APP_ID: z.string().default(""),
  JWT_SECRET: z.string().default(""),
  OAUTH_SERVER_URL: z.string().default(""),
  OWNER_OPEN_ID: z.string().default(""),
  
  // Forge/Storage
  BUILT_IN_FORGE_API_URL: z.string().optional(),
  BUILT_IN_FORGE_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    try {
      _env = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Erro de validação de variáveis de ambiente:");
        error.issues.forEach((err: z.ZodIssue) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      }
      throw new Error("Configuração de ambiente inválida");
    }
  }
  return _env;
}

// Validar no startup (apenas em produção)
if (process.env.NODE_ENV === "production") {
  getEnv();
}

// Backward compatibility with existing ENV export
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.GEMINI_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
