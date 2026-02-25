import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as ops from './ops.js';
import * as jobs from './jobs.js';
import * as locked from './locked.js';
import * as store from './store.js';
import * as timer from './timer.js';
import { createCronServiceState, type CronServiceState, type CronServiceDeps } from './state.js';
import type { CronJobCreate, CronJob, CronStoreFile, CronJobPatch } from '../types.js';

// Mock dependencies
vi.mock('./jobs.js');
vi.mock('./locked.js');
vi.mock('./store.js');
vi.mock('./timer.js');

describe('src/cron/service/ops.ts', () => {
  let state: CronServiceState;
  let deps: CronServiceDeps;
  let mockJob: CronJob;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock deps
    deps = {
      log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      storePath: '/tmp/cron-store.json',
      cronEnabled: true,
      enqueueSystemEvent: vi.fn(),
      requestHeartbeatNow: vi.fn(),
      runIsolatedAgentJob: vi.fn().mockResolvedValue({ status: 'ok' }),
      nowMs: vi.fn(() => 1000), // Fixed time
    };

    state = createCronServiceState(deps);
    state.store = { jobs: [] } as unknown as CronStoreFile;

    // Mock locked to execute immediately
    vi.mocked(locked.locked).mockImplementation(async (s, callback) => {
      return await callback();
    });

    // Setup a mock job
    mockJob = {
      id: 'job-1',
      name: 'Test Job',
      enabled: true,
      schedule: { kind: 'every', intervalMs: 60000, anchorMs: 0 },
      state: { nextRunAtMs: 2000 },
      createdAtMs: 0,
      updatedAtMs: 0,
    } as CronJob;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('start', () => {
    it('should log disabled message if cron is disabled', async () => {
      state.deps.cronEnabled = false;
      await ops.start(state);
      expect(deps.log.info).toHaveBeenCalledWith({ enabled: false }, 'cron: disabled');
      expect(store.ensureLoaded).not.toHaveBeenCalled();
    });

    it('should start correctly when enabled', async () => {
      // Mock store with a job that has stale running state
      const staleJob = { ...mockJob, state: { ...mockJob.state, runningAtMs: 500 } };
      state.store = { jobs: [staleJob] } as unknown as CronStoreFile;

      await ops.start(state);

      expect(store.ensureLoaded).toHaveBeenCalledWith(state, { skipRecompute: true });
      expect(deps.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: staleJob.id }),
        'cron: clearing stale running marker on startup'
      );
      expect(staleJob.state.runningAtMs).toBeUndefined();
      expect(timer.runMissedJobs).toHaveBeenCalledWith(state);
      expect(jobs.recomputeNextRuns).toHaveBeenCalledWith(state);
      expect(store.persist).toHaveBeenCalledWith(state);
      expect(timer.armTimer).toHaveBeenCalledWith(state);
      expect(deps.log.info).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true }),
        'cron: started'
      );
    });
  });

  describe('stop', () => {
    it('should stop the timer', () => {
      ops.stop(state);
      expect(timer.stopTimer).toHaveBeenCalledWith(state);
    });
  });

  describe('add', () => {
    it('should add a job', async () => {
      const input: CronJobCreate = {
        name: 'New Job',
        schedule: { kind: 'every', intervalMs: 1000 },
        job: { kind: 'agent', agentId: 'agent-1', message: 'hello' },
      };

      vi.mocked(jobs.createJob).mockReturnValue(mockJob);
      vi.mocked(jobs.nextWakeAtMs).mockReturnValue(3000);

      const result = await ops.add(state, input);

      expect(store.warnIfDisabled).toHaveBeenCalledWith(state, 'add');
      expect(store.ensureLoaded).toHaveBeenCalledWith(state);
      expect(jobs.createJob).toHaveBeenCalledWith(state, input);
      expect(state.store?.jobs).toContain(mockJob);
      expect(jobs.recomputeNextRuns).toHaveBeenCalledWith(state);
      expect(store.persist).toHaveBeenCalledWith(state);
      expect(timer.armTimer).toHaveBeenCalledWith(state);
      expect(deps.log.info).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: mockJob.id }),
        'cron: job added'
      );
      expect(timer.emit).toHaveBeenCalledWith(state, {
        jobId: mockJob.id,
        action: 'added',
        nextRunAtMs: mockJob.state.nextRunAtMs,
      });
      expect(result).toBe(mockJob);
    });
  });

  describe('remove', () => {
    it('should remove a job', async () => {
      state.store = { jobs: [mockJob] } as unknown as CronStoreFile;

      const result = await ops.remove(state, mockJob.id);

      expect(store.warnIfDisabled).toHaveBeenCalledWith(state, 'remove');
      expect(store.ensureLoaded).toHaveBeenCalledWith(state);
      expect(state.store?.jobs).not.toContain(mockJob);
      expect(store.persist).toHaveBeenCalledWith(state);
      expect(timer.armTimer).toHaveBeenCalledWith(state);
      expect(timer.emit).toHaveBeenCalledWith(state, {
        jobId: mockJob.id,
        action: 'removed',
      });
      expect(result).toEqual({ ok: true, removed: true });
    });

    it('should return false if job not found', async () => {
        state.store = { jobs: [] } as unknown as CronStoreFile;

        const result = await ops.remove(state, 'non-existent');

        expect(result).toEqual({ ok: true, removed: false });
        expect(timer.emit).not.toHaveBeenCalled();
    });

     it('should handle store not loaded', async () => {
        state.store = null;
        const result = await ops.remove(state, 'job-1');
        expect(result).toEqual({ ok: false, removed: false });
    });
  });

  describe('update', () => {
    it('should update a job', async () => {
      state.store = { jobs: [mockJob] } as unknown as CronStoreFile;
      const patch: CronJobPatch = { enabled: false };

      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);

      const result = await ops.update(state, mockJob.id, patch);

      expect(store.warnIfDisabled).toHaveBeenCalledWith(state, 'update');
      expect(store.ensureLoaded).toHaveBeenCalledWith(state);
      expect(jobs.findJobOrThrow).toHaveBeenCalledWith(state, mockJob.id);
      expect(jobs.applyJobPatch).toHaveBeenCalledWith(mockJob, patch);

      // Verify recomputation logic
      expect(mockJob.updatedAtMs).toBe(1000);
      expect(mockJob.state.nextRunAtMs).toBeUndefined(); // Because enabled=false

      expect(store.persist).toHaveBeenCalledWith(state);
      expect(timer.armTimer).toHaveBeenCalledWith(state);
      expect(timer.emit).toHaveBeenCalledWith(state, {
        jobId: mockJob.id,
        action: 'updated',
        nextRunAtMs: undefined,
      });
      expect(result).toBe(mockJob);
    });

    it('should recompute next run if schedule changes', async () => {
      state.store = { jobs: [mockJob] } as unknown as CronStoreFile;
      const patch: CronJobPatch = { schedule: { kind: 'every', intervalMs: 120000 } };

      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);
      vi.mocked(jobs.computeJobNextRunAtMs).mockReturnValue(5000);

      await ops.update(state, mockJob.id, patch);

      expect(jobs.computeJobNextRunAtMs).toHaveBeenCalledWith(mockJob, 1000);
      expect(mockJob.state.nextRunAtMs).toBe(5000);
    });

    it('should set default anchor if schedule changes to every and anchor is missing', async () => {
      state.store = { jobs: [mockJob] } as unknown as CronStoreFile;
      const patch: CronJobPatch = { schedule: { kind: 'every', intervalMs: 120000 } }; // No anchorMs

      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);

      // We must simulate applyJobPatch removing anchorMs or setting the new schedule without it
      vi.mocked(jobs.applyJobPatch).mockImplementation((job, p) => {
        if (p.schedule) {
          // force cast to any to allow missing anchorMs
          job.schedule = p.schedule as any;
        }
      });

      await ops.update(state, mockJob.id, patch);

      // ops.ts: if (typeof anchor !== "number" || !Number.isFinite(anchor)) { ... }
      // fallbackAnchorMs = patchSchedule?.kind === "every" ? now : ...

      expect(mockJob.schedule).toHaveProperty('anchorMs', 1000);
    });
  });

  describe('run', () => {
    it('should return already-running if job is running', async () => {
      mockJob.state.runningAtMs = 500;
      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);

      const result = await ops.run(state, mockJob.id);

      expect(store.warnIfDisabled).toHaveBeenCalledWith(state, 'run');
      expect(store.ensureLoaded).toHaveBeenCalledWith(state, { skipRecompute: true });
      expect(result).toEqual({ ok: true, ran: false, reason: 'already-running' });
      expect(timer.executeJob).not.toHaveBeenCalled();
    });

    it('should return not-due if job is not due', async () => {
      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);
      vi.mocked(jobs.isJobDue).mockReturnValue(false);

      const result = await ops.run(state, mockJob.id);

      expect(jobs.isJobDue).toHaveBeenCalledWith(mockJob, 1000, { forced: false });
      expect(result).toEqual({ ok: true, ran: false, reason: 'not-due' });
      expect(timer.executeJob).not.toHaveBeenCalled();
    });

    it('should run job if due', async () => {
      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);
      vi.mocked(jobs.isJobDue).mockReturnValue(true);

      const result = await ops.run(state, mockJob.id);

      expect(timer.executeJob).toHaveBeenCalledWith(state, mockJob, 1000, { forced: false });
      expect(jobs.recomputeNextRuns).toHaveBeenCalledWith(state);
      expect(store.persist).toHaveBeenCalledWith(state);
      expect(timer.armTimer).toHaveBeenCalledWith(state);
      expect(result).toEqual({ ok: true, ran: true });
    });

    it('should run job if forced', async () => {
      vi.mocked(jobs.findJobOrThrow).mockReturnValue(mockJob);
      // isJobDue might return false, but logic says executeJob handles forced too?
      // Wait, ops.ts checks isJobDue:
      // const due = isJobDue(job, now, { forced: mode === "force" });
      // if (!due) ...
      vi.mocked(jobs.isJobDue).mockReturnValue(true);

      const result = await ops.run(state, mockJob.id, 'force');

      expect(jobs.isJobDue).toHaveBeenCalledWith(mockJob, 1000, { forced: true });
      expect(timer.executeJob).toHaveBeenCalledWith(state, mockJob, 1000, { forced: true });
      expect(result).toEqual({ ok: true, ran: true });
    });
  });
});
// Acknowledged PR closure
