/**
 * UDIP Deep Intelligence Evolution vNext
 * ModelInterpretation - Permutation Importance & Partial Dependence (PDP)
 * Distinguishes Predictive Importance from Causal Importance.
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ModelInterpretation = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ModelInterpretation {
        static computePermutationImportance(model, dataset, features, targetCol, metricFn) {
            if (!model || !dataset || !dataset.rows || dataset.rows.length === 0 || !features) {
                return [];
            }

            const baseScore = metricFn(model, dataset.rows, features, targetCol);
            const importances = [];

            features.forEach(feat => {
                // Shuffle feature column values
                const shuffledRows = dataset.rows.map(r => ({ ...r }));
                for (let i = shuffledRows.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const temp = shuffledRows[i][feat];
                    shuffledRows[i][feat] = shuffledRows[j][feat];
                    shuffledRows[j][feat] = temp;
                }

                const dropScore = metricFn(model, shuffledRows, features, targetCol);
                const rawDrop = Math.max(0, baseScore - dropScore);

                importances.push({
                    feature: feat,
                    importanceWeight: +rawDrop.toFixed(4),
                    type: 'PREDICTIVE_IMPORTANCE',
                    invariant: 'Predictive importance reflects statistical association, not causal intervention impact.'
                });
            });

            // Normalize weights
            const total = importances.reduce((a, b) => a + b.importanceWeight, 0) || 1;
            importances.forEach(item => {
                item.relativePercentage = +((item.importanceWeight / total) * 100).toFixed(1);
            });

            return importances.sort((a, b) => b.importanceWeight - a.importanceWeight);
        }

        static computePartialDependence(model, dataset, feature, gridPoints = 5) {
            if (!model || !dataset || !dataset.rows || dataset.rows.length === 0) {
                return [];
            }

            const vals = dataset.rows.map(r => +r[feature]).filter(v => !isNaN(v)).sort((a, b) => a - b);
            if (vals.length === 0) return [];

            const min = vals[0];
            const max = vals[vals.length - 1];
            const step = (max - min) / Math.max(1, gridPoints - 1);

            const pdp = [];
            for (let i = 0; i < gridPoints; i++) {
                const gridVal = min + i * step;
                // Marginal expectation replacing feature with gridVal
                let sumPred = 0;
                const sampleRows = dataset.rows.slice(0, 50);
                sampleRows.forEach(r => {
                    const cloned = { ...r, [feature]: gridVal };
                    if (typeof model.predictSample === 'function') {
                        sumPred += (model.predictSample(cloned) || 0);
                    } else {
                        sumPred += gridVal; // fallback
                    }
                });
                const avgPred = sumPred / sampleRows.length;
                pdp.push({ gridValue: +gridVal.toFixed(2), expectedPrediction: +avgPred.toFixed(2) });
            }

            return pdp;
        }
    }

    return ModelInterpretation;
}));
