import { describe, it, expect } from "vitest";
import { jobs } from "../drizzle/schema";

describe("Database Schema", () => {
  describe("jobs table schema", () => {
    it("should have lyricsTaskId column defined in Drizzle schema", () => {
      const jobsSchema = jobs;
      expect(jobsSchema).toBeDefined();
      
      // Check that the schema has the lyricsTaskId field
      const columns = Object.keys(jobsSchema);
      expect(columns).toContain("id");
      expect(columns).toContain("status");
      expect(columns).toContain("sunoTaskId");
      expect(columns).toContain("lyricsTaskId");
      expect(columns).toContain("createdAt");
      expect(columns).toContain("updatedAt");
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
