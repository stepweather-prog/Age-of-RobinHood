// ============================================================
//  ROBINHOOD-UI.JS - Полный файл
//  UI мессенджера с интеграцией игры
// ============================================================

let contacts = [],
    activeChannelId = null,
    activePeerId = null,
    selectedAvatar = 'icons/01icon.png';
let toggleSoundState = true,
    toggleAnimations = true,
    selfDestructMode = false;
let audioPool = {},
    robinDefaultText = 'Святые сокеты стабильны!',
    robinTimer = null;
let voiceRecorder = null,
    voiceChunks = [],
    voiceStream = null,
    voiceRecording = false,
    voiceSeconds = 0,
    voiceTimerInterval = null,
    voiceRecTimeout = null;
let archerAnimation, quiverAnim, bowAnim, currentArrowContainer;
let deferredPrompt = null;
let verificationModalShown = false,
    verificationDone = false;

let selfDestructBatchSize = 2,
    selfDestructIntervalTime = 40000,
    selfDestructIntervalId = null;

const videoBackgrounds = [
    { type: 'image', src: 'assets/icons/background.webp', name: 'Статика' },
    { type: 'video', src: 'assets/icons/background.webm', name: 'Неон' },
    { type: 'video', src: 'assets/icons/background2.webm', name: 'Робин' },
    { type: 'video', src: 'assets/icons/background3.webm', name: 'Листва' },
];

let currentBgIndex = 0;

const MAX_CHAT_MESSAGES = 100;
const avatarList = ['002','004','006','007','023','025','028','031','033','037','045','051','053','056','057','059','062','064','066','075','076','080','082','092','094','097','098','110','112','114','119','128','129','132','146','150','153','154','156','159','161','166','167'];
const avatars = avatarList.map(id => 'assets/avatar/' + id + 'ava.png');

function isMobile() {
    return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent) || window.innerWidth < 768;
}

function throttle(fn, delay) { let last = 0; return function(...args) { const now = Date.now(); if (now - last >= delay) { last = now; fn.apply(this, args); } }; }

function safeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function rMsg(t, d = 4000) {
    const rt = document.getElementById('robin-text');
    if (!rt) return;
    clearTimeout(robinTimer);
    rt.textContent = t;
    if (d > 0) robinTimer = setTimeout(() => { rt.textContent = robinDefaultText; }, d);
}

function setConnectionStatus(s) {
    const ic = document.getElementById('connection-icon');
    if (ic) ic.src = s === 'online' ? 'assets/icons/06icon.png' : 'assets/icons/05icon.png';
}

function playSound(f) {
    if (!toggleSoundState) return;
    if (!audioPool[f]) {
        audioPool[f] = new Audio('assets/sounds/' + f);
        audioPool[f].volume = 0.5;
        audioPool[f].preload = 'auto';
    }
    const a = audioPool[f];
    a.currentTime = 0;
    a.play().catch(e => {});
}

function closeSheets() {
    document.getElementById('avatar-selector')?.classList.remove('show');
    document.getElementById('settings-sheet')?.classList.remove('open');
    document.getElementById('overlay')?.classList.remove('show');
}

function playSmokeAnimation() {
    if (!toggleAnimations) return;
    const smoke = document.createElement('div');
    smoke.className = 'smoke-anim';
    document.body.appendChild(smoke);
    if (typeof lottie !== 'undefined') {
        try {
            lottie.loadAnimation({
                container: smoke,
                renderer: 'canvas',
                loop: false,
                autoplay: true,
                path: 'assets/smoke.json'
            });
        } catch (e) {}
    }
    setTimeout(() => {
        if (smoke.parentNode) smoke.remove();
    }, 5000);
}

function playArcherAnimation() {
    if (!toggleAnimations) return;
    const rt = document.getElementById('robin-text');
    if (!rt) return;
    if (currentArrowContainer?.parentNode) currentArrowContainer.remove();
    if (archerAnimation) { archerAnimation.destroy(); archerAnimation = null; }
    
    const wrapper = document.createElement('span');
    wrapper.className = 'robin-arrow-container';
    wrapper.style.cssText = 'width:120px;height:60px;display:inline-block;vertical-align:middle;';
    currentArrowContainer = wrapper;
    rt.textContent = '';
    rt.appendChild(wrapper);
    
    if (typeof lottie !== 'undefined') {
        try {
            archerAnimation = lottie.loadAnimation({
                container: wrapper,
                renderer: 'canvas',
                loop: false,
                autoplay: true,
                path: 'assets/Archer.json'
            });
            archerAnimation.addEventListener('complete', () => {
                if (wrapper.parentNode) wrapper.remove();
                currentArrowContainer = null;
                archerAnimation = null;
                rt.textContent = robinDefaultText;
            });
        } catch (e) {
            wrapper.textContent = '🏹';
            wrapper.style.fontSize = '40px';
            setTimeout(() => {
                if (wrapper.parentNode) wrapper.remove();
                currentArrowContainer = null;
                rt.textContent = robinDefaultText;
            }, 1500);
        }
    } else {
        wrapper.textContent = '🏹';
        wrapper.style.fontSize = '40px';
        setTimeout(() => {
            if (wrapper.parentNode) wrapper.remove();
            currentArrowContainer = null;
            rt.textContent = robinDefaultText;
        }, 1500);
    }
}

