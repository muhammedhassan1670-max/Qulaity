/**
 * UDIP Deep Intelligence Evolution vNext
 * ConditionalAnalysis - Partial Correlation & Stratified Association
 * Tests whether association between X and Y remains after conditioning on moderator Z.
 * Strict Observational Invariant: "Association after conditioning, causal inference not established."
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.ConditionalAnalysis = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class ConditionalAnalysis {
        static computePartialCorrelation(rXY, rXZ, rYZ) {
            const denom = Math.sqrt((1 - rXZ * rXZ) * (1 - rYZ * rYZ));
            if (denom <= 0.001) return 0;
            const rXY_Z = (rXY - rXZ * rYZ) / denom;
            return +Math.max(-1, Math.min(1, rXY_Z)).toFixed(4);
        }

        static analyze(dataset, colX, colY, colZ) {
            if (!dataset || !dataset.rows || dataset.rows.length < 15) {
                return null;
            }

            const x = [], y = [], z = [];
            dataset.rows.forEach(r => {
                const vx = +r[colX], vy = +r[colY], vz = +r[colZ];
                if (!isNaN(vx) && !isNaN(vy) && !isNaN(vz)) {
                    x.push(vx); y.push(vy); z.push(vz);
                }
            });

            if (x.length < 15) return null;

            const rXY = this._corr(x, y);
            const rXZ = this._corr(x, z);
            const rYZ = this._corr(y, z);

            const rPartial = this.computePartialCorrelation(rXY, rXZ, rYZ);
            const deltaR = +(Math.abs(rXY) - Math.abs(rPartial)).toFixed(4);

            // If correlation drops substantially after controlling for Z, Z is likely a confounder or mediator
            const isAttenuated = Math.abs(rXY) >= 0.40 && Math.abs(rPartial) <= 0.15;

            return {
                colX: colX,
                colY: colY,
                conditioningVar: colZ,
                marginalCorrelation: +rXY.toFixed(4),
                partialCorrelation: rPartial,
                attenuation: deltaR,
                isAttenuated: isAttenuated,
                status: 'OBSERVED',
                invariant: ((typeof window !== 'undefined' && window.UDIP && window.UDIP.CausalReasoner && window.UDIP.CausalReasoner.INVARIANT) ||
                    (typeof globalThis !== 'undefined' && globalThis.UDIP && globalThis.UDIP.CausalReasoner && globalThis.UDIP.CausalReasoner.INVARIANT) ||
                    'Association detected, causal inference not established. Unobserved confounding and selection bias cannot be ruled out without experimental intervention.'),
                caveat: 'Association after conditioning, causal inference not established.',
                interpretation: isAttenuated
                    ? `Association between ${colX} and ${colY} strongly attenuates from ${rXY.toFixed(2)} to ${rPartial.toFixed(2)} when conditioning on ${colZ}. Potential confounding or mediation.`
                    : `Association between ${colX} and ${colY} remains stable (${rPartial.toFixed(2)}) after conditioning on ${colZ}.`
            };
        }

        static _corr(a, b) {
            let sA = 0, sB = 0;
            const n = a.length;
            for (let i = 0; i < n; i++) { sA += a[i]; sB += b[i]; }
            const mA = sA / n, mB = sB / n;
            let num = 0, dA = 0, dB = 0;
            for (let i = 0; i < n; i++) {
                const da = a[i] - mA;
                const db = b[i] - mB;
                num += da * db;
                dA += da * da;
                dB += db * db;
            }
            return (dA * dB > 0) ? num / Math.sqrt(dA * dB) : 0;
        }
    }

    return ConditionalAnalysis;
}));
