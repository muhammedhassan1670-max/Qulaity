/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: profiling/type-detector.js
 * ============================================================================
 * Advanced value-based type detector supporting 12 fine-grained types:
 * - numeric, integer, decimal, categorical, text, date, datetime, time,
 *   boolean, identifier, empty, mixed
 * Performs deep pattern matching and reports transparent reasoning.
 * ============================================================================
 */

(function (window) {
    'use strict';

    const TypeDetector = {
        /**
         * Patterns for robust type detection
         */
        PATTERNS: {
            integer: /^[+-]?\d+$/,
            decimal: /^[+-]?\d+\.\d+$/,
            time: /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\s*(AM|PM|am|pm))?$/,
            dateIso: /^\d{4}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])$/,
            dateCommon: /^(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/]\d{4}$/,
            datetimeIso: /^\d{4}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])[T\s]([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/,
            identifier: /^[A-Za-z0-9_-]{3,64}$/,
            idPrefix: /^(id|uuid|code|key|no|num|guid|ref|hash|serial|account|sku|order|cust|customer|client|user|emp|employee|trans|transaction|batch|item|record|patient|student|ticket|invoice|sample|sensor)[_-]?|[_-]?(id|code|key|no|num|guid|ref|serial)$/i,
            booleanValues: new Set(['true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 't', 'f', 'نعم', 'لا'])
        },

        /**
         * Classify an individual cell value
         * @returns {{ type: string, subType: string, raw: any, parsed: any }}
         */
        classifyValue(val) {
            if (val === null || val === undefined || val === '') {
                return { type: 'empty', subType: 'null', raw: val, parsed: null };
            }

            const str = String(val).trim();
            if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str === 'NaN') {
                return { type: 'empty', subType: 'empty_string', raw: val, parsed: null };
            }

            // Boolean check
            const lower = str.toLowerCase();
            if (this.PATTERNS.booleanValues.has(lower)) {
                const bVal = (lower === 'true' || lower === 'yes' || lower === 'y' || lower === '1' || lower === 't' || lower === 'نعم');
                return { type: 'boolean', subType: 'boolean', raw: val, parsed: bVal };
            }

            // Numeric check (integer vs decimal)
            if (this.PATTERNS.integer.test(str)) {
                return { type: 'numeric', subType: 'integer', raw: val, parsed: parseInt(str, 10) };
            }
            if (this.PATTERNS.decimal.test(str)) {
                return { type: 'numeric', subType: 'decimal', raw: val, parsed: parseFloat(str) };
            }
            if (typeof val === 'number' && isFinite(val)) {
                return {
                    type: 'numeric',
                    subType: Number.isInteger(val) ? 'integer' : 'decimal',
                    raw: val,
                    parsed: val
                };
            }

            // Datetime check (strict digits in timestamp)
            if (this.PATTERNS.datetimeIso.test(str) || (str.length >= 16 && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[T\s]\d{1,2}:\d{1,2}/.test(str) && !isNaN(Date.parse(str)))) {
                return { type: 'datetime', subType: 'datetime', raw: val, parsed: new Date(str) };
            }

            // Date check (strict numeric date patterns)
            if (this.PATTERNS.dateIso.test(str) || this.PATTERNS.dateCommon.test(str) || (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(str) && !isNaN(Date.parse(str)))) {
                return { type: 'date', subType: 'date', raw: val, parsed: new Date(str) };
            }

            // Time check
            if (this.PATTERNS.time.test(str)) {
                return { type: 'time', subType: 'time', raw: val, parsed: str };
            }

            return { type: 'string', subType: 'string', raw: val, parsed: str };
        },

        /**
         * Deep type inspection for a full column
         * @param {string} colName
         * @param {Array<Object>} rows
         * @returns {Object} Full type detection result
         */
        detectColumnType(colName, rows) {
            const total = rows.length;
            if (total === 0) {
                return {
                    detectedType: 'empty',
                    subType: 'empty',
                    dominantType: 'empty',
                    isMixed: false,
                    conflictingValues: [],
                    typeReason: 'Column has zero rows'
                };
            }

            const typeCounts = {
                numeric: 0,
                integer: 0,
                decimal: 0,
                date: 0,
                datetime: 0,
                time: 0,
                boolean: 0,
                string: 0,
                empty: 0
            };

            const uniqueValues = new Set();
            const sampleValues = [];
            const nonNumericStrings = [];
            let totalLength = 0;
            let maxLength = 0;

            for (let i = 0; i < total; i++) {
                const rawVal = rows[i] ? rows[i][colName] : null;
                const classified = this.classifyValue(rawVal);

                if (classified.type === 'empty') {
                    typeCounts.empty++;
                } else {
                    typeCounts[classified.type]++;
                    if (classified.subType === 'integer') typeCounts.integer++;
                    if (classified.subType === 'decimal') typeCounts.decimal++;

                    const str = String(rawVal).trim();
                    uniqueValues.add(str);
                    if (sampleValues.length < 5) sampleValues.push(str);

                    totalLength += str.length;
                    if (str.length > maxLength) maxLength = str.length;

                    if (classified.type === 'string') {
                        if (nonNumericStrings.length < 5) nonNumericStrings.push(str);
                    }
                }
            }

            const nonNullCount = total - typeCounts.empty;
            const uniqueCount = uniqueValues.size;
            const uniquenessRatio = nonNullCount > 0 ? (uniqueCount / nonNullCount) : 0;
            const avgLength = nonNullCount > 0 ? (totalLength / nonNullCount) : 0;

            // 1. All Empty
            if (nonNullCount === 0) {
                return {
                    detectedType: 'empty',
                    subType: 'empty',
                    dominantType: 'empty',
                    isMixed: false,
                    conflictingValues: [],
                    typeReason: 'All values are null or empty'
                };
            }

            // 2. Boolean Check (threshold: >= 95% of non-null)
            if (typeCounts.boolean / nonNullCount >= 0.95 && uniqueCount <= 4) {
                return {
                    detectedType: 'boolean',
                    subType: 'boolean',
                    dominantType: 'boolean',
                    isMixed: typeCounts.boolean < nonNullCount,
                    conflictingValues: nonNumericStrings,
                    typeReason: `${Math.round((typeCounts.boolean / nonNullCount) * 100)}% of non-null values are boolean representations`
                };
            }

            // 3. Date / Datetime / Time Check
            const temporalCount = typeCounts.date + typeCounts.datetime + typeCounts.time;
            if (temporalCount / nonNullCount >= 0.85) {
                if (typeCounts.datetime >= typeCounts.date && typeCounts.datetime >= typeCounts.time) {
                    return {
                        detectedType: 'datetime',
                        subType: 'datetime',
                        dominantType: 'datetime',
                        isMixed: temporalCount < nonNullCount,
                        conflictingValues: nonNumericStrings,
                        typeReason: `${Math.round((typeCounts.datetime / nonNullCount) * 100)}% of values match timestamp format`
                    };
                }
                if (typeCounts.time > typeCounts.date) {
                    return {
                        detectedType: 'time',
                        subType: 'time',
                        dominantType: 'time',
                        isMixed: temporalCount < nonNullCount,
                        conflictingValues: nonNumericStrings,
                        typeReason: `${Math.round((typeCounts.time / nonNullCount) * 100)}% of values match time-of-day format`
                    };
                }
                return {
                    detectedType: 'date',
                    subType: 'date',
                    dominantType: 'date',
                    isMixed: temporalCount < nonNullCount,
                    conflictingValues: nonNumericStrings,
                    typeReason: `${Math.round((typeCounts.date / nonNullCount) * 100)}% of values match calendar date format`
                };
            }

            // 4. Numeric & Mixed-Numeric Check
            const numericRatio = typeCounts.numeric / nonNullCount;
            if (numericRatio >= 0.95) {
                const subType = (typeCounts.decimal > 0) ? 'decimal' : 'integer';
                return {
                    detectedType: subType,
                    subType: subType,
                    dominantType: 'numeric',
                    isMixed: numericRatio < 1.0,
                    conflictingValues: nonNumericStrings,
                    typeReason: subType === 'decimal'
                        ? `${Math.round(numericRatio * 100)}% numeric values containing decimal points`
                        : `${Math.round(numericRatio * 100)}% whole integer values`
                };
            } else if (numericRatio >= 0.65) {
                // Mixed: primarily numeric but contains text noise like "N/A", "unknown", "?"
                return {
                    detectedType: 'mixed',
                    subType: 'mixed_numeric',
                    dominantType: 'numeric',
                    isMixed: true,
                    conflictingValues: nonNumericStrings,
                    typeReason: `Potential numeric column (${Math.round(numericRatio * 100)}% numbers) with non-numeric values (e.g. ${nonNumericStrings.slice(0, 3).join(', ')})`
                };
            }

            // 5. Identifier Check
            const nameHasIdHint = this.PATTERNS.idPrefix.test(colName);
            const highUniqueness = uniquenessRatio >= 0.95;
            const valuesLookLikeId = sampleValues.every(s => this.PATTERNS.identifier.test(s));

            if ((highUniqueness && (nameHasIdHint || valuesLookLikeId)) || (nameHasIdHint && uniquenessRatio >= 0.8)) {
                return {
                    detectedType: 'identifier',
                    subType: 'identifier',
                    dominantType: 'identifier',
                    isMixed: false,
                    conflictingValues: [],
                    typeReason: `High uniqueness (${Math.round(uniquenessRatio * 100)}%) with ID-like pattern${nameHasIdHint ? ' and naming convention' : ''}`
                };
            }

            // 6. Categorical vs Free Text
            // If average text length > 50 or max length > 120 or high uniqueness with sentence structure -> text
            if (avgLength > 50 || maxLength > 120 || (avgLength > 25 && uniquenessRatio > 0.8)) {
                return {
                    detectedType: 'text',
                    subType: 'long_text',
                    dominantType: 'text',
                    isMixed: false,
                    conflictingValues: [],
                    typeReason: `Free-form text with average length ${Math.round(avgLength)} characters (max: ${maxLength})`
                };
            }

            // Categorical (discrete categories)
            return {
                detectedType: 'categorical',
                subType: 'categorical',
                dominantType: 'categorical',
                isMixed: false,
                conflictingValues: [],
                typeReason: `Discrete categorical values with cardinality of ${uniqueCount} unique categories`
            };
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.TypeDetector = TypeDetector;

})(window);
