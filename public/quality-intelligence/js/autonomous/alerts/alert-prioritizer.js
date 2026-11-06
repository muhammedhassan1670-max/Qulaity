/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: autonomous/alerts/alert-prioritizer.js
 * ============================================================================
 * Prevents alert flooding through intelligent aggregation and deduplication.
 * 
 * Aggregates homogeneous micro-alerts into composite group alerts
 * (e.g. 15 individual feature drift alerts collapsed into 1 composite alert
 * with column drill-down capability).
 * ============================================================================
 */

(function (window) {
    'use strict';

    const AlertPrioritizer = {
        /**
         * Group and prioritize raw alerts to eliminate notification fatigue
         * 
         * @param {Array<Object>} rawAlerts
         * @returns {Array<Object>} Grouped & Prioritized Alerts
         */
        groupAndPrioritize(rawAlerts = []) {
            if (!Array.isArray(rawAlerts) || rawAlerts.length === 0) {
                return [];
            }

            const groupedMap = new Map();
            const standaloneAlerts = [];

            // Grouping rule: Group DISTRIBUTION_DRIFT alerts by type
            rawAlerts.forEach(alt => {
                if (alt.type === 'DISTRIBUTION_DRIFT') {
                    if (!groupedMap.has('DISTRIBUTION_DRIFT')) {
                        groupedMap.set('DISTRIBUTION_DRIFT', []);
                    }
                    groupedMap.get('DISTRIBUTION_DRIFT').push(alt);
                } else {
                    standaloneAlerts.push(alt);
                }
            });

            const prioritized = [...standaloneAlerts];

            // Handle grouped distribution drift alerts
            if (groupedMap.has('DISTRIBUTION_DRIFT')) {
                const driftAlerts = groupedMap.get('DISTRIBUTION_DRIFT');
                if (driftAlerts.length >= 2) {
                    const allCols = driftAlerts.flatMap(a => a.affectedItems || []);
                    const highestSev = driftAlerts.some(a => a.severity === 'critical') ? 'critical' : (driftAlerts.some(a => a.severity === 'high') ? 'high' : 'medium');
                    
                    prioritized.push({
                        id: `GRP-DRIFT-${driftAlerts.length}`,
                        type: 'COMPOSITE_DISTRIBUTION_DRIFT',
                        isGrouped: true,
                        groupedCount: driftAlerts.length,
                        title: `Distribution Shift Across ${driftAlerts.length} Features`,
                        severity: highestSev,
                        priority: highestSev === 'critical' ? 'critical' : 'high',
                        message: `Significant distribution divergence detected across ${driftAlerts.length} features simultaneously.`,
                        evidence: `Affected features: ${allCols.slice(0, 5).join(', ')}${allCols.length > 5 ? ` and ${allCols.length - 5} more` : ''}.`,
                        affectedItems: allCols,
                        subAlerts: driftAlerts,
                        recommendedAction: 'Review composite distribution shift in Continuous Intelligence dashboard; verify upstream data generation process.',
                        confidence: 90
                    });
                } else if (driftAlerts.length === 1) {
                    prioritized.push(driftAlerts[0]);
                }
            }

            // Severity ranking order
            const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
            prioritized.sort((a, b) => (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0));

            return prioritized;
        }
    };

    if (typeof window !== 'undefined') {
        window.UDIP = window.UDIP || {};
        window.UDIP.AlertPrioritizer = AlertPrioritizer;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AlertPrioritizer;
    }
})(typeof window !== 'undefined' ? window : global);