function playQuiverAnimation() {
    if (!toggleAnimations) return;
    const quiver = document.createElement('div');
    quiver.className = 'quiver-anim';
    const img = document.createElement('img');
    img.src = 'assets/docking.gif?t=' + Date.now();
    img.style.cssText = 'width:min(200px,40vw);height:min(200px,40vw);object-fit:contain;filter:drop-shadow(0 0 20px rgba(255,215,0,0.8));';
    img.loading = 'lazy';
    img.onerror = () => {
        quiver.innerHTML = '<div style="font-size:min(120px,25vw);animation:quiverPulse 0.5s ease-in-out 7;">🏹</div>';
    };
    quiver.appendChild(img);
    document.body.appendChild(quiver);
    setTimeout(() => {
        quiver.style.opacity = '0';
        quiver.style.transition = 'opacity 0.5s ease';
        setTimeout(() => quiver.remove(), 500);
    }, 3500);
}

function showInput(title, placeholder = '') {
    return new Promise((resolve) => {
        document.getElementById('input-modal-title').textContent = title;
        document.getElementById('input-modal-field').value = '';
        document.getElementById('input-modal-field').placeholder = placeholder;
        document.getElementById('input-modal')?.classList.add('active');
        
        const ok = () => {
            const val = document.getElementById('input-modal-field').value.trim();
            document.getElementById('input-modal')?.classList.remove('active');
            cleanup();
            resolve(val);
        };
        const cancel = () => {
            document.getElementById('input-modal')?.classList.remove('active');
            cleanup();
            resolve(null);
        };
        const cleanup = () => {
            document.getElementById('input-modal-ok').removeEventListener('click', ok);
            document.getElementById('input-modal-cancel').removeEventListener('click', cancel);
            document.getElementById('input-modal-field').removeEventListener('keypress', onKey);
        };
        const onKey = (e) => {
            if (e.key === 'Enter') ok();
        };
        
        document.getElementById('input-modal-ok').addEventListener('click', ok);
        document.getElementById('input-modal-cancel').addEventListener('click', cancel);
        document.getElementById('input-modal-field').addEventListener('keypress', onKey);
        document.getElementById('input-modal-field').focus();
    });
}

function showConfirm(title, text) {
    return new Promise((resolve) => {
        document.getElementById('confirm-modal-title').textContent = title;
        document.getElementById('confirm-modal-text').textContent = text;
        document.getElementById('confirm-modal')?.classList.add('active');
        
        const yes = () => {
            document.getElementById('confirm-modal')?.classList.remove('active');
            cleanup();
            resolve(true);
        };
        const no = () => {
            document.getElementById('confirm-modal')?.classList.remove('active');
            cleanup();
            resolve(false);
        };
        const cleanup = () => {
            document.getElementById('confirm-modal-yes').removeEventListener('click', yes);
            document.getElementById('confirm-modal-no').removeEventListener('click', no);
        };
        
        document.getElementById('confirm-modal-yes').addEventListener('click', yes);
        document.getElementById('confirm-modal-no').addEventListener('click', no);
    });
}

