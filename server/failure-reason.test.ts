import { describe, it, expect, beforeEach } from "vitest";
import { createJob, updateJobStatus, getJobById } from "./db";
import { Job } from "../drizzle/schema";
import { nanoid } from "nanoid";

describe("failureReason functionality", () => {
  beforeEach(() => {
    // Tests will use in-memory mock storage since DATABASE_URL is not configured
  });

  it("should store failureReason when job fails", async () => {
    const jobId = nanoid();
    
    // Create a job
    await createJob({
      id: jobId,
      status: "QUEUED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Update job to FAILED with a failure reason
    const failureReason = "Test failure reason: Suno API timeout";
    await updateJobStatus(jobId, "FAILED", failureReason);
    
    // Retrieve the job and verify failureReason is stored
    const job = await getJobById(jobId);
    expect(job).toBeDefined();
    expect(job?.status).toBe("FAILED");
    expect(job?.failureReason).toBe(failureReason);
  });

  it("should allow failureReason to be undefined for successful jobs", async () => {
    const jobId = nanoid();
    
    // Create a job
    await createJob({
      id: jobId,
      status: "QUEUED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Update job to DONE without a failure reason
    await updateJobStatus(jobId, "DONE");
    
    // Retrieve the job and verify it has no failureReason
    const job = await getJobById(jobId);
    expect(job).toBeDefined();
    expect(job?.status).toBe("DONE");
    expect(job?.failureReason).toBeUndefined();
  });

  it("should update failureReason when job status changes from PROCESSING to FAILED", async () => {
    const jobId = nanoid();
    
    // Create a job
    await createJob({
      id: jobId,
      status: "QUEUED",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Update to PROCESSING
    await updateJobStatus(jobId, "PROCESSING");
    
    let job = await getJobById(jobId);
    expect(job?.status).toBe("PROCESSING");
    
    // Update to FAILED with reason
    const failureReason = "Max polling retries exceeded";
    await updateJobStatus(jobId, "FAILED", failureReason);
    
    job = await getJobById(jobId);
    expect(job?.status).toBe("FAILED");
    expect(job?.failureReason).toBe(failureReason);
  });

  it("should handle different types of failure reasons", async () => {
    const testCases = [
      { jobId: nanoid(), reason: "Suno API failed to create music generation task" },
      { jobId: nanoid(), reason: "Polling timeout: Maximum retries (360) exceeded after 3600 seconds" },
      { jobId: nanoid(), reason: "No songs could be created from the music data" },
      { jobId: nanoid(), reason: "Error callback from Suno: Unknown error" },
    ];
    
    for (const testCase of testCases) {
      await createJob({
        id: testCase.jobId,
        status: "QUEUED",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await updateJobStatus(testCase.jobId, "FAILED", testCase.reason);
      
      const job = await getJobById(testCase.jobId);
      expect(job?.status).toBe("FAILED");
      expect(job?.failureReason).toBe(testCase.reason);
    }
  });
});
