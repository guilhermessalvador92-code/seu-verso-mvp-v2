#!/usr/bin/env node
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 segundos entre tentativas

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeDatabase(attempt = 1) {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log('[Init DB] DATABASE_URL not set, skipping initialization');
    process.exit(0);
  }

  try {
    console.log(`[Init DB] Connecting to database (attempt ${attempt}/${MAX_RETRIES})...`);
    const sql = postgres(DATABASE_URL);
    
    console.log('[Init DB] Connection successful!');
    console.log('[Init DB] Reading SQL schema...');
    
    const sqlPath = path.join(__dirname, 'init-db.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`[Init DB] SQL file not found at ${sqlPath}`);
      await sql.end();
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(s => s.trim());
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`[Init DB] Executing statement ${i + 1}/${statements.length}...`);
          await sql.unsafe(statement);
          successCount++;
        } catch (error) {
          // Ignorar erros de tabelas já existentes
          if (error.message?.includes('already exists') || error.code === '42P07') {
            console.log(`[Init DB] Table already exists, skipping...`);
            successCount++;
          } else {
            console.error(`[Init DB] Error executing statement ${i + 1}:`, error.message);
            errorCount++;
          }
        }
      }
    }
    
    console.log(`[Init DB] ✅ Database initialization complete!`);
    console.log(`[Init DB] Statements executed: ${successCount}, Errors: ${errorCount}`);
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error(`[Init DB] Error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);
    
    if (attempt < MAX_RETRIES) {
      console.log(`[Init DB] Retrying in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY);
      return initializeDatabase(attempt + 1);
    } else {
      console.error('[Init DB] ❌ Max retries reached, giving up');
      // Não falhar - permitir que o servidor inicie mesmo sem tabelas
      // O servidor tentará criar as tabelas novamente
      process.exit(0);
    }
  }
}

initializeDatabase();