function startSelfDestruct() {
    stopSelfDestruct();
    selfDestructIntervalId = setInterval(() => {
        const box = document.getElementById('chat-box');
        if (!box) return;
        const allMessages = box.querySelectorAll('.message-row');
        const totalMessages = allMessages.length;
        if (totalMessages === 0) { stopSelfDestruct(); return; }
        
        const deleteCount = Math.min(selfDestructBatchSize, totalMessages);
        const startIndex = totalMessages - deleteCount;
        
        for (let i = startIndex; i < totalMessages; i++) {
            const el = allMessages[i];
            if (el && el.parentNode) {
                const msgId = el.dataset.msgId;
                if (msgId && P2PPong._dedupTimers) {
                    for (const key in P2PPong._dedupTimers) {
                        if (key.includes(msgId)) {
                            clearTimeout(P2PPong._dedupTimers[key]);
                            delete P2PPong._dedupTimers[key];
                        }
                    }
                }
                el.style.transition = 'opacity 0.5s';
                el.style.opacity = '0';
                setTimeout(() => {
                    if (el.parentNode) el.remove();
                }, 500);
            }
        }
        if (box.querySelectorAll('.message-row').length === 0) stopSelfDestruct();
    }, selfDestructIntervalTime);
    
    const rb = document.getElementById('robin-bar');
    if (rb && !document.getElementById('robin-leaves')) {
        const leavesDiv = document.createElement('div');
        leavesDiv.id = 'robin-leaves';
        leavesDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;border-radius:14px;z-index:0;';
        const emojis = ['🍁','🍂','🌿','🍃'];
        for (let i = 0; i < 5; i++) {
            const leaf = document.createElement('span');
            leaf.textContent = emojis[i % emojis.length];
            leaf.style.cssText = `position:absolute;top:-20px;left:${Math.random()*90}%;font-size:14px;animation:robinLeafFall ${2+Math.random()*3}s linear infinite;animation-delay:${Math.random()*2}s;opacity:0.8;`;
            leavesDiv.appendChild(leaf);
        }
        rb.style.position = 'relative';
        rb.appendChild(leavesDiv);
    }
}

function stopSelfDestruct() {
    if (selfDestructIntervalId) {
        clearInterval(selfDestructIntervalId);
        selfDestructIntervalId = null;
    }
    if (P2PPong._dedupTimers) {
        for (const key in P2PPong._dedupTimers) {
            clearTimeout(P2PPong._dedupTimers[key]);
        }
        P2PPong._dedupTimers = {};
    }
    if (activeChannelId && P2PPong._channels[activeChannelId]) {
        P2PPong._channels[activeChannelId].blobs = [];
    }
    const rl = document.getElementById('robin-leaves');
    if (rl) rl.remove();
}

function showVoiceRecordingUI(show) {
    const old = document.getElementById('voice-recording-indicator');
    if (old) old.remove();
    if (!show) return;
    
    const btn = document.getElementById('btn-voice-input');
    if (!btn) return;
    
    const container = document.createElement('div');
    container.id = 'voice-recording-indicator';
    container.className = 'voice-recording-indicator';
    
    const timer = document.createElement('span');
    timer.className = 'voice-timer-text';
    timer.id = 'voice-timer-text';
    timer.textContent = '🎤 0:00';
    
    const wave = document.createElement('div');
    wave.style.cssText = 'display:flex;align-items:flex-end;gap:2px;height:18px;';
    for (let i = 0; i < 4; i++) {
        const bar = document.createElement('div');
        bar.className = 'voice-wave-bar';
        bar.style.cssText = `width:3px;animation:voiceWaveAnim 0.5s ease-in-out infinite;animation-delay:${i * 0.1}s;height:${6 + i * 3}px;`;
        wave.appendChild(bar);
    }
    
    container.appendChild(timer);
    container.appendChild(wave);
    btn.parentNode.insertBefore(container, btn);
}

function startVoiceTimer() {
    voiceSeconds = 0;
    const vt = document.getElementById('voice-timer-text');
    if (vt) vt.textContent = '🎤 0:00';
    
    voiceTimerInterval = setInterval(() => {
        voiceSeconds++;
        const m = Math.floor(voiceSeconds / 60);
        const s = (voiceSeconds % 60).toString().padStart(2, '0');
        const vt = document.getElementById('voice-timer-text');
        if (vt) vt.textContent = '🎤 ' + m + ':' + s;
    }, 1000);
}

function stopVoiceTimer() {
    if (voiceTimerInterval) clearInterval(voiceTimerInterval);
}

function toggleVoiceRecording() {
    voiceRecording ? stopVoiceRecording() : startVoiceRecording();
}

