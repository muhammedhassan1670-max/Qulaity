/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: engine/core.js
 * ============================================================================
 * Central Engine Coordinator.
 * Coordinates downstream intelligence modules (Analysis, ML, Prediction, Insights)
 * when an isolated dataset session is activated.
 * Completely domain-agnostic.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const EngineCore = {
        version: '2.0.0-universal',
        status: 'idle',

        /**
         * Initialize the engine and bind to session lifecycle
         */
        init() {
            if (!window.UDIP || !window.UDIP.DatasetSession) {
                console.error('[UDIP:Engine] DatasetSession module not found');
                return;
            }

            // Subscribe to dataset changes
            window.UDIP.DatasetSession.subscribe((event, data) => {
                if (event === 'loaded') {
                    this._onDatasetLoaded(data);
                } else if (event === 'cleared') {
                    this._onDatasetCleared();
                }
            });

            console.info(`[UDIP:Engine] EngineCore v${this.version} initialized. Status: ready (No data).`);
        },

        /**
         * Triggered when a new isolated dataset is loaded
         * @private
         */
        _onDatasetLoaded(dataset) {
            this.status = 'dataset_loaded';
            console.info(`[UDIP:Engine] Active dataset acknowledged: ${dataset.filename} (${dataset.rowCount} rows). Foundation ready for profiling in subsequent steps.`);
        },

        /**
         * Triggered when dataset is cleared
         * @private
         */
        _onDatasetCleared() {
            this.status = 'idle';
            console.info('[UDIP:Engine] Engine reset to idle. Memory clean.');
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.EngineCore = EngineCore;

})(window);
