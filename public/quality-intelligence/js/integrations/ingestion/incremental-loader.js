/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: integrations/ingestion/incremental-loader.js
 * ============================================================================
 * Incremental cursor and watermark state management.
 * Supports: FULL_REFRESH, WATERMARK, TIMESTAMP_CURSOR, ID_CURSOR, PAGE_CURSOR.
 * Computes extraction delta queries and maintains deterministic sync state.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const STRATEGIES = Object.freeze({
        FULL_REFRESH: 'FULL_REFRESH',
        WATERMARK: 'WATERMARK',
        TIMESTAMP_CURSOR: 'TIMESTAMP_CURSOR',
        ID_CURSOR: 'ID_CURSOR',
        PAGE_CURSOR: 'PAGE_CURSOR',
        CHANGE_TOKEN: 'CHANGE_TOKEN'
    });

    const IncrementalLoader = {
        STRATEGIES,

        /**
         * Initialize or normalize a cursor configuration
         * @param {Object} config
         * @returns {Object} cursorState
         */
        initCursor(config = {}) {
            const strategy = config.strategy || STRATEGIES.FULL_REFRESH;
            return {
                strategy,
                cursorField: config.cursorField || (strategy === STRATEGIES.ID_CURSOR ? 'id' : (strategy === STRATEGIES.WATERMARK ? 'updated_at' : null)),
                lastValue: config.lastValue !== undefined ? config.lastValue : null,
                lastSyncTime: config.lastSyncTime || null,
                recordsExtracted: 0,
                page: config.page || 1,
                pageSize: config.pageSize || 100,
                hasMore: true
            };
        },

        /**
         * Compute connector query / filter params from cursor state
         * @param {Object} cursorState
         * @param {Object} [baseQuery]
         * @returns {Object} queryOptions for connector
         */
        buildQuery(cursorState, baseQuery = {}) {
            const state = cursorState || this.initCursor();
            const query = { ...baseQuery };

            switch (state.strategy) {
                case STRATEGIES.FULL_REFRESH:
                    // No delta filtering
                    return query;

                case STRATEGIES.WATERMARK:
                case STRATEGIES.TIMESTAMP_CURSOR: {
                    if (state.lastValue && state.cursorField) {
                        query.filters = query.filters || {};
                        query.filters[state.cursorField] = { gt: state.lastValue };
                        query.where = query.where ? `${query.where} AND ${state.cursorField} > '${state.lastValue}'` : `${state.cursorField} > '${state.lastValue}'`;
                    }
                    return query;
                }

                case STRATEGIES.ID_CURSOR: {
                    if (state.lastValue !== null && state.lastValue !== undefined && state.cursorField) {
                        query.filters = query.filters || {};
                        query.filters[state.cursorField] = { gt: state.lastValue };
                        query.where = query.where ? `${query.where} AND ${state.cursorField} > ${state.lastValue}` : `${state.cursorField} > ${state.lastValue}`;
                    }
                    return query;
                }

                case STRATEGIES.PAGE_CURSOR: {
                    query.page = state.page || 1;
                    query.pageSize = state.pageSize || 100;
                    query.offset = ((state.page || 1) - 1) * (state.pageSize || 100);
                    query.limit = state.pageSize || 100;
                    return query;
                }

                case STRATEGIES.CHANGE_TOKEN: {
                    if (state.lastValue) {
                        query.changeToken = state.lastValue;
                    }
                    return query;
                }

                default:
                    return query;
            }
        },

        /**
         * Update cursor state after records are fetched
         * @param {Object} cursorState
         * @param {Array<Object>} fetchedRecords
         * @param {Object} [options]
         * @returns {Object} updated cursorState
         */
        updateCursor(cursorState, fetchedRecords = [], options = {}) {
            const nextState = { ...cursorState };
            const count = Array.isArray(fetchedRecords) ? fetchedRecords.length : 0;
            nextState.recordsExtracted += count;
            nextState.lastSyncTime = new Date().toISOString();

            if (nextState.strategy === STRATEGIES.FULL_REFRESH) {
                nextState.hasMore = false;
                return nextState;
            }

            if (nextState.strategy === STRATEGIES.PAGE_CURSOR) {
                const pageSize = nextState.pageSize || 100;
                nextState.page = (nextState.page || 1) + 1;
                nextState.hasMore = count >= pageSize;
                return nextState;
            }

            if (count === 0) {
                nextState.hasMore = false;
                return nextState;
            }

            const field = nextState.cursorField;
            if (!field) {
                nextState.hasMore = false;
                return nextState;
            }

            let maxVal = nextState.lastValue;

            for (const row of fetchedRecords) {
                if (row && row[field] !== undefined && row[field] !== null) {
                    const rowVal = row[field];
                    if (maxVal === null || maxVal === undefined) {
                        maxVal = rowVal;
                    } else if (nextState.strategy === STRATEGIES.ID_CURSOR) {
                        const numA = Number(rowVal);
                        const numB = Number(maxVal);
                        if (!isNaN(numA) && !isNaN(numB) && numA > numB) {
                            maxVal = rowVal;
                        }
                    } else if (nextState.strategy === STRATEGIES.WATERMARK || nextState.strategy === STRATEGIES.TIMESTAMP_CURSOR) {
                        const dateA = new Date(rowVal).getTime();
                        const dateB = new Date(maxVal).getTime();
                        if (!isNaN(dateA) && (isNaN(dateB) || dateA > dateB)) {
                            maxVal = rowVal;
                        }
                    }
                }
            }

            nextState.lastValue = maxVal;
            const pageSize = options.pageSize || nextState.pageSize || 100;
            nextState.hasMore = count >= pageSize;

            return nextState;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.Integrations = window.UDIP.Integrations || {};
        window.UDIP.Integrations.IncrementalLoader = IncrementalLoader;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IncrementalLoader;
    }

})(typeof window !== 'undefined' ? window : global);