function startVoiceRecording() {
    if (voiceRecorder?.state === 'recording') return;
    
    const audioBits = isMobile() ? 8000 : 16000;
    
    navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
    }).then(st => {
        voiceStream = st;
        voiceRecorder = new MediaRecorder(st, {
            mimeType: 'audio/webm; codecs=opus',
            audioBitsPerSecond: audioBits
        });
        voiceChunks = [];
        
        voiceRecorder.ondataavailable = e => voiceChunks.push(e.data);
        voiceRecorder.onstop = () => {
            if (voiceRecTimeout) clearTimeout(voiceRecTimeout);
            const blob = new Blob(voiceChunks, { type: 'audio/webm' });
            if (blob.size > 100 && blob.size < 500000 && activeChannelId) {
                const reader = new FileReader();
                reader.onload = async () => {
                    const b64 = reader.result.split(',')[1];
                    await P2PPong.sendVoiceMessage(activeChannelId, b64);
                    playSound('open.mp3');
                    appendMessage('Вы', '🎤 Голосовое', selectedAvatar, b64, 'audio/webm');
                };
                reader.readAsDataURL(blob);
            }
            if (voiceStream) {
                voiceStream.getTracks().forEach(t => t.stop());
                voiceStream = null;
            }
            voiceRecorder = null;
            voiceRecording = false;
            stopVoiceTimer();
            document.getElementById('btn-voice-input').style.background = '';
            showVoiceRecordingUI(false);
        };
        
        voiceRecorder.start();
        voiceRecording = true;
        startVoiceTimer();
        document.getElementById('btn-voice-input').style.background = '#f44336';
        showVoiceRecordingUI(true);
        
        voiceRecTimeout = setTimeout(() => {
            if (voiceRecorder?.state === 'recording') {
                voiceRecorder.stop();
                rMsg('⏰ Максимальная длина записи — 10 секунд', 3000);
            }
        }, 10000);
    }).catch(e => {
        voiceChunks = [];
        rMsg('❌ Микрофон недоступен или занят', 3000);
    });
}

function stopVoiceRecording() {
    if (voiceRecorder?.state === 'recording') voiceRecorder.stop();
}

function playVoiceBlob(b64) {
    const a = new Audio('data:audio/webm;base64,' + b64);
    a.load();
    a.play().catch(e => {});
}

function appendMessage(sender, text, avatarSrc, audioData, audioMime) {
    const box = document.getElementById('chat-box');
    const row = document.createElement('div');
    row.className = 'message-row';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const av = getAvatarUrl(avatarSrc);
    const safeSender = safeHtml(sender);
    
    if (audioData && audioMime && audioMime.startsWith('audio/')) {
        const player = createAudioPlayer(audioData, audioMime);
        row.innerHTML = `<img src="${av}" class="avatar" onerror="this.src='assets/icons/01icon.png'" loading="lazy"><div class="msg-body"><div class="msg-sender">${safeSender}</div></div>`;
        row.querySelector('.msg-body').appendChild(player);
        const ts = document.createElement('div');
        ts.className = 'msg-status';
        ts.textContent = time;
        row.querySelector('.msg-body').appendChild(ts);
    } else {
        row.innerHTML = `<img src="${av}" class="avatar" onerror="this.src='assets/icons/01icon.png'" loading="lazy"><div class="msg-body"><div class="msg-sender">${safeSender}</div><div style="word-break:break-word;white-space:pre-wrap;">${safeHtml(text)}</div><div class="msg-status">${time}</div></div>`;
    }
    
    const msgId = 'msg_' + Date.now() + Math.random();
    row.dataset.msgId = msgId;
    box.insertBefore(row, document.getElementById('typing-indicator'));
    
    const allRows = box.querySelectorAll('.message-row');
    while (allRows.length > MAX_CHAT_MESSAGES) {
        const firstRow = allRows[0];
        if (firstRow && firstRow.parentNode) firstRow.remove();
    }
    box.scrollTop = box.scrollHeight;
}

function createAudioPlayer(audioData, audioMime) {
    const container = document.createElement('div');
    container.className = 'audio-player audio-paused';
    const audio = new Audio('data:' + audioMime + ';base64,' + audioData);
    audio.load();
    
    let isPlaying = false;
    const playBtn = document.createElement('button');
    playBtn.className = 'audio-play-btn';
    playBtn.textContent = '▶';
    
    const waveDiv = document.createElement('div');
    waveDiv.className = 'audio-wave';
    for (let i = 0; i < 4; i++) {
        const bar = document.createElement('div');
        bar.className = 'audio-wave-bar';
        waveDiv.appendChild(bar);
    }
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'audio-time';
    timeSpan.textContent = '0:00';
    
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            container.classList.remove('audio-playing');
            container.classList.add('audio-paused');
            playBtn.textContent = '▶';
        } else {
            audio.play();
            container.classList.remove('audio-paused');
            container.classList.add('audio-playing');
            playBtn.textContent = '⏸';
        }
        isPlaying = !isPlaying;
    });
    
    audio.addEventListener('timeupdate', () => {
        const m = Math.floor(audio.currentTime / 60);
        const s = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        timeSpan.textContent = m + ':' + s;
    });
    
    audio.addEventListener('ended', () => {
        container.classList.remove('audio-playing');
        container.classList.add('audio-paused');
        playBtn.textContent = '▶';
        isPlaying = false;
    });
    
    container.appendChild(playBtn);
    container.appendChild(waveDiv);
    container.appendChild(timeSpan);
    return container;
}

