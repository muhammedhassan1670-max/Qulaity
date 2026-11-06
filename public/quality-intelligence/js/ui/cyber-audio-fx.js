/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/cyber-audio-fx.js
 * ============================================================================
 * Procedural Sci-Fi Web Audio SFX Synthesizer Engine
 * Generates rich cybernetic sounds without external audio assets:
 * - Digital click / tap
 * - Telemetry chirp / blip
 * - Quantum warp sweep
 * - Harmonic success chord
 * - Failure / Alert klaxon
 * - Laser scan pulse
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _audioCtx = null;
    let _enabled = true;
    let _masterVolume = 0.08;

    function getAudioContext() {
        if (!_audioCtx && typeof window !== 'undefined') {
            try {
                const AudioClass = window.AudioContext || window.webkitAudioContext;
                if (AudioClass) {
                    _audioCtx = new AudioClass();
                }
            } catch (e) {
                _audioCtx = null;
            }
        }
        if (_audioCtx && _audioCtx.state === 'suspended') {
            _audioCtx.resume().catch(() => {});
        }
        return _audioCtx;
    }

    const CyberAudioFX = {
        isEnabled() {
            return _enabled;
        },

        setEnabled(flag) {
            _enabled = Boolean(flag);
            return _enabled;
        },

        toggle() {
            _enabled = !_enabled;
            if (_enabled) this.playChirp(880, 0.08);
            return _enabled;
        },

        setMasterVolume(val) {
            _masterVolume = Math.max(0, Math.min(1, Number(val) || 0.08));
        },

        /**
         * Play single or dual frequency chirp
         */
        playChirp(freq = 700, duration = 0.05, type = 'sine', gainVal = 0.04) {
            if (!_enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const actualGain = gainVal * (_masterVolume / 0.08);

                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);

                gain.gain.setValueAtTime(actualGain, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (e) {}
        },

        /**
         * Play cyber mechanical click
         */
        playClick() {
            this.playChirp(1200, 0.02, 'triangle', 0.03);
        },

        /**
         * Play sci-fi laser scan beam
         */
        playLaser() {
            if (!_enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const dur = 0.12;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(1800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + dur);

                gain.gain.setValueAtTime(0.03 * (_masterVolume / 0.08), ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + dur);
            } catch (e) {}
        },

        /**
         * Play quantum warp energy sweep
         */
        playWarp() {
            if (!_enabled) return;
            const ctx = getAudioContext();
            if (!ctx) return;

            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const dur = 0.35;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + dur * 0.7);
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + dur);

                gain.gain.setValueAtTime(0.05 * (_masterVolume / 0.08), ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + dur);
            } catch (e) {}
        },

        /**
         * Play harmonic success chord
         */
        playSuccess() {
            if (!_enabled) return;
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord
            freqs.forEach((f, idx) => {
                setTimeout(() => {
                    this.playChirp(f, 0.15, 'sine', 0.025);
                }, idx * 40);
            });
        },

        /**
         * Play warning/anomaly klaxon
         */
        playAlert() {
            if (!_enabled) return;
            this.playChirp(440, 0.1, 'sawtooth', 0.04);
            setTimeout(() => {
                this.playChirp(330, 0.15, 'sawtooth', 0.04);
            }, 120);
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.CyberAudioFX = CyberAudioFX;

})(typeof window !== 'undefined' ? window : global);
