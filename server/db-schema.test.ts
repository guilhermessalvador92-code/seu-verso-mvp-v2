import { describe, it, expect } from "vitest";
import { jobs } from "../drizzle/schema";

describe("Database Schema", () => {
  describe("jobs table schema", () => {
    it("should have lyricsTaskId column defined in Drizzle schema", () => {
      const jobsSchema = jobs;
      expect(jobsSchema).toBeDefined();
      
      // Check that the schema has the lyricsTaskId field by accessing it directly
      expect(jobsSchema.lyricsTaskId).toBeDefined();
      expect(jobsSchema.id).toBeDefined();
      expect(jobsSchema.status).toBeDefined();
      expect(jobsSchema.sunoTaskId).toBeDefined();
      expect(jobsSchema.createdAt).toBeDefined();
      expect(jobsSchema.updatedAt).toBeDefined();
    });
    
    it("should allow lyricsTaskId to be optional (nullable)", () => {
      // The lyricsTaskId field should be optional as per the schema
      // This is a compile-time check that gets validated by TypeScript
      type JobType = typeof jobs.$inferInsert;
      
      // This should compile fine - lyricsTaskId is optional
      const validJob: JobType = {
        id: "test-job-id",
        status: "QUEUED",
      };
      
      expect(validJob).toBeDefined();
      
      // This should also compile fine - lyricsTaskId is provided
      const jobWithLyricsTaskId: JobType = {
        id: "test-job-id-2",
        status: "QUEUED",
        lyricsTaskId: "lyrics-task-123",
      };
      
      expect(jobWithLyricsTaskId.lyricsTaskId).toBe("lyrics-task-123");
    });
  });
});