function showChatForChannel(channelId) {
    activeChannelId = channelId;
    const box = document.getElementById('chat-box');
    box.innerHTML = '<div class="typing-indicator" id="typing-indicator"></div>';
    
    const ch = P2PPong._channels[channelId];
    if (ch && ch.blobs) {
        ch.blobs.forEach(b => {
            const im = b.from === 'me';
            appendMessage(im ? 'Вы' : 'Лучник', b.d || b.text || '', im ? selectedAvatar : 'icons/01icon.png');
        });
    }
}

function getAvatarUrl(avatarSrc) {
    if (!avatarSrc || avatarSrc === 'icons/01icon.png') return 'assets/icons/01icon.png';
    if (avatarSrc === '001') return 'assets/avatar/001ava.png';
    if (avatarSrc.startsWith('assets/')) return avatarSrc.endsWith('.png') ? avatarSrc : avatarSrc + 'ava.png';
    if (avatarSrc.includes('/')) return avatarSrc.endsWith('.png') ? avatarSrc : avatarSrc + 'ava.png';
    return 'assets/avatar/' + avatarSrc + 'ava.png';
}

function addContact(c) {
    if (!contacts.find(x => x.peerId === c.peerId)) {
        contacts.push(c);
    } else {
        const existing = contacts.find(x => x.peerId === c.peerId);
        if (c.name && c.name !== 'Лучник') existing.name = c.name;
        if (c.avatar && c.avatar !== '001') existing.avatar = c.avatar;
        if (c.channelId) existing.channelId = c.channelId;
    }
}

const themes = [
    { id: 'forest', name: 'Лес' },
    { id: 'sunset', name: 'Закат' },
    { id: 'ocean', name: 'Океан' },
    { id: 'rose', name: 'Роза' },
    { id: 'amber', name: 'Янтарь' },
    { id: 'mint', name: 'Мята' },
    { id: 'lavender', name: 'Лаванда' },
    { id: 'cherry', name: 'Вишня' },
    { id: 'emerald', name: 'Изумруд' },
    { id: 'slate', name: 'Сланец' },
    { id: 'coral', name: 'Коралл' },
    { id: 'plum', name: 'Слива' }
];

function applyTheme(id) {
    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem('robinhood_theme', id); } catch (e) {}
    const tn = document.getElementById('theme-name');
    if (tn) tn.textContent = (themes.find(t => t.id === id) || themes[0]).name;
}

function generateRandomTheme() {
    const hue = Math.floor(Math.random() * 360);
    const sat = 40 + Math.floor(Math.random() * 50);
    const bgLight = 5 + Math.floor(Math.random() * 15);
    const bgDark = 2 + Math.floor(Math.random() * 8);
    const id = 'random_' + Date.now();
    
    function hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    
    const accentHue = (hue + 30) % 360;
    const [bgR, bgG, bgB] = hslToRgb(hue / 360, sat / 100, bgLight / 100);
    const [bg2R, bg2G, bg2B] = hslToRgb(hue / 360, (sat - 10) / 100, bgDark / 100);
    const [accentR, accentG, accentB] = hslToRgb(accentHue / 360, (sat + 10) / 100, 50 / 100);
    const [accentLR, accentLG, accentLB] = hslToRgb(accentHue / 360, (sat + 20) / 100, 70 / 100);
    
    const s = `[data-theme="${id}"]{
        --bg-primary: hsl(${hue},${sat}%,${bgLight}%);
        --bg-primary-rgb: ${bgR}, ${bgG}, ${bgB};
        --bg-secondary: hsl(${hue},${sat-10}%,${bgDark}%);
        --bg-secondary-rgb: ${bg2R}, ${bg2G}, ${bg2B};
        --accent: hsl(${accentHue},${sat+10}%,50%);
        --accent-rgb: ${accentR}, ${accentG}, ${accentB};
        --accent-light: hsl(${accentHue},${sat+20}%,70%);
        --accent-light-rgb: ${accentLR}, ${accentLG}, ${accentLB};
        --text: hsl(${hue},20%,85%);
        --text-bright: hsl(${hue},25%,92%);
        --text-dim: hsl(${hue},15%,60%);
        --border: hsl(${accentHue},${sat+10}%,50%);
        --btn-bg: hsla(${accentHue},${sat+10}%,50%,0.1);
        --btn-border: hsla(${accentHue},${sat+10}%,50%,0.3);
        --btn-hover: hsla(${accentHue},${sat+10}%,50%,0.25);
        --input-bg: hsla(${hue},${sat-10}%,${bgLight+2}%,0.9);
        --input-text: hsl(${hue},20%,85%);
        --robin-accent: hsl(${accentHue},${sat+20}%,65%);
        --overlay-bg: rgba(0,0,0,0.6);
        --call-bg: linear-gradient(180deg,hsl(${hue},${sat}%,${bgLight}%)0%,hsl(${hue},${sat-10}%,${bgDark}%)100%);
    }`;
    
    let el = document.getElementById('gen-theme');
    if (!el) {
        el = document.createElement('style');
        el.id = 'gen-theme';
        document.head.appendChild(el);
    }
    el.textContent = s;
    document.documentElement.setAttribute('data-theme', id);
    const tn = document.getElementById('theme-name');
    if (tn) tn.textContent = 'Авто';
    try { localStorage.setItem('robinhood_theme', id); } catch (e) {}
}

