/**
 * UDIP Deep Intelligence Evolution vNext
 * EntityDiscoverer - Semantic Entity & Repetition Ratio Discovery
 * Recognizes business and domain entities (Customer, Order, Device, Sensor, Transaction, Patient, etc.).
 * Zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.EntityDiscoverer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class EntityDiscoverer {
        static discover(dataset, profile) {
            if (!dataset || !dataset.columns) return [];

            const entities = [];
            const rowCount = dataset.rowCount || (dataset.rows ? dataset.rows.length : 0);
            const colProfiles = {};
            if (profile && profile.columns) {
                if (Array.isArray(profile.columns)) {
                    profile.columns.forEach(c => { if (c && c.name) colProfiles[c.name] = c; });
                } else if (typeof profile.columns === 'object') {
                    Object.assign(colProfiles, profile.columns);
                }
            }

            const ARCHETYPES = [
                { type: 'Customer / User', patterns: ['customer', 'user', 'client', 'member', 'buyer'], icon: 'fa-user' },
                { type: 'Device / IoT Unit', patterns: ['device', 'sensor', 'machine', 'unit', 'station', 'node'], icon: 'fa-microchip' },
                { type: 'Order / Transaction', patterns: ['order', 'transaction', 'invoice', 'receipt', 'sale'], icon: 'fa-receipt' },
                { type: 'Product / Item', patterns: ['product', 'item', 'sku', 'part', 'inventory'], icon: 'fa-box' },
                { type: 'Account / Financial Entity', patterns: ['account', 'wallet', 'ledger', 'card'], icon: 'fa-wallet' },
                { type: 'Patient / Clinical Subject', patterns: ['patient', 'subject', 'participant'], icon: 'fa-hospital-user' },
                { type: 'Location / Geography', patterns: ['store', 'branch', 'city', 'region', 'country', 'zip'], icon: 'fa-location-dot' }
            ];

            dataset.columns.forEach(col => {
                const lower = col.toLowerCase();
                const p = colProfiles[col] || {};
                const uniqueCount = (p.stats && (p.stats.uniqueCount || p.stats.distinctCount)) || 0;

                for (const arc of ARCHETYPES) {
                    const matched = arc.patterns.some(pat => lower.includes(pat));
                    if (matched) {
                        const repRatio = uniqueCount > 0 ? +(rowCount / uniqueCount).toFixed(2) : 1;
                        const uniquenessRatio = rowCount > 0 ? +(uniqueCount / rowCount).toFixed(2) : 0;

                        entities.push({
                            entityType: arc.type,
                            identifierColumn: col,
                            totalKeys: uniqueCount,
                            repetitionRatio: repRatio,
                            uniquenessRatio: uniquenessRatio,
                            confidence: uniqueCount > 0 && uniqueCount < rowCount ? 0.90 : 0.70,
                            icon: arc.icon,
                            status: 'OBSERVED',
                            evidence: [`Column "${col}" matches ${arc.type} pattern with ${uniqueCount} unique keys (${repRatio}x observations/key).`]
                        });
                        break;
                    }
                }
            });

            return entities;
        }
    }

    return EntityDiscoverer;
}));
