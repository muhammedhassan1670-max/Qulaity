/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/motion-system.js
 * ============================================================================
 * UDIP Motion & Micro-Interactions System:
 * Unified motion orchestration communicating operational meaning:
 *   - Ingestion: data particle flow pulses
 *   - Analysis: sequential node activation
 *   - Model Training: computational gradient waves
 *   - Anomaly: controlled warning beacons
 *   - Decision: evidence convergence
 *   - Autonomous: knowledge node crystallization
 *   - Copilot: synthetic intelligence shimmer
 *   - Metric Counter: smooth cubic-bezier numeric interpolation
 *
 * GPU-friendly (transform/opacity only), supports prefers-reduced-motion.
 * ============================================================================
 */

(function (window) {
    'use strict';

    window.UDIP = window.UDIP || {};

    class MotionSystem {
        constructor() {
            this.prefersReducedMotion = false;
            this._checkReducedMotion();
            this.activeCounters = new Map();
        }

        _checkReducedMotion() {
            if (typeof window !== 'undefined' && window.matchMedia) {
                const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
                this.prefersReducedMotion = mq.matches;
                mq.addEventListener('change', (e) => {
                    this.prefersReducedMotion = e.matches;
                });
            }
        }

        /**
         * Initialize motion listeners and observer on root
         */
        init(rootElement = document) {
            if (!rootElement || typeof window === 'undefined') return;

            this.observeReveals(rootElement);
            this.bindInteractiveTilts(rootElement);
            this.bindCardHoverDepth(rootElement);
        }

        /**
         * Observe elements for fluid reveal animations as they enter view
         */
        observeReveals(root = document) {
            if (this.prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
                const els = root.querySelectorAll('.udip-reveal-item');
                els.forEach(el => el.classList.add('is-revealed'));
                return;
            }

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

            const targets = root.querySelectorAll('.udip-card, .udip-kpi-card, .udip-insight-card, .udip-decision-card, .udip-feature-card');
            targets.forEach((el, idx) => {
                el.classList.add('udip-reveal-item');
                el.style.setProperty('--reveal-delay', `${Math.min(idx * 0.04, 0.4)}s`);
                observer.observe(el);
            });
        }

        /**
         * 3D Depth Card Tilt effect
         */
        bindInteractiveTilts(root = document) {
            if (this.prefersReducedMotion) return;

            const tiltCards = root.querySelectorAll('.udip-kpi-card, .udip-feature-card, .udip-hero-stat-card');
            tiltCards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const rotateX = ((y - centerY) / centerY) * -5;
                    const rotateY = ((x - centerX) / centerX) * 5;

                    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
                    card.style.setProperty('--mouse-x', `${(x / rect.width * 100).toFixed(1)}%`);
                    card.style.setProperty('--mouse-y', `${(y / rect.height * 100).toFixed(1)}%`);
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }

        /**
         * Contextual glow elevation on hover
         */
        bindCardHoverDepth(root = document) {
            const cards = root.querySelectorAll('.udip-card, .udip-insight-card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.classList.add('udip-card-elevated');
                });
                card.addEventListener('mouseleave', () => {
                    card.classList.remove('udip-card-elevated');
                });
            });
        }

        /**
         * Smooth tabular animated counter for numeric values
         */
        animateCounter(element, targetVal, durationMs = 800, suffix = '', prefix = '') {
            if (!element) return;
            if (this.prefersReducedMotion) {
                element.textContent = `${prefix}${targetVal}${suffix}`;
                return;
            }

            const cleanNum = parseFloat(String(targetVal).replace(/[^0-9.-]/g, ''));
            if (isNaN(cleanNum)) {
                element.textContent = targetVal;
                return;
            }

            const isInteger = Number.isInteger(cleanNum);
            const startVal = 0;
            const startTime = performance.now();

            const update = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = startVal + (cleanNum - startVal) * easeOut;

                const formatted = isInteger 
                    ? Math.round(current).toLocaleString()
                    : current.toFixed(2);

                element.textContent = `${prefix}${formatted}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    element.textContent = `${prefix}${cleanNum.toLocaleString()}${suffix}`;
                }
            };

            requestAnimationFrame(update);
        }

        /**
         * Trigger an operational semantic system event pulse
         */
        triggerSemanticEvent(eventType, detail = {}) {
            // Forward to Intelligence Core visualizer if available
            if (window.UDIP.IntelligenceCore) {
                if (eventType === 'ANALYSIS_STARTED') window.UDIP.IntelligenceCore.setMode('analyzing', 4000);
                else if (eventType === 'ANOMALY_DETECTED') window.UDIP.IntelligenceCore.setMode('anomaly', 3500);
                else if (eventType === 'DECISION_EVALUATED') window.UDIP.IntelligenceCore.setMode('decision', 3000);
                else if (eventType === 'COPILOT_QUERY') window.UDIP.IntelligenceCore.setMode('copilot', 3000);
            }

            // Forward to AI Entity avatar if present
            if (window.UDIP.AIEntity) {
                if (eventType === 'COPILOT_QUERY' || eventType === 'ANALYSIS_STARTED') {
                    window.UDIP.AIEntity.setState('processing');
                } else if (eventType === 'SUCCESS') {
                    window.UDIP.AIEntity.setState('idle');
                }
            }

            // Localized DOM propagation if element target is provided
            if (detail && detail.target) {
                const el = typeof detail.target === 'string' ? document.querySelector(detail.target) : detail.target;
                if (el) {
                    el.classList.remove('udip-pulse-beacon', 'udip-anomaly-pulse', 'udip-success-pulse');
                    // Force reflow
                    void el.offsetWidth;

                    if (eventType === 'ANOMALY_DETECTED') {
                        el.classList.add('udip-anomaly-pulse');
                    } else if (eventType === 'SUCCESS') {
                        el.classList.add('udip-success-pulse');
                    } else {
                        el.classList.add('udip-pulse-beacon');
                    }
                }
            }
        }
    }

    window.UDIP.Motion = new MotionSystem();

})(typeof window !== 'undefined' ? window : global);
