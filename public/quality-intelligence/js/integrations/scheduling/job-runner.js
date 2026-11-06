/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/scheduling/job-runner.js
 * ============================================================================
 * Execution loop for active browser sessions.
 * Inspects due schedules, triggers synchronization via SyncEngine,
 * and updates schedule run states.
 * ============================================================================
 */

(function (window) {
    'use strict';

    class JobRunner {
        constructor() {
            this._timer = null;
            this._isRunning = false;
            this._activeJobs = new Set();
        }

        /**
         * Start the background scheduling loop
         * @param {number} [intervalMs=30000] - Polling interval in ms
         */
        start(intervalMs = 30000) {
            if (this._isRunning) return;
            this._isRunning = true;

            this._timer = setInterval(() => {
                this.runPendingSchedules().catch(err => {
                    console.warn('[JobRunner] Error during scheduled sync tick:', err);
                });
            }, intervalMs);
        }

        /**
         * Stop the background scheduling loop
         */
        stop() {
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
            this._isRunning = false;
        }

        /**
         * Inspect and run any schedules whose nextRunAt timestamp has passed
         * @returns {Promise<Array<Object>>} Executed job summaries
         */
        async runPendingSchedules() {
            const schMgr = window.UDIP?.Integrations?.ScheduleManager;
            if (!schMgr) return [];

            const now = Date.now();
            const schedules = schMgr.listSchedules({ enabled: true });
            const dueSchedules = schedules.filter(s => s.nextRunAt && new Date(s.nextRunAt).getTime() <= now);

            const results = [];
            for (const schedule of dueSchedules) {
                if (this._activeJobs.has(schedule.id)) continue;
                this._activeJobs.add(schedule.id);

                try {
                    const res = await this.triggerScheduleNow(schedule.id);
                    results.push(res);
                } catch (err) {
                    results.push({ scheduleId: schedule.id, success: false, error: err.message });
                } finally {
                    this._activeJobs.delete(schedule.id);
                }
            }

            return results;
        }

        /**
         * Force execution of a schedule immediately
         * @param {string} scheduleId
         * @returns {Promise<Object>}
         */
        async triggerScheduleNow(scheduleId) {
            const schMgr = window.UDIP?.Integrations?.ScheduleManager;
            const syncEngine = window.UDIP?.Integrations?.SyncEngine;

            if (!schMgr) throw new Error('ScheduleManager unavailable');
            const schedule = schMgr.getSchedule(scheduleId);
            if (!schedule) throw new Error(`Schedule "${scheduleId}" not found`);

            const startTime = Date.now();
            let syncResult = null;
            let status = 'SUCCESS';
            let errorMsg = null;

            try {
                if (syncEngine && typeof syncEngine.syncSource === 'function') {
                    syncResult = await syncEngine.syncSource(schedule.sourceId, {
                        actorId: 'scheduler',
                        trigger: 'SCHEDULED_JOB'
                    });
                }
            } catch (err) {
                status = 'FAILED';
                errorMsg = err.message;
            }

            // Update schedule timestamps
            schMgr.updateSchedule(scheduleId, {
                lastRunAt: new Date().toISOString(),
                lastRunStatus: status,
                nextRunAt: schMgr.computeNextRun(schedule)
            });

            return {
                scheduleId,
                sourceId: schedule.sourceId,
                status,
                durationMs: Date.now() - startTime,
                error: errorMsg,
                syncResult
            };
        }
    }

    const instance = new JobRunner();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.JobRunner = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = instance;
    }

})(typeof window !== 'undefined' ? window : global);