function applyBackground(index) {
    const vbg = document.querySelector('.video-bg');
    if (!vbg) return;
    
    const bg = videoBackgrounds[index];
    document.getElementById('videobg-name').textContent = bg.name;
    
    if (bg.type === 'image') {
        vbg.pause();
        vbg.removeAttribute('src');
        vbg.querySelector('source')?.removeAttribute('src');
        vbg.load();
        
        vbg.style.backgroundImage = `url('${bg.src}')`;
        vbg.style.backgroundSize = 'cover';
        vbg.style.backgroundPosition = 'center';
        vbg.style.display = 'block';
        vbg.style.opacity = '1';
    } else {
        vbg.style.backgroundImage = '';
        vbg.style.backgroundSize = '';
        vbg.style.backgroundPosition = '';
        
        vbg.querySelector('source').src = bg.src;
        vbg.load();
        vbg.play();
        vbg.style.display = '';
        vbg.style.opacity = '0.35';
    }
}

function cycleBackground() {
    currentBgIndex = (currentBgIndex + 1) % videoBackgrounds.length;
    applyBackground(currentBgIndex);
}

function loadAvatars() {
    const list = document.getElementById('avatar-list');
    if (!list) return;
    list.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    avatars.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'avatar-option';
        img.loading = 'lazy';
        img.onerror = () => img.src = 'assets/icons/01icon.png';
        img.onclick = () => {
            const pas = document.getElementById('profile-avatar-small');
            if (pas) pas.src = src;
            document.getElementById('robin-avatar').src = src;
            selectedAvatar = src.includes('/') ? src.split('/').pop()?.replace('ava.png', '') || 'icons/01icon.png' : src;
            try { localStorage.setItem('robinhood_avatar', src); } catch (e) {}
            const savedNick = document.getElementById('nick-label')?.textContent || 'Лучник';
            P2PPong.setMyProfile(savedNick, selectedAvatar);
            closeSheets();
            rMsg('🖼 Аватар обновлён');
        };
        fragment.appendChild(img);
    });
    list.appendChild(fragment);
}

async function performDestruction(channelId, source = 'local') {
    playSmokeAnimation();
    playSound('clear cache.mp3');
    const msg = '👀 Робин Гуд пустил все письма на самокрутки!';
    rMsg(msg, 5000);
    const delay = source === 'local' ? 6000 : 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (P2PPong._webRTC[channelId]) {
        try { P2PPong._webRTC[channelId].pc.close(); } catch(e) {}
        delete P2PPong._webRTC[channelId];
    }
    P2PPong._stopMsgPoll(channelId);
    P2PPong._stopWebRTCPoll(channelId);
    delete P2PPong._channels[channelId];
    for (const key in P2PPong._dedupTimers) {
        if (key.startsWith(channelId + '_')) {
            clearTimeout(P2PPong._dedupTimers[key]);
            delete P2PPong._dedupTimers[key];
        }
    }
    contacts = [];
    resetChatUI();
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    if (window.indexedDB) {
        indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name))).catch(() => {});
    }
    P2PPong._emit('channel-destroyed', { channelId, source });
    await P2PPong.destroy();
    window.location.reload(true);
}

