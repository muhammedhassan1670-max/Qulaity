/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: copilot/actions/comparison-actions.js
 * ============================================================================
 * Comparison action coordinators:
 * - compareCurrentVsPrevious()
 * - compareCurrentVsBaseline()
 * - compareModelEvolution()
 * Consumes Step 6 VersionComparator and Step 5 Autonomous monitoring.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const ComparisonActions = {
        /**
         * Perform 10-dimensional cross-version comparison
         */
        compareCurrentVsPrevious({ currentDataset, previousDataset, profile, previousProfile } = {}) {
            const comparator = window.UDIP?.Workspace?.VersionComparator;

            if (!previousDataset) {
                return {
                    hasPrevious: false,
                    message: 'لا توجد نسخة سابقة مسجلة للمقارنة معها.'
                };
            }

            if (comparator?.compare) {
                const diff = comparator.compare({
                    currentDataset,
                    previousDataset,
                    currentProfile: profile,
                    previousProfile
                });
                return {
                    hasPrevious: true,
                    comparison: diff,
                    summary: diff.summary || 'تمت مقارنة النسختين بنجاح.'
                };
            }

            // Fallback lightweight delta comparison
            const rowDelta = (currentDataset?.rowCount || 0) - (previousDataset?.rowCount || 0);
            return {
                hasPrevious: true,
                comparison: {
                    rowDelta,
                    columnDelta: (currentDataset?.columnCount || 0) - (previousDataset?.columnCount || 0)
                },
                summary: `فرق الصفوف: ${rowDelta}`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Copilot = window.UDIP.Copilot || {};
    window.UDIP.Copilot.ComparisonActions = ComparisonActions;

})(typeof window !== 'undefined' ? window : global);
