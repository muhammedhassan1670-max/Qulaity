/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: utils/helpers.js
 * ============================================================================
 * Domain-agnostic mathematical, formatting, and type utilities.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const Helpers = {
        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },

        /**
         * Format byte sizes into human readable strings (KB, MB, GB)
         */
        formatBytes(bytes, decimals = 2) {
            if (!bytes || bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        /**
         * Format numbers with commas
         */
        formatNumber(num) {
            if (num == null || isNaN(num)) return '0';
            return Number(num).toLocaleString();
        },

        /**
         * Infer the primitive data type of a value
         */
        detectValueType(val) {
            if (val == null || val === '') return 'null';
            if (typeof val === 'boolean' || val === 'true' || val === 'false') return 'boolean';
            if (typeof val === 'number') return 'numeric';
            const str = String(val).trim();
            if (str === '') return 'null';
            if (!isNaN(Number(str)) && !isNaN(parseFloat(str))) return 'numeric';
            // Check Date
            if (str.length >= 8 && !isNaN(Date.parse(str)) && /[/\-:]/.test(str)) {
                return 'datetime';
            }
            return 'string';
        },

        /**
         * Infer dominant data type for each column in a dataset
         */
        inferColumnTypes(columns, rows, sampleLimit = 200) {
            const types = {};
            const sample = rows.slice(0, sampleLimit);
            
            columns.forEach(col => {
                const typeCounts = { numeric: 0, datetime: 0, boolean: 0, string: 0, null: 0 };
                sample.forEach(row => {
                    const t = Helpers.detectValueType(row[col]);
                    typeCounts[t]++;
                });

                const nonNullTotal = sample.length - typeCounts.null;
                if (nonNullTotal === 0) {
                    types[col] = 'string';
                } else if (typeCounts.numeric / nonNullTotal >= 0.8) {
                    types[col] = 'numeric';
                } else if (typeCounts.datetime / nonNullTotal >= 0.8) {
                    types[col] = 'datetime';
                } else if (typeCounts.boolean / nonNullTotal >= 0.8) {
                    types[col] = 'boolean';
                } else {
                    types[col] = 'string';
                }
            });

            return types;
        },

        /**
         * Generate a clean, unique ID
         */
        generateId(prefix = 'id') {
            return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        },

        /**
         * Truncate string with ellipsis
         */
        truncate(str, maxLen = 30) {
            if (!str) return '';
            str = String(str);
            return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Helpers = Helpers;

})(window);
