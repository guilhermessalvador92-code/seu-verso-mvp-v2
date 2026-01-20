import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, jobs, songs, leads, Job, Song, Lead, InsertJob, InsertSong, InsertLead } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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

  try {
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
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
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
  if (!db) return undefined;
  await db.insert(jobs).values(data);
  return data as Job;
}

export async function getJobById(jobId: string): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateJobStatus(jobId: string, status: Job["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));
}

export async function updateJobSunoTaskId(jobId: string, sunoTaskId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set({ sunoTaskId, updatedAt: new Date() }).where(eq(jobs.id, jobId));
}

export async function updateSongAudioUrl(jobId: string, audioUrl: string, title?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { audioUrl };
  if (title) updateData.title = title;
  await db.update(songs).set(updateData).where(eq(songs.jobId, jobId));
}

export async function createSong(data: InsertSong): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(songs).values(data);
  return data as Song;
}

export async function getSongByJobId(jobId: string): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(eq(songs.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSongBySlug(slug: string): Promise<Song | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(eq(songs.shareSlug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLead(data: InsertLead): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(leads).values(data);
  return data as Lead;
}

export async function getLeadByJobId(jobId: string): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.jobId, jobId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function markEmailSent(jobId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const song = await db.select().from(songs).where(eq(songs.jobId, jobId)).limit(1);
    if (song.length > 0) {
      await db
        .update(songs)
        .set({ emailSent: new Date() })
        .where(eq(songs.id, song[0].id));
    }
  } catch (error) {
    console.error("[Database] Error marking email as sent:", error);
  }
}

export async function incrementDownloadCount(shareSlug: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const song = await db.select().from(songs).where(eq(songs.shareSlug, shareSlug)).limit(1);
    if (song.length > 0) {
      const currentCount = song[0].downloadCount || 0;
      await db
        .update(songs)
        .set({ downloadCount: currentCount + 1 })
        .where(eq(songs.shareSlug, shareSlug));
    }
  } catch (error) {
    console.error("[Database] Error incrementing download count:", error);
  }
}
