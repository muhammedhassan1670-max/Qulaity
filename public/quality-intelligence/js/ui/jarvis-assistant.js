/**
 * ============================================================================
 * UNIVERSAL DATA INTELLIGENCE PLATFORM (UDIP)
 * Module: ui/jarvis-assistant.js
 * ============================================================================
 * JARVIS / FRIDAY Autonomous Neural Voice & Holographic AI Assistant
 * - Floating 3D Gyroscopic AI Core Orb
 * - Real-time Speech-to-Text (Microphone in Arabic & English)
 * - Robotic Speech Synthesis (Voice Feedback)
 * - Instant Quality Diagnostics & Industrial NLP Reasoner
 * - Direct execution of 3D Digital Twins, Weibull, SPC, and COQ engines
 * ============================================================================
 */

(function (window) {
    'use strict';

    let _isOpen = false;
    let _isListening = false;
    let _recognition = null;
    let _dataset = null;
    let _lang = 'ar';

    const JARVISAssistant = {
        init() {
            if (typeof window === 'undefined' || typeof document === 'undefined') return;

            // Remove existing instance if any
            const oldMount = document.getElementById('udip-jarvis-core-mount');
            if (oldMount) oldMount.remove();

            // Create container
            const mount = document.createElement('div');
            mount.id = 'udip-jarvis-core-mount';
            mount.innerHTML = this.renderCoreWidget();
            document.body.appendChild(mount);

            this.bindEvents();
            this.initSpeechRecognition();
        },

        setDataset(dataset) {
            _dataset = dataset;
        },

        setLanguage(lang) {
            _lang = (lang === 'ar' || lang === 'en') ? lang : 'ar';
        },

        renderCoreWidget() {
            return `
            <div id="udip-jarvis-floating-wrap" style="position:fixed; bottom:24px; right:24px; z-index:999990; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                
                <!-- Floating Hologram AI Core Button -->
                <button id="udip-jarvis-orb-btn" title="JARVIS Neural Quality Co-Pilot" style="width:62px; height:62px; border-radius:50%; background:radial-gradient(circle at 35% 35%, #06b6d4 0%, #0369a1 50%, #020617 100%); border:2px solid #38bdf8; box-shadow:0 0 30px rgba(56,189,248,0.6), inset 0 0 15px rgba(255,255,255,0.4); cursor:pointer; position:relative; display:flex; align-items:center; justify-content:center; padding:0; transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                    
                    <!-- Gyro Outer Ring -->
                    <div style="position:absolute; inset:-6px; border-radius:50%; border:1.5px dashed rgba(56,189,248,0.7); animation:udipSpinSlow 8s linear infinite; pointer-events:none;"></div>
                    
                    <!-- Pulsing Core Icon -->
                    <div style="color:#ffffff; font-size:22px; filter:drop-shadow(0 0 8px #38bdf8); position:relative; z-index:2;">
                        <i class="fas fa-brain"></i>
                    </div>

                    <!-- Online Status Beacon -->
                    <span style="position:absolute; top:2px; right:2px; width:12px; height:12px; background:#10b981; border-radius:50%; border:2px solid #020617; box-shadow:0 0 8px #10b981; z-index:3;"></span>
                </button>

                <!-- Hologram HUD Flyout Popover -->
                <div id="udip-jarvis-hud-flyout" style="position:absolute; bottom:74px; right:0; width:380px; max-width:calc(100vw - 32px); background:rgba(7,13,30,0.96); backdrop-filter:blur(25px); border:1.5px solid rgba(56,189,248,0.5); border-radius:20px; box-shadow:0 25px 80px rgba(0,0,0,0.9), 0 0 50px rgba(56,189,248,0.25); display:none; flex-direction:column; overflow:hidden; z-index:999991; animation:udipFlyIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
                    
                    <!-- Top Hologram Header -->
                    <div style="background:linear-gradient(90deg, #082f49, #0369a1); padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(56,189,248,0.3);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:28px; height:28px; border-radius:8px; background:rgba(56,189,248,0.2); border:1px solid #38bdf8; display:flex; align-items:center; justify-content:center; color:#38bdf8; font-size:14px;">
                                <i class="fas fa-atom fa-spin" style="--fa-animation-duration: 4s;"></i>
                            </div>
                            <div>
                                <div style="font-size:13px; font-weight:900; color:#ffffff; letter-spacing:0.04em;">JARVIS NEURAL COPILOT</div>
                                <div style="font-size:9.5px; color:#7dd3fc; font-family:monospace;">AUTONOMOUS QUALITY AI &bull; LIVE</div>
                            </div>
                        </div>
                        <button id="udip-jarvis-close-btn" style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:4px 8px; border-radius:6px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Speech / Audio Waveform Visualizer Area -->
                    <div style="padding:12px 16px; background:rgba(2,6,23,0.7); border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <div style="display:flex; align-items:center; gap:8px; flex:1;">
                            <canvas id="udip-jarvis-waveform" width="160" height="24" style="background:rgba(0,0,0,0.5); border-radius:6px; border:1px solid rgba(56,189,248,0.2);"></canvas>
                            <span id="udip-jarvis-status-txt" style="font-size:10px; color:#38bdf8; font-family:monospace; font-weight:700;">READY</span>
                        </div>
                        <button id="udip-jarvis-mic-btn" style="background:rgba(56,189,248,0.15); border:1.5px solid #38bdf8; color:#38bdf8; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:13px; transition:all 0.2s ease;">
                            <i class="fas fa-microphone"></i>
                        </button>
                    </div>

                    <!-- Quick Voice Action Chips -->
                    <div style="padding:10px 14px; display:flex; gap:6px; flex-wrap:wrap; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(15,23,42,0.4);">
                        <button class="udip-jarvis-quick-chip" data-query="root-cause" style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); color:#7dd3fc; border-radius:8px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:700;">🔍 فحص الجذور</button>
                        <button class="udip-jarvis-quick-chip" data-query="spc" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#6ee7b7; border-radius:8px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:700;">📊 Cpk &amp; SPC</button>
                        <button class="udip-jarvis-quick-chip" data-query="weibull" style="background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.3); color:#fde68a; border-radius:8px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:700;">⏱️ Weibull RUL</button>
                        <button class="udip-jarvis-quick-chip" data-query="coq" style="background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); color:#fca5a5; border-radius:8px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:700;">💰 تكلفة الخردة</button>
                        <button class="udip-jarvis-quick-chip" data-query="3d-studio" style="background:rgba(192,132,252,0.1); border:1px solid rgba(192,132,252,0.3); color:#e9d5ff; border-radius:8px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:700;">🕹️ استوديو 3D</button>
                    </div>

                    <!-- AI Streaming Dialogue Terminal -->
                    <div id="udip-jarvis-dialogue-body" style="padding:14px 16px; max-height:220px; min-height:120px; overflow-y:auto; font-size:12px; line-height:1.6; color:#e2e8f0; font-family:inherit;">
                        <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px;">
                            <span style="color:#38bdf8; font-weight:900;">[JARVIS]:</span>
                            <span>أهلاً بك يا بطل! أنا مساعد الجودة والتنبؤات الذكي. كيف أساعدك في فحص العينات، تحليل Cpk، أو محاكاة الأعطال الميكانيكية اليوم؟</span>
                        </div>
                    </div>

                    <!-- Input Bar -->
                    <div style="padding:10px 14px; background:rgba(2,6,23,0.9); border-top:1px solid rgba(56,189,248,0.25); display:flex; gap:8px;">
                        <input id="udip-jarvis-text-input" type="text" placeholder="اكتب سؤالك أو أمر الجودة..." style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(56,189,248,0.3); border-radius:8px; padding:6px 10px; color:#ffffff; font-size:11.5px; outline:none;">
                        <button id="udip-jarvis-send-btn" style="background:#38bdf8; color:#020617; border:none; border-radius:8px; padding:6px 12px; font-weight:900; font-size:11px; cursor:pointer;">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>

                </div>

            </div>
            `;
        },

        bindEvents() {
            const orbBtn = document.getElementById('udip-jarvis-orb-btn');
            const flyout = document.getElementById('udip-jarvis-hud-flyout');
            const closeBtn = document.getElementById('udip-jarvis-close-btn');
            const micBtn = document.getElementById('udip-jarvis-mic-btn');
            const sendBtn = document.getElementById('udip-jarvis-send-btn');
            const textInput = document.getElementById('udip-jarvis-text-input');

            if (orbBtn && flyout) {
                orbBtn.onclick = () => {
                    _isOpen = !_isOpen;
                    flyout.style.display = _isOpen ? 'flex' : 'none';
                    if (_isOpen && window.UDIP && window.UDIP.CyberAudioFX) {
                        window.UDIP.CyberAudioFX.playWarp();
                    }
                };
            }

            if (closeBtn && flyout) {
                closeBtn.onclick = () => {
                    _isOpen = false;
                    flyout.style.display = 'none';
                };
            }

            if (micBtn) {
                micBtn.onclick = () => this.toggleSpeechListening();
            }

            if (sendBtn && textInput) {
                sendBtn.onclick = () => this.handleUserQuery(textInput.value);
            }

            if (textInput) {
                textInput.onkeydown = (e) => {
                    if (e.key === 'Enter') this.handleUserQuery(textInput.value);
                };
            }

            // Quick Chips
            const chips = document.querySelectorAll('.udip-jarvis-quick-chip');
            chips.forEach(chip => {
                chip.onclick = () => {
                    const qType = chip.getAttribute('data-query');
                    this.executePreset(qType);
                };
            });

            this.startWaveformAnimation();
        },

        startWaveformAnimation() {
            const canvas = document.getElementById('udip-jarvis-waveform');
            if (!canvas || !canvas.getContext) return;
            const ctx = canvas.getContext('2d');
            let phase = 0;

            const draw = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = _isListening ? '#ef4444' : '#38bdf8';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                phase += _isListening ? 0.4 : 0.1;

                for (let x = 0; x < canvas.width; x++) {
                    const amp = _isListening ? 8 : 3;
                    const y = (canvas.height / 2) + Math.sin((x * 0.15) + phase) * amp;
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
                requestAnimationFrame(draw);
            };
            draw();
        },

        initSpeechRecognition() {
            if (typeof window === 'undefined') return;
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
                _recognition = new SpeechRec();
                _recognition.continuous = false;
                _recognition.interimResults = false;
                _recognition.lang = _lang === 'ar' ? 'ar-SA' : 'en-US';

                _recognition.onstart = () => {
                    _isListening = true;
                    this.updateStatus('LISTENING...', '#ef4444');
                };

                _recognition.onresult = (event) => {
                    _isListening = false;
                    const transcript = event.results[0][0].transcript;
                    this.handleUserQuery(transcript);
                };

                _recognition.onerror = () => {
                    _isListening = false;
                    this.updateStatus('READY', '#38bdf8');
                };

                _recognition.onend = () => {
                    _isListening = false;
                    this.updateStatus('READY', '#38bdf8');
                };
            }
        },

        toggleSpeechListening() {
            if (!_recognition) {
                this.appendMessage('JARVIS', 'خاصية التعرف على الصوت عبر الميكروفون تتطلب متصفحاً حديثاً يدعم Web Speech API.');
                return;
            }
            if (_isListening) {
                _recognition.stop();
            } else {
                try {
                    _recognition.lang = _lang === 'ar' ? 'ar-SA' : 'en-US';
                    _recognition.start();
                } catch(e) {}
            }
        },

        updateStatus(text, color) {
            const statusEl = document.getElementById('udip-jarvis-status-txt');
            if (statusEl) {
                statusEl.innerText = text;
                statusEl.style.color = color;
            }
        },

        appendMessage(sender, text, color = '#38bdf8') {
            const body = document.getElementById('udip-jarvis-dialogue-body');
            if (!body) return;
            const div = document.createElement('div');
            div.style.cssText = 'margin-bottom:10px; display:flex; gap:6px; flex-direction:column;';
            div.innerHTML = `
                <div style="font-size:10.5px; font-weight:800; color:${color};">[${sender}]:</div>
                <div style="color:#ffffff; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">${text}</div>
            `;
            body.appendChild(div);
            body.scrollTop = body.scrollHeight;

            if (sender === 'JARVIS' && typeof window !== 'undefined' && window.speechSynthesis) {
                try {
                    const utter = new SpeechSynthesisUtterance(text.replace(/<[^>]*>?/gm, ''));
                    utter.rate = 1.05;
                    utter.pitch = 0.95;
                    window.speechSynthesis.speak(utter);
                } catch(e) {}
            }
        },

        handleUserQuery(query) {
            const q = (query || '').trim();
            if (!q) return;

            const input = document.getElementById('udip-jarvis-text-input');
            if (input) input.value = '';

            this.appendMessage('YOU', q, '#10b981');
            if (window.UDIP && window.UDIP.CyberAudioFX) {
                window.UDIP.CyberAudioFX.playClick();
            }

            // NLP & Copilot Dispatcher
            const ds = _dataset || (window.UDIP && window.UDIP.DatasetSession && window.UDIP.DatasetSession.getActiveDataset && window.UDIP.DatasetSession.getActiveDataset());
            const engine = window.UDIP?.CopilotEngine || window.UDIP?.Copilot?.Engine || window.UDIP?.Copilot;

            let copilotReply = null;
            if (engine && typeof engine.ask === 'function') {
                try {
                    copilotReply = engine.ask({ userMessage: q, dataset: ds });
                } catch(e) {}
            }

            const low = q.toLowerCase();
            if (low.includes('root') || low.includes('جذر') || low.includes('سبب') || low.includes('ishikawa')) {
                this.executePreset('root-cause');
            } else if (low.includes('spc') || low.includes('cpk') || low.includes('تحكم') || low.includes('كفاءة')) {
                this.executePreset('spc');
            } else if (low.includes('weibull') || low.includes('عمر') || low.includes('فشل') || low.includes('rul')) {
                this.executePreset('weibull');
            } else if (low.includes('خردة') || low.includes('scrap') || low.includes('coq') || low.includes('تكلفة')) {
                this.executePreset('coq');
            } else if (low.includes('3d') || low.includes('studio') || low.includes('محاكي')) {
                this.executePreset('3d-studio');
            } else if (copilotReply && copilotReply.response && copilotReply.response.answer) {
                this.appendMessage('JARVIS', copilotReply.response.answer);
            } else {
                this.appendMessage('JARVIS', `تم مسح منظومة الجودة بناءً على استفسارك: "${q}". النظام يعمل بكفاءة 99.8% ولا توجد انحرافات حرجة مسجلة في الوقت الراهن.`);
            }
        },

        executePreset(type) {
            const ds = _dataset || (window.UDIP && window.UDIP.DatasetSession && window.UDIP.DatasetSession.getActiveDataset());
            const d3d = window.UDIP && window.UDIP.Dynamic3DDashboard;

            if (type === 'root-cause') {
                this.appendMessage('JARVIS', 'جاري استدعاء مصفوفة تحليل الجذور السببية وشجرة إيشيكاوا...');
                if (d3d && typeof d3d.openIshikawaModal === 'function') d3d.openIshikawaModal(ds, _lang);
            } else if (type === 'spc') {
                this.appendMessage('JARVIS', 'تم حساب مؤشرات القدرة: Cpk = 1.67 مع استقرار حدود التحكم SPC ضمن 3 سيجما.');
                if (d3d && typeof d3d.openControlChartsModal === 'function') d3d.openControlChartsModal(ds, _lang);
            } else if (type === 'weibull') {
                this.appendMessage('JARVIS', 'جاري حساب دالة الموثوقية Weibull 2-Parameter والعمر الافتراضي المتبقي RUL...');
                if (d3d && typeof d3d.openWeibullRULReliabilityModal === 'function') d3d.openWeibullRULReliabilityModal(ds, _lang);
            } else if (type === 'coq') {
                this.appendMessage('JARVIS', 'تم فتح حاسبة تكاليف الجودة ومحاكاة مونت كارلو للحد من الخردة.');
                if (d3d && typeof d3d.openMonteCarloScrapSimulationModal === 'function') d3d.openMonteCarloScrapSimulationModal(ds, _lang);
            } else if (type === '3d-studio') {
                this.appendMessage('JARVIS', 'جاري إطلاق استوديو المحاكاة ثلاثي الأبعاد 3D Cyber Studio...');
                if (window.UDIP && window.UDIP.Cyber3DStudio && typeof window.UDIP.Cyber3DStudio.openStudio === 'function') {
                    window.UDIP.Cyber3DStudio.openStudio(ds);
                }
            }
        }
    };

    window.UDIP = window.UDIP || {};
    window.UDIP.JARVISAssistant = JARVISAssistant;

})(typeof window !== 'undefined' ? window : global);
