/**
 * ============================================================================
 * UDIP 3D AI ANALYTICAL COMMAND CENTER
 * Module: js/ui/command-center/motion-orchestrator.js
 * ============================================================================
 * Centralized Event-Driven Motion & Intelligence Coordinator
 * 
 * Orchestrates continuous living visual motion across all 5 spatial zones:
 * - Zone A: Top Command Bar
 * - Zone B: Central 3D Intelligence Core & 7-Stage Cognitive Pipeline
 * - Zone C: Data DNA (Living Schema Organism & Quality Gauge)
 * - Zone D: Live Intelligence Feed (Research Log)
 * - Zone E: Executive Intelligence Strip (Precision Gauges)
 * 
 * Conceptual Platform Events:
 * - DATA_LOADED
 * - DATA_PROFILED
 * - RELATIONSHIP_DISCOVERED
 * - ANOMALY_DETECTED
 * - HYPOTHESIS_CREATED
 * - HYPOTHESIS_TESTED
 * - COUNTER_EVIDENCE_FOUND
 * - INSIGHT_GENERATED
 * - WHAT_IF_PERTURBED
 * - CONCLUSION_REACHED
 * 
 * Motion Levels:
 * - 'ambient': Continuous organic background motion
 * - 'analytical': High-resonance response to intelligence events
 * - 'cinematic': Dramatic transitions and initial awakening
 * - 'reduced': Respects prefers-reduced-motion
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.MotionOrchestrator = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const EVENT_TYPES = {
        DATA_LOADED: 'DATA_LOADED',
        DATA_PROFILED: 'DATA_PROFILED',
        RELATIONSHIP_DISCOVERED: 'RELATIONSHIP_DISCOVERED',
        ANOMALY_DETECTED: 'ANOMALY_DETECTED',
        HYPOTHESIS_CREATED: 'HYPOTHESIS_CREATED',
        HYPOTHESIS_TESTED: 'HYPOTHESIS_TESTED',
        COUNTER_EVIDENCE_FOUND: 'COUNTER_EVIDENCE_FOUND',
        INSIGHT_GENERATED: 'INSIGHT_GENERATED',
        WHAT_IF_PERTURBED: 'WHAT_IF_PERTURBED',
        CONCLUSION_REACHED: 'CONCLUSION_REACHED'
    };

    const MOTION_LEVELS = {
        AMBIENT: 'ambient',
        ANALYTICAL: 'analytical',
        CINEMATIC: 'cinematic',
        REDUCED: 'reduced'
    };

    class MotionOrchestrator {
        constructor() {
            this.listeners = new Map();
            this.activeTarget = null;
            this.currentMode = MOTION_LEVELS.AMBIENT;
            this.running = false;
            this.animId = null;
            this.lastTime = 0;
            this.fps = 60;
            this.frameCount = 0;
            this.fpsUpdateTimer = 0;
            this.subscribers = new Set();
            this.isTabVisible = true;
            this.eventHistory = [];

            // Detect reduced motion preference
            if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
                try {
                    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
                    if (mq && mq.matches) {
                        this.currentMode = MOTION_LEVELS.REDUCED;
                    }
                    if (mq && typeof mq.addEventListener === 'function') {
                        mq.addEventListener('change', (e) => {
                            this.currentMode = e.matches ? MOTION_LEVELS.REDUCED : MOTION_LEVELS.AMBIENT;
                        });
                    }
                } catch (e) {
                    // Ignore matchMedia error in sandboxes
                }
            }

            // Tab visibility management to pause expensive updates when tab is hidden
            this._setupVisibilityHandler();
        }

        static get EVENTS() {
            return EVENT_TYPES;
        }

        static get LEVELS() {
            return MOTION_LEVELS;
        }

        _setupVisibilityHandler() {
            if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
                this._onVisibilityChange = () => {
                    this.isTabVisible = !document.hidden;
                    if (this.isTabVisible) {
                        this.lastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                    }
                };
                document.addEventListener('visibilitychange', this._onVisibilityChange);
            }
        }

        /**
         * Subscribe to platform intelligence motion events
         */
        on(event, callback) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, new Set());
            }
            this.listeners.get(event).add(callback);
            return () => this.off(event, callback);
        }

        /**
         * Unsubscribe from events
         */
        off(event, callback) {
            if (this.listeners.has(event)) {
                this.listeners.get(event).delete(callback);
            }
        }

        /**
         * Register a continuous frame subscriber (e.g. canvas visualizer or HUD ticker)
         */
        subscribe(callback) {
            this.subscribers.add(callback);
            if (!this.running) this.start();
            return () => this.unsubscribe(callback);
        }

        unsubscribe(callback) {
            this.subscribers.delete(callback);
            if (this.subscribers.size === 0) {
                this.stop();
            }
        }

        /**
         * Dispatch a platform intelligence event across all Command Center zones
         */
        dispatch(event, payload = {}) {
            const eventRecord = {
                event: event,
                payload: payload,
                timestamp: Date.now()
            };
            this.eventHistory.push(eventRecord);
            if (this.eventHistory.length > 50) this.eventHistory.shift();

            // Auto-update active analytical target if variable or finding specified
            if (payload.target) {
                this.setActiveTarget(payload.target);
            } else if (payload.variable) {
                this.setActiveTarget({ type: 'VARIABLE', item: payload.variable });
            } else if (payload.finding) {
                this.setActiveTarget({ type: 'FINDING', item: payload.finding });
            }

            const handlers = this.listeners.get(event);
            if (handlers) {
                handlers.forEach(fn => {
                    try {
                        fn(payload, eventRecord);
                    } catch (err) {
                        if (typeof console !== 'undefined' && console.error) {
                            console.error(`[MotionOrchestrator] Error in event listener for ${event}:`, err);
                        }
                    }
                });
            }

            // Also broadcast custom DOM event if in browser
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
                try {
                    window.dispatchEvent(new CustomEvent('udip-motion-event', { detail: eventRecord }));
                } catch (e) {
                    // Ignore DOM event dispatch errors
                }
            }
        }

        /**
         * Set current analytical target of interest for AI Observer and Nucleus
         */
        setActiveTarget(target) {
            this.activeTarget = target;
            const handlers = this.listeners.get('TARGET_CHANGED');
            if (handlers) {
                handlers.forEach(fn => {
                    try { fn(target); } catch (e) {}
                });
            }
        }

        getActiveTarget() {
            return this.activeTarget;
        }

        /**
         * Set motion mode (ambient, analytical, cinematic, reduced)
         */
        setMotionLevel(level) {
            if (Object.values(MOTION_LEVELS).includes(level)) {
                this.currentMode = level;
            }
        }

        getMotionLevel() {
            return this.currentMode;
        }

        /**
         * Central requestAnimationFrame loop
         */
        start() {
            if (this.running) return;
            this.running = true;
            this.lastTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

            const loop = (currentTime) => {
                if (!this.running) return;

                const now = currentTime || ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());
                const dt = Math.min(100, Math.max(1, now - (this.lastTime || now)));
                this.lastTime = now;

                // Frame rate tracking
                this.frameCount++;
                this.fpsUpdateTimer += dt;
                if (this.fpsUpdateTimer >= 1000) {
                    this.fps = Math.round((this.frameCount * 1000) / this.fpsUpdateTimer);
                    this.frameCount = 0;
                    this.fpsUpdateTimer = 0;
                }

                // If tab is visible and not in reduced-motion, tick subscribers
                if (this.isTabVisible && this.subscribers.size > 0) {
                    this.subscribers.forEach(sub => {
                        try {
                            sub({ dt, time: now, fps: this.fps, mode: this.currentMode });
                        } catch (err) {
                            // Suppress subscriber error to avoid breaking loop
                        }
                    });
                }

                if (typeof requestAnimationFrame === 'function') {
                    this.animId = requestAnimationFrame(loop);
                } else if (typeof setTimeout === 'function') {
                    this.animId = setTimeout(() => loop(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now())), 16);
                }
            };

            if (typeof requestAnimationFrame === 'function') {
                this.animId = requestAnimationFrame(loop);
            } else if (typeof setTimeout === 'function') {
                this.animId = setTimeout(() => loop(Date.now()), 16);
            }
        }

        stop() {
            this.running = false;
            if (this.animId) {
                if (typeof cancelAnimationFrame === 'function') {
                    cancelAnimationFrame(this.animId);
                } else if (typeof clearTimeout === 'function') {
                    clearTimeout(this.animId);
                }
                this.animId = null;
            }
        }

        destroy() {
            this.stop();
            this.listeners.clear();
            this.subscribers.clear();
            this.eventHistory = [];
            if (this._onVisibilityChange && typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
                document.removeEventListener('visibilitychange', this._onVisibilityChange);
            }
        }
    }

    return new MotionOrchestrator();
}));