function resetChatUI() {
    activeChannelId = null;
    activePeerId = null;
    document.getElementById('robin-bar-sender').textContent = 'RobinHood P2P';
    document.getElementById('chat-box').innerHTML = '<div class="typing-indicator" id="typing-indicator"></div>';
    contacts = [];
}

// ===== ИНИЦИАЛИЗАЦИЯ UI =====

function initUI() {
    P2PPong.on('ready', () => {
        setConnectionStatus('online');
        rMsg('🏹 Святые сокеты стабильны!', 0);
    });
    P2PPong.on('state-change', (data) => {
        if (data.state === 'online') setConnectionStatus('online');
        else if (data.state === 'offline') setConnectionStatus('offline');
    });
    P2PPong.on('peer-connected', () => {
        rMsg('🔗 Прямой канал установлен', 3000);
    });
    P2PPong.on('message-received', (data) => {
        handleIncomingMessage(data);
    });
    
    P2PPong.on('beacon-taken', () => {
        rMsg('👀 Метку забрали...', 3000);
    });
    
    P2PPong.on('verification-needed', (data) => {
        if (verificationModalShown) return;
        verificationModalShown = true;
        verificationDone = false;
        window._verifyCode = data.code || P2PPong.getVerificationCode();
        window._verifyInput = '';
        
        document.getElementById('verify-instruction').textContent = 'Введи 7-значный код';
        document.getElementById('verify-error').style.display = 'none';
        document.getElementById('verify-code-display').textContent = '_______';
        
        const grid = document.getElementById('verify-code-grid');
        grid.innerHTML = '';
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:240px;margin:12px auto;';
        
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = 'lock-num';
            btn.style.cssText = 'width:65px;height:65px;font-size:1.8em;';
            btn.onclick = () => addVerifyDigit(i.toString());
            grid.appendChild(btn);
        }
        const btn0 = document.createElement('button');
        btn0.textContent = '0';
        btn0.className = 'lock-num';
        btn0.style.cssText = 'width:65px;height:65px;font-size:1.8em;';
        btn0.onclick = () => addVerifyDigit('0');
        grid.appendChild(btn0);
        
        const btnDel = document.createElement('button');
        btnDel.textContent = '⌫';
        btnDel.className = 'lock-num';
        btnDel.style.cssText = 'width:65px;height:65px;font-size:1.5em;background:rgba(244,67,54,0.3);';
        btnDel.onclick = () => {
            window._verifyInput = window._verifyInput.slice(0, -1);
            document.getElementById('verify-code-display').textContent = window._verifyInput.padEnd(7, '_');
        };
        grid.appendChild(btnDel);
        
        document.getElementById('btn-verify-reset').onclick = () => {
    window._verifyInput = '';
    document.getElementById('verify-code-display').textContent = '_______';
    document.getElementById('verify-error').style.display = 'none';
};

document.getElementById('btn-verify-confirm').onclick = () => {
    if (window._verifyInput === window._verifyCode) {
        document.getElementById('verify-modal').classList.remove('active');
        verificationDone = true;
        P2PPong.confirmVerification();
        rMsg('✅ Код подтверждён! Канал открыт', 3000);
    } else {
        document.getElementById('verify-error').style.display = 'block';
        document.getElementById('verify-error').textContent = 'Неверный код';
        window._verifyInput = '';
        document.getElementById('verify-code-display').textContent = '_______';
    }
};

document.getElementById('verify-modal').classList.add('active');
});

function addVerifyDigit(d) {
    if (window._verifyInput.length >= 7) return;
    window._verifyInput += d;
    document.getElementById('verify-code-display').textContent = window._verifyInput.padEnd(7, '_');
    document.getElementById('verify-error').style.display = 'none';
    
    if (window._verifyInput.length === 7) {
        setTimeout(() => {
            document.getElementById('btn-verify-confirm').click();
        }, 300);
    }
}

P2PPong.on('channel-opened', (data) => {
    const ch = P2PPong._channels[data.channelId];
    if (ch) {
        ch.nick = data.nick || 'Лучник';
        ch.avatar = data.avatar || '001';
    }
    activeChannelId = data.channelId;
    document.getElementById('robin-bar-sender').textContent = data.nick || 'Лучник';
    document.getElementById('chat-box').innerHTML = '<div class="typing-indicator" id="typing-indicator"></div>';
    rMsg('🏹 Канал открыт! Можно общаться', 3000);
    playSound('open.mp3');
});

