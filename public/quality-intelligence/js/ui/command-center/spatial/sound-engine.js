/**
 * ============================================================================
 * UDIP 3D AI RESEARCH LABORATORY — SPATIAL SUBSYSTEM
 * Module: js/ui/command-center/spatial/sound-engine.js
 * ============================================================================
 * Procedural Web Audio Sci-Fi Soundscape (Zero external audio files / 100% Code-Synthesized):
 * - Quantum Reactor Ambient Hum (dual detuned sub-bass sine oscillators with LFO)
 * - Synaptic Micro-Clicks (resonant high-pass impulses on neural fire)
 * - Cinematic Camera Swooshes (band-pass filtered white-noise sweeps)
 * - Anomaly Alert (sub-bass drop 80Hz -> 28Hz + detuned sawtooth alarm)
 * - Hypothesis Inter-Agent Beam (crystalline harmonic chime E5-B5-E6)
 * - Validation Success Chime (ascending major triad chord)
 * - Safe no-op fallback in headless/Node.js testing environments
 * ============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.UDIP = root.UDIP || {};
        root.UDIP.SpatialSoundEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class SpatialSoundEngine {
        constructor() {
            this.ctx = null;
            this.masterGain = null;
            this.humGain = null;
            this.humOsc1 = null;
            this.humOsc2 = null;
            this.muted = false;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return this;

            const AudioCtx = typeof window !== 'undefined'
                ? (window.AudioContext || window.webkitAudioContext || null)
                : (typeof globalThis !== 'undefined' ? (globalThis.AudioContext || globalThis.webkitAudioContext || null) : null);

            if (!AudioCtx) {
                // Headless/Test environment fallback
                this.initialized = true;
                return this;
            }

            try {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
                this.initialized = true;
            } catch (e) {
                this.initialized = true;
            }

            return this;
        }

        _ensureActive() {
            if (!this.ctx) return false;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return !this.muted;
        }

        toggleMute() {
            this.muted = !this.muted;
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.setValueAtTime(this.muted ? 0.0 : 0.35, this.ctx.currentTime);
            }
            return this.muted;
        }

        isMuted() {
            return this.muted;
        }

        startAmbientHum() {
            if (!this._ensureActive() || this.humOsc1) return;

            try {
                const now = this.ctx.currentTime;
                this.humGain = this.ctx.createGain();
                this.humGain.gain.setValueAtTime(0.045, now);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(140, now);

                this.humOsc1 = this.ctx.createOscillator();
                this.humOsc1.type = 'sine';
                this.humOsc1.frequency.setValueAtTime(55.0, now); // A1 note

                this.humOsc2 = this.ctx.createOscillator();
                this.humOsc2.type = 'sine';
                this.humOsc2.frequency.setValueAtTime(55.4, now); // Detuned beat frequency (0.4 Hz drone)

                this.humOsc1.connect(filter);
                this.humOsc2.connect(filter);
                filter.connect(this.humGain);
                this.humGain.connect(this.masterGain);

                this.humOsc1.start(now);
                this.humOsc2.start(now);
            } catch (e) {}
        }

        playSynapticClick() {
            if (!this._ensureActive()) return;

            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(3200 + Math.random() * 1200, now);
                filter.Q.setValueAtTime(8, now);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);

                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 0.016);
            } catch (e) {}
        }

        playCameraSwoosh() {
            if (!this._ensureActive()) return;

            try {
                const now = this.ctx.currentTime;
                const bufferSize = this.ctx.sampleRate * 0.28;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.setValueAtTime(3, now);
                filter.frequency.setValueAtTime(250, now);
                filter.frequency.exponentialRampToValueAtTime(1400, now + 0.14);
                filter.frequency.exponentialRampToValueAtTime(350, now + 0.28);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                noise.start(now);
            } catch (e) {}
        }

        playAnomalyAlert() {
            if (!this._ensureActive()) return;

            try {
                const now = this.ctx.currentTime;

                // 1. Sub-bass drop
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(90, now);
                subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.65);

                subGain.gain.setValueAtTime(0.28, now);
                subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

                subOsc.connect(subGain);
                subGain.connect(this.masterGain);
                subOsc.start(now);
                subOsc.stop(now + 0.72);

                // 2. Urgent minor 2nd warning pulse
                const sawOsc = this.ctx.createOscillator();
                const sawGain = this.ctx.createGain();
                sawOsc.type = 'sawtooth';
                sawOsc.frequency.setValueAtTime(440, now);
                sawOsc.frequency.setValueAtTime(466.16, now + 0.15); // A4 -> Bb4 tension

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(650, now);

                sawGain.gain.setValueAtTime(0.08, now);
                sawGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

                sawOsc.connect(filter);
                filter.connect(sawGain);
                sawGain.connect(this.masterGain);

                sawOsc.start(now);
                sawOsc.stop(now + 0.46);
            } catch (e) {}
        }

        playHypothesisBeam() {
            if (!this._ensureActive()) return;

            try {
                const now = this.ctx.currentTime;
                const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6 (Crystalline chime)

                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                    gain.gain.setValueAtTime(0.07, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.4);

                    osc.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.42);
                });
            } catch (e) {}
        }

        playValidationChime() {
            if (!this._ensureActive()) return;

            try {
                const now = this.ctx.currentTime;
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major triad resolution)

                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

                    gain.gain.setValueAtTime(0.06, now + idx * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.55);

                    osc.connect(gain);
                    gain.connect(this.masterGain);

                    osc.start(now + idx * 0.06);
                    osc.stop(now + idx * 0.06 + 0.58);
                });
            } catch (e) {}
        }

        destroy() {
            if (this.humOsc1) {
                try { this.humOsc1.stop(); this.humOsc2.stop(); } catch (e) {}
                this.humOsc1 = null;
                this.humOsc2 = null;
            }
            if (this.ctx && typeof this.ctx.close === 'function') {
                try { this.ctx.close(); } catch (e) {}
            }
            this.ctx = null;
            this.masterGain = null;
            this.initialized = false;
        }
    }

    return SpatialSoundEngine;
}));
