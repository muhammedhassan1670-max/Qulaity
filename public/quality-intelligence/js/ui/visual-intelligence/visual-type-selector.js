/**
 * ============================================================================
 * UDIP VISUAL INTELLIGENCE SYSTEM
 * Module: js/ui/visual-intelligence/visual-type-selector.js
 * ============================================================================
 * Intelligent visual mapping engine that inspects analytical objects and
 * automatically selects the optimal visual representation.
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.VisualTypeSelector = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class VisualTypeSelector {
        /**
         * Inspects an analytical object and returns the best visual representation type.
         * @param {Object} item - Analytical finding, hypothesis, decision, or metric.
         * @returns {string} - Visual type identifier
         */
        static selectVisualType(item) {
            if (!item || typeof item !== 'object') return 'relationship';

            // 1. Explicit visual type
            if (item.visualType) return String(item.visualType).toLowerCase();
            if (item.type) {
                const t = String(item.type).toLowerCase();
                if (this.VALID_TYPES.includes(t)) return t;
            }

            // 2. Category inspection
            const cat = String(item.category || item.tag || '').toUpperCase();
            if (cat.includes('ANOMALY') || cat.includes('OUTLIER')) return 'anomaly';
            if (cat.includes('RISK')) return 'risk';
            if (cat.includes('DECISION')) return 'decision';
            if (cat.includes('ACTION') || cat.includes('RECOMMENDATION')) return 'action';
            if (cat.includes('ROOT_CAUSE') || cat.includes('CAUSE') || cat.includes('DRIVER')) return 'rootcause';
            if (cat.includes('HYPOTHESIS')) return 'hypothesis';
            if (cat.includes('EVIDENCE') || cat.includes('FALSIFICATION')) return 'evidence';
            if (cat.includes('TREND') || cat.includes('TEMPORAL') || cat.includes('FORECAST')) return 'trend';
            if (cat.includes('DISTRIBUTION') || cat.includes('SPREAD') || cat.includes('VARIATION')) return 'distribution';
            if (cat.includes('CORRELATION') || cat.includes('HEATMAP')) return 'correlation';
            if (cat.includes('PARETO') || cat.includes('RANKING')) return 'pareto';
            if (cat.includes('COMPARISON') || cat.includes('DIFFERENCE')) return 'comparison';
            if (cat.includes('QUALITY') || cat.includes('INTEGRITY')) return 'quality';
            if (cat.includes('SPC') || cat.includes('CONTROL')) return 'spc';
            if (cat.includes('ML') || cat.includes('MODEL') || cat.includes('METRIC')) return 'mlperformance';

            // 3. Property structural signatures
            if (item.ucl != null || item.lcl != null || item.controlLimits) return 'spc';
            if (item.confusionMatrix || item.rocCurve || item.actualVsPredicted) return 'mlperformance';
            if (item.dimensions && (item.completeness != null || item.validity != null)) return 'quality';
            if (item.supportingEvidence || item.counterEvidence || item.falsificationStatus) return 'hypothesis';
            if (item.evidenceFlow || item.evidenceNodes || item.evidenceIds) return 'evidence';
            if (item.probability != null && (item.impact != null || item.severity != null)) return 'risk';
            if (item.candidateDrivers || item.hierarchy || item.failureMode) return 'rootcause';
            if (item.recommendedAction || item.options || item.decisionPath) return 'decision';
            if (item.action || item.actionLabel || (item.priority && item.expectedImpact)) return 'action';
            if (item.anomalyCount != null || item.anomalyRate != null || item.outliers) return 'anomaly';
            if (item.cumulativePercent || item.paretoBars) return 'pareto';
            if (item.matrix || item.correlationValues) return 'correlation';
            if (item.features && Array.isArray(item.features)) return 'featureimportance';
            if (item.iqr != null || item.median != null || item.quartiles || item.skewness != null) return 'distribution';
            if (item.delta != null || item.timeSeries || item.temporal || item.trendSlope != null) return 'trend';
            if ((item.before != null && item.after != null) || (item.beforeValue != null && item.afterValue != null)) return 'comparison';
            if (item.variableA || item.colA || item.r != null || item.pearson != null || item.spearman != null) return 'relationship';

            // 4. Content semantic heuristic
            const text = `${item.title || ''} ${item.statement || ''} ${item.insight || ''} ${item.description || ''} ${item.evidence || ''}`.toLowerCase();
            if (text.includes('anomal') || text.includes('outlier') || text.includes('deviat')) return 'anomaly';
            if (text.includes('risk') || text.includes('vulnerab')) return 'risk';
            if (text.includes('root cause') || text.includes('contribut') || text.includes('driver')) return 'rootcause';
            if (text.includes('hypothes') || text.includes('conjectur')) return 'hypothesis';
            if (text.includes('decision') || text.includes('priorit')) return 'decision';
            if (text.includes('recommend') || text.includes('action')) return 'action';
            if (text.includes('increas') || text.includes('decreas') || text.includes('trend') || text.includes('quarter') || text.includes('month')) return 'trend';
            if (text.includes('distribut') || text.includes('spread') || text.includes('median')) return 'distribution';
            if (text.includes('associat') || text.includes('correlat') || text.includes('versus') || text.includes('vs')) return 'relationship';

            // Default fallback
            return 'relationship';
        }

        static get VALID_TYPES() {
            return [
                'relationship',
                'trend',
                'comparison',
                'distribution',
                'anomaly',
                'correlation',
                'featureimportance',
                'pareto',
                'risk',
                'rootcause',
                'decision',
                'action',
                'hypothesis',
                'evidence',
                'quality',
                'spc',
                'mlperformance'
            ];
        }
    }

    return VisualTypeSelector;
}));
