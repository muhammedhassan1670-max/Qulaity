/**
 * UDIP Deep Intelligence Evolution vNext
 * AnalyticalQuestionRanker - Ranks Questions by Expected Information Value
 * Strict zero-dependency pure vanilla JavaScript (ES6+).
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.AnalyticalQuestionRanker = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class AnalyticalQuestionRanker {
        static rank(questions) {
            if (!Array.isArray(questions)) return [];
            return [...questions].sort((a, b) => (b.expectedInformationValue || 0) - (a.expectedInformationValue || 0));
        }
    }

    return AnalyticalQuestionRanker;
}));
