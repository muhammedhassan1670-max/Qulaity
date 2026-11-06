/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/scheduling/schedule-manager.js
 * ============================================================================
 * Synchronization Schedule Planner.
 * Execution Mode: strictly labeled 'LOCAL_BROWSER_SCHEDULE'.
 * Explicitly acknowledges browser runtime boundaries (requires active tab).
 * Prepares clean abstraction for Step 12 SERVER_BACKGROUND_JOB.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const SCHEDULE_TYPES = Object.freeze({
        MANUAL: 'MANUAL',
        INTERVAL: 'INTERVAL',
        DAILY: 'DAILY',
        CRON_LIKE: 'CRON_LIKE'
    });

    const EXECUTION_MODE = Object.freeze({
        LOCAL_BROWSER_SCHEDULE: 'LOCAL_BROWSER_SCHEDULE',
        SERVER_BACKGROUND_JOB: 'SERVER_BACKGROUND_JOB' // Future capability hook
    });

    class ScheduleManager {
        constructor() {
            this._schedules = new Map();
        }

        /**
         * Create a synchronization schedule
         * @param {Object} params
         * @returns {Object} schedule
         */
        createSchedule(params = {}) {
            if (!params.sourceId) throw new Error('sourceId is required for schedule');

            const id = `sch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const type = params.type || SCHEDULE_TYPES.MANUAL;
            const intervalMinutes = params.intervalMinutes || 60;

            const schedule = {
                id,
                sourceId: params.sourceId,
                connectionId: params.connectionId || null,
                type,
                intervalMinutes,
                timeOfDay: params.timeOfDay || '00:00', // for DAILY
                cronExpression: params.cronExpression || null,
                enabled: params.enabled !== false,
                executionMode: EXECUTION_MODE.LOCAL_BROWSER_SCHEDULE,
                limitations: 'Executes only while the browser session and tab remain open. Does not execute while browser is closed.',
                lastRunAt: null,
                nextRunAt: this.computeNextRun({ type, intervalMinutes, timeOfDay: params.timeOfDay }),
                lastRunStatus: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this._schedules.set(id, schedule);
            return { ...schedule };
        }

        /**
         * Update an existing schedule
         * @param {string} id
         * @param {Object} updates
         * @returns {Object}
         */
        updateSchedule(id, updates = {}) {
            const schedule = this._schedules.get(id);
            if (!schedule) throw new Error(`Schedule ${id} not found`);

            Object.assign(schedule, updates, { updatedAt: new Date().toISOString() });
            if (updates.type || updates.intervalMinutes || updates.timeOfDay) {
                schedule.nextRunAt = this.computeNextRun(schedule);
            }

            return { ...schedule };
        }

        /**
         * Delete schedule
         * @param {string} id
         * @returns {boolean}
         */
        deleteSchedule(id) {
            return this._schedules.delete(id);
        }

        /**
         * Get schedule by ID
         * @param {string} id
         * @returns {Object|null}
         */
        getSchedule(id) {
            const sch = this._schedules.get(id);
            return sch ? { ...sch } : null;
        }

        /**
         * List schedules
         * @param {Object} [filter]
         * @returns {Array<Object>}
         */
        listSchedules(filter = {}) {
            let list = Array.from(this._schedules.values());
            if (filter.sourceId) {
                list = list.filter(s => s.sourceId === filter.sourceId);
            }
            if (filter.enabled !== undefined) {
                list = list.filter(s => s.enabled === filter.enabled);
            }
            return list.map(s => ({ ...s }));
        }

        /**
         * Calculate next run timestamp
         * @param {Object} schedule
         * @returns {string|null} ISO timestamp
         */
        computeNextRun(schedule) {
            if (!schedule || schedule.type === SCHEDULE_TYPES.MANUAL) {
                return null;
            }

            const now = new Date();

            if (schedule.type === SCHEDULE_TYPES.INTERVAL) {
                const intervalMs = (schedule.intervalMinutes || 60) * 60 * 1000;
                return new Date(now.getTime() + intervalMs).toISOString();
            }

            if (schedule.type === SCHEDULE_TYPES.DAILY) {
                const [hours, minutes] = (schedule.timeOfDay || '00:00').split(':').map(Number);
                const next = new Date(now);
                next.setHours(hours || 0, minutes || 0, 0, 0);
                if (next.getTime() <= now.getTime()) {
                    next.setDate(next.getDate() + 1);
                }
                return next.toISOString();
            }

            // Default fallback
            return new Date(now.getTime() + 3600000).toISOString();
        }

        /**
         * Reset schedule state (for testing)
         */
        reset() {
            this._schedules.clear();
        }
    }

    const instance = new ScheduleManager();

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.SCHEDULE_TYPES = SCHEDULE_TYPES;
        window.UDIP.Integrations.EXECUTION_MODE = EXECUTION_MODE;
        window.UDIP.Integrations.ScheduleManager = instance;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            SCHEDULE_TYPES,
            EXECUTION_MODE,
            ScheduleManager,
            instance
        };
    }

})(typeof window !== 'undefined' ? window : global);
