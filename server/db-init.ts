/**
 * Database Initialization Module
 * Executes on server startup to ensure all tables exist and are up-to-date
 * This runs BEFORE any other server logic
 */

import postgres from "postgres";
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
    return true;
  }

  try {
    console.log(`[DB Init] Initializing database schema (attempt ${attempt}/${MAX_RETRIES})...`);
    
    const sql = postgres(DATABASE_URL);
    console.log("[DB Init] Connected to database");

    // Step 1: Create tables
    const sqlPath = path.resolve(__dirname, "../scripts/init-db.sql");
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`[DB Init] SQL file not found at ${sqlPath}`);
      await sql.end();
      return false;
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf8");
    const statements = sqlContent.split(";").filter((s: string) => s.trim());

    console.log(`[DB Init] Found ${statements.length} SQL statements`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          successCount++;
        } catch (error: any) {
          // PostgreSQL error codes:
          // 42P07 = duplicate_table (table already exists)
          // 42710 = duplicate_object (enum type already exists)
          // 2BP01 = dependent_objects_still_exist (CASCADE will handle)
          if (
            error.message?.includes("already exists") ||
            error.code === "42P07" ||
            error.code === "42710" ||
            error.code === "2BP01" ||
            error.message?.includes("does not exist")
          ) {
            skipCount++;
          } else {
            console.error(`[DB Init] Error on statement ${i + 1}:`, error.message);
            errorCount++;
          }
        }
      }
    }

    console.log(
      `[DB Init] Schema initialization: Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`
    );

    // Step 2: Run migrations
    console.log("[DB Init] Running migrations...");
    const migrationPath = path.resolve(__dirname, "../scripts/migrate-fix-songs.sql");
    
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, "utf8");
      const migrationStatements = migrationSql.split(";").filter((s: string) => s.trim());

      console.log(`[DB Init] Found ${migrationStatements.length} migration statements`);

      let migrationSuccess = 0;
      let migrationError = 0;

      for (let i = 0; i < migrationStatements.length; i++) {
        const statement = migrationStatements[i];
        if (statement.trim()) {
          try {
            await sql.unsafe(statement);
            migrationSuccess++;
          } catch (error: any) {
            console.warn(`[DB Init] Migration warning:`, error.message);
            migrationError++;
          }
        }
      }

      console.log(
        `[DB Init] Migrations: Success: ${migrationSuccess}, Errors: ${migrationError}`
      );
    }

    await sql.end();

    console.log(`[DB Init] ✅ Database initialization complete!`);

    return true;
  } catch (error: any) {
    console.error(`[DB Init] Error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

    if (attempt < MAX_RETRIES) {
      console.log(`[DB Init] Retrying in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY);
      return initializeDatabaseSchema(attempt + 1);
    } else {
      console.error("[DB Init] ❌ Max retries reached");
      return false;
    }
  }
}
