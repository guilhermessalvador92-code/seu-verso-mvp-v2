import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { InsertUser, users, jobs, songs, leads, Job, Song, Lead, InsertJob, InsertSong, InsertLead } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

// In-memory fallback storage used when DATABASE_URL is not configured
const _mockJobs: InsertJob[] = [];
const _mockSongs: InsertSong[] = [];
const _mockLeads: InsertLead[] = [];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Wraps database operations with retry logic for transient connection errors
 */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = 
        error.code === 'PROTOCOL_CONNECTION_LOST' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED';
      
      if (isConnectionError && attempt < MAX_RETRIES) {
        console.warn(`[Database] Connection error, retrying (${attempt}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create connection pool with proper settings
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000, // 10 seconds
        idleTimeout: 60000, // 60 seconds
        maxIdle: 5,
      });
      
      // Initialize drizzle with the pool
      _db = drizzle(_pool);
      console.log("[Database] Connection pool initialized successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  return withRetry(async () => {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createJob(data: InsertJob): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) {
    _mockJobs.push(data);
    return data as Job;
  }
  
  return withRetry(async () => {
    await db.insert(jobs).values(data);
    return data as Job;
  });
}

export async function getJobById(jobId: string): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) {
    const found = _mockJobs.find((j) => j.id === jobId);
    return found as Job | undefined;
  }
  const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getJobBySunoTaskId(sunoTaskId: string): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) {
    const found = _mockJobs.find((j) => j.sunoTaskId === sunoTaskId);
    return found as Job | undefined;
  }
  const result = await db.select().from(jobs).where(eq(jobs.sunoTaskId, sunoTaskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateJobStatus(jobId: string, status: Job["status"]): Promise<void> {
  const db = await getDb();
  if (!db) {
    const idx = _mockJobs.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      _mockJobs[idx].status = status;
      _mockJobs[idx].updatedAt = new Date();
    }
    return;
  }
  
  return withRetry(async () => {
    await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));
  });
}

export async function updateJobSunoTaskId(jobId: string, sunoTaskId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const idx = _mockJobs.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      _mockJobs[idx].sunoTaskId = sunoTaskId as any;
      _mockJobs[idx].updatedAt = new Date();
    }
    return;
  }
  
  return withRetry(async () => {
    await db.update(jobs).set({ sunoTaskId, updatedAt: new Date() }).where(eq(jobs.id, jobId));
  });
}

export async function updateSongAudioUrl(jobId: string, audioUrl: string, title?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    const idx = _mockSongs.findIndex((s) => s.jobId === jobId);
    if (idx >= 0) {
      _mockSongs[idx].audioUrl = audioUrl as any;
      if (title) _mockSongs[idx].title = title as any;
    }
    return;
  }
  
  return withRetry(async () => {
    const updateData: Record<string, unknown> = { audioUrl };
    if (title) updateData.title = title;
    await db.update(songs).set(updateData).where(eq(songs.jobId, jobId));
  });
}

export async function createSong(data: InsertSong): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) {
    // Ensure createdAt is set for mock storage
    const songData = {
      ...data,
      createdAt: data.createdAt || new Date(),
    } as InsertSong;
    _mockSongs.push(songData);
    return songData as Song;
  }
  
  return withRetry(async () => {
    await db.insert(songs).values(data);
    return data as Song;
  });
}

export async function getSongByJobId(jobId: string): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) {
    const found = _mockSongs.find((s) => s.jobId === jobId);
    return found as Song | undefined;
  }
  const result = await db.select().from(songs).where(eq(songs.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSongsByJobId(jobId: string): Promise<Song[]> {
  const db = await getDb();
  if (!db) {
    const found = _mockSongs.filter((s) => s.jobId === jobId);
    return found as Song[];
  }
  const result = await db.select().from(songs).where(eq(songs.jobId, jobId));
  return result;
}

export async function getSongBySlug(slug: string): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) {
    const found = _mockSongs.find((s) => s.shareSlug === slug);
    return found as Song | undefined;
  }
  const result = await db.select().from(songs).where(eq(songs.shareSlug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLead(data: InsertLead): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) {
    _mockLeads.push(data);
    return data as Lead;
  }
  
  return withRetry(async () => {
    await db.insert(leads).values(data);
    return data as Lead;
  });
}

export async function getLeadByJobId(jobId: string): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) {
    const found = _mockLeads.find((l) => l.jobId === jobId);
    return found as Lead | undefined;
  }
  const result = await db.select().from(leads).where(eq(leads.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Email sending removed - using Fluxuz for WhatsApp instead

/**
 * Verify database connection on startup
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    // Simple query to test connection
    await db.execute(sql`SELECT 1`);
    console.log("[Database] Connection verified successfully");
    return true;
  } catch (error) {
    console.error("[Database] Connection check failed:", error);
    return false;
  }
}

export async function incrementDownloadCount(shareSlug: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  return withRetry(async () => {
    const song = await db.select().from(songs).where(eq(songs.shareSlug, shareSlug)).limit(1);
    if (song.length > 0) {
      const currentCount = song[0].downloadCount || 0;
      await db
        .update(songs)
        .set({ downloadCount: currentCount + 1 })
        .where(eq(songs.shareSlug, shareSlug));
    }
  });
}
