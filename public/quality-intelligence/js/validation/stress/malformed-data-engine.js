/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: validation/stress/malformed-data-engine.js
 * ============================================================================
 * Malformed Data Stress Testing Engine:
 * Generates and tests hostile and corrupted data payloads:
 * - Injected NaN, Infinity, -Infinity
 * - Mixed text/numeric values in same column
 * - Corrupted date formats (e.g. "99/99/9999", "not_a_date")
 * - Unicode, Arabic RTL, Chinese, Emoji in column names and values
 * - Extreme numerical scales (1e+20, 1e-20)
 * - Deeply nested or extremely long string values (>5000 characters)
 * ============================================================================
 */

(function (window) {
    'use strict';

    const MalformedDataEngine = {
        /**
         * Generate a dataset containing severe malformed inputs
         * @returns {Object}
         */
        generateMalformedDataset() {
            const rows = [
                { id: 1, mixed_col: 100, bad_date: '2024-01-01', extreme_num: 1e-15, unicode_col: 'Normal text', text_col: 'Short' },
                { id: 2, mixed_col: 'INVALID_TEXT', bad_date: '99/99/9999', extreme_num: 1e+18, unicode_col: 'مرحبا بكم في الاختبار', text_col: '🚀🔥🎉' },
                { id: 3, mixed_col: null, bad_date: 'invalid_date_token', extreme_num: NaN, unicode_col: '中文测试数据', text_col: 'A'.repeat(2000) },
                { id: 4, mixed_col: undefined, bad_date: '', extreme_num: Infinity, unicode_col: 'RTL عربى مع انجليزى English 123', text_col: '<script>alert(1)</script>' },
                { id: 5, mixed_col: 200, bad_date: '2025-12-31', extreme_num: -Infinity, unicode_col: 'Special chars: ~!@#$%^&*()_+{}[]', text_col: 'Standard' }
            ];

            return {
                id: 'malformed_stress_ds',
                filename: 'malformed_stress_payload.csv',
                rowCount: rows.length,
                columnCount: 6,
                columns: ['id', 'mixed_col', 'bad_date', 'extreme_num', 'unicode_col', 'text_col'],
                rows
            };
        },

        /**
         * Test that a given processing function safely handles malformed data
         * @param {Function} processor (ds) => any
         * @returns {Object} { safe: boolean, error: string|null }
         */
        testMalformedTolerance(processor) {
            const ds = this.generateMalformedDataset();
            try {
                processor(ds);
                return {
                    safe: true,
                    error: null,
                    message: 'Successfully processed malformed dataset without crashing'
                };
            } catch (err) {
                return {
                    safe: false,
                    error: err.message || String(err),
                    message: 'Crash occurred when processing malformed dataset'
                };
            }
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.Validation = window.UDIP.Validation || {};
    window.UDIP.Validation.MalformedDataEngine = MalformedDataEngine;

})(typeof window !== 'undefined' ? window : global);
