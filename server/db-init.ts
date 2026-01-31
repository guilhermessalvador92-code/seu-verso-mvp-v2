/**
 * Database Initialization Module
 * Executes on server startup to ensure all tables exist
 * This runs BEFORE any other server logic
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_RETRIES = 5;
const RETRY_DELAY = 1000; // 1 segundo entre tentativas

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function initializeDatabaseSchema(attempt: number = 1): Promise<boolean> {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.warn("[DB Init] DATABASE_URL not set, skipping schema initialization");
    return true; // Não falhar se não houver URL
  }

  try {
    console.log(`[DB Init] Initializing database schema (attempt ${attempt}/${MAX_RETRIES})...`);
    
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log("[DB Init] Connected to database");

    const sqlPath = path.resolve(__dirname, "../scripts/init-db.sql");
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`[DB Init] SQL file not found at ${sqlPath}`);
      await connection.end();
      return false;
    }

    const sql = fs.readFileSync(sqlPath, "utf8");
    const statements = sql.split(";").filter((s: string) => s.trim());

    console.log(`[DB Init] Found ${statements.length} SQL statements`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          successCount++;
        } catch (error: any) {
          // Ignorar erros de tabelas já existentes
          if (
            error.message?.includes("already exists") ||
            error.code === "ER_TABLE_EXISTS_ERROR"
          ) {
            skipCount++;
          } else {
            console.error(`[DB Init] Error on statement ${i + 1}:`, error.message);
            errorCount++;
          }
        }
      }
    }

    await connection.end();

    console.log(
      `[DB Init] ✅ Schema initialization complete! Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`
    );

    return true;
  } catch (error: any) {
    console.error(`[DB Init] Error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

    if (attempt < MAX_RETRIES) {
      console.log(`[DB Init] Retrying in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY);
      return initializeDatabaseSchema(attempt + 1);
    } else {
      console.error("[DB Init] ❌ Max retries reached");
      // Não falhar completamente - o servidor pode iniciar mesmo sem tabelas
      // Mas isso vai causar erros quando tentar usar as tabelas
      return false;
    }
  }
}
