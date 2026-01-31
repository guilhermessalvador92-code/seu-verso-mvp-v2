#!/usr/bin/env node
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.log('[Init DB] DATABASE_URL not set, skipping initialization');
    process.exit(0);
  }

  try {
    console.log('[Init DB] Connecting to database...');
    const connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('[Init DB] Reading SQL schema...');
    const sqlPath = path.join(__dirname, 'init-db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('[Init DB] Executing:', statement.substring(0, 50) + '...');
        await connection.execute(statement);
      }
    }
    
    console.log('[Init DB] ✅ Database initialized successfully');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('[Init DB] ❌ Error:', error.message);
    // Don't fail - tables might already exist
    process.exit(0);
  }
}

initializeDatabase();