P2PPong.on('channel-destroyed', (data) => {
    resetChatUI();
    rMsg('💨 Канал уничтожен', 3000);
});

P2PPong.on('channel-expired', () => {
    resetChatUI();
    rMsg('⏳ Канал истек', 3000);
});

P2PPong.on('peer-id-generated', (data) => {
    document.getElementById('my-peer-id').textContent = data.peerId || '_______';
    document.getElementById('my-beacon-id').textContent = data.beaconId || '_______';
    document.getElementById('beacon-code').textContent = data.code || '_______';
});

// ===== GAME INTEGRATION =====
P2PPong.on('game-action', (data) => {
    if (data.verified && window.gameInstance) {
        window.gameInstance.handleGameAction(data);
    }
});

P2PPong.on('game-started', () => {
    if (window.gameInstance) window.gameInstance.start();
});

P2PPong.on('game-stopped', () => {
    if (window.gameInstance) window.gameInstance.stop();
});
}

function handleIncomingMessage(data) {
    if (!data || !data.text) return;
    
    const sender = data.from === 'me' ? 'Вы' : (data.nick || 'Лучник');
    const avatar = data.from === 'me' ? selectedAvatar : (data.avatar || '001');
    
    if (activeChannelId) {
        appendMessage(sender, data.text, avatar, data.voiceData, data.type === 'voice' ? 'audio/webm' : null);
    }
    
    if (data.type === 'voice') {
        playSound('open.mp3');
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
    loadAvatars();
    
    const savedTheme = localStorage.getItem('robinhood_theme');
    if (savedTheme) applyTheme(savedTheme);
    
    const savedAvatar = localStorage.getItem('robinhood_avatar');
    if (savedAvatar) {
        selectedAvatar = savedAvatar.includes('/') ? savedAvatar.split('/').pop()?.replace('ava.png', '') || 'icons/01icon.png' : savedAvatar;
        document.getElementById('robin-avatar').src = savedAvatar;
        document.getElementById('profile-avatar-small').src = savedAvatar;
    }
    
    applyBackground(currentBgIndex);
    
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('msg-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    document.getElementById('btn-voice-input').addEventListener('click', toggleVoiceRecording);
    document.getElementById('btn-self-destruct').addEventListener('click', toggleSelfDestruct);
    document.getElementById('btn-avatar').addEventListener('click', toggleAvatarSelector);
    document.getElementById('btn-settings').addEventListener('click', toggleSettings);
    document.getElementById('btn-game').addEventListener('click', toggleGame);
    
    document.getElementById('overlay').addEventListener('click', closeSheets);
    
    initUI();
    P2PPong.init();
    initGame();
});

function sendMessage() {
    const input = document.getElementById('msg-input');
    const text = input.value.trim();
    if (!text || !activeChannelId) return;
    
    if (text.startsWith('!')) {
        if (window.gameInstance && window.gameInstance.handleGameCommand(text)) {
            input.value = '';
            return;
        }
    }
    
    P2PPong.sendMessage(activeChannelId, text);
    appendMessage('Вы', text, selectedAvatar);
    input.value = '';
    playSound('open.mp3');
}

function toggleSelfDestruct() {
    selfDestructMode = !selfDestructMode;
    const btn = document.getElementById('btn-self-destruct');
    if (selfDestructMode) {
        btn.style.background = 'rgba(244,67,54,0.3)';
        startSelfDestruct();
        rMsg('🔥 Самоуничтожение активировано', 3000);
    } else {
        btn.style.background = '';
        stopSelfDestruct();
        rMsg('🛡 Самоуничтожение отключено', 3000);
    }
}

function toggleAvatarSelector() {
    const sheet = document.getElementById('avatar-selector');
    const overlay = document.getElementById('overlay');
    const isOpen = sheet.classList.contains('show');
    closeSheets();
    if (!isOpen) {
        sheet.classList.add('show');
        overlay.classList.add('show');
    }
}

function toggleSettings() {
    const sheet = document.getElementById('settings-sheet');
    const overlay = document.getElementById('overlay');
    const isOpen = sheet.classList.contains('open');
    closeSheets();
    if (!isOpen) {
        sheet.classList.add('open');
        overlay.classList.add('show');
    }
}

function toggleGame() {
    if (window.gameInstance) {
        if (window.gameInstance.isRunning) {
            window.gameInstance.stop();
        } else {
            window.gameInstance.start();
        }
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        });
    }
});

console.log('🏹 RobinHood UI loaded');
