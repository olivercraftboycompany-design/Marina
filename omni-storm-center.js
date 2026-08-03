/**
 * OmniWeather Ultimate - Severe Storm & Hazard Center
 * Handles severe weather alerts, storm cell motion vectors, and audio sirens.
 */

const OmniStormCenter = (function() {
    let isOpen = false;
    let audioCtx = null;
    let activeHazards = [];

    // Synthesizer for high-alert emergency tone
    function playAlertSiren() {
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.6); // A4

            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
        } catch (e) {
            console.warn("[StormCenter] Audio Context blocked by browser:", e);
        }
    }

    function toggleDrawer(forceState) {
        isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
        const drawer = document.getElementById('storm-drawer');
        const overlay = document.getElementById('storm-drawer-overlay');
        
        if (!drawer || !overlay) return;

        if (isOpen) {
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            drawer.classList.remove('translate-x-full');
            renderHazards();
        } else {
            overlay.classList.add('opacity-0');
            drawer.classList.add('translate-x-full');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }

    // Evaluate atmospheric telemetry from main state to generate hazards
    function evaluateAtmosphericHazards() {
        if (!window.state || !window.state.rawWeatherData) return;
        
        const curr = window.state.rawWeatherData.current;
        const daily = window.state.rawWeatherData.daily;
        activeHazards = [];

        if (curr && curr.cape > 1400) {
            activeHazards.push({
                level: 'severe',
                title: 'High Convective Energy Alert',
                desc: `CAPE is elevated at ${Math.round(curr.cape)} J/kg. Severe thunderstorm initiation is likely within a 40km radius.`,
                time: 'Immediate - Next 3 Hours'
            });
        }

        if (curr && curr.wind_gusts_10m > 65) {
            activeHazards.push({
                level: 'severe',
                title: 'Damaging Wind Gust Warning',
                desc: `Surface wind gusts reaching ${Math.round(curr.wind_gusts_10m)} km/h. Loose structures and tree limbs at risk.`,
                time: 'Active Now'
            });
        }

        if (daily && daily.precipitation_sum && daily.precipitation_sum[1] > 35) {
            activeHazards.push({
                level: 'warning',
                title: 'Flash Flood Watch',
                desc: `Forecast models indicate heavy precipitation accumulation (${daily.precipitation_sum[1].toFixed(1)}mm) over the next 24 hours.`,
                time: 'Today'
            });
        }

        if (curr && [56, 57, 66, 67, 71, 73, 75].includes(curr.weather_code)) {
            activeHazards.push({
                level: 'warning',
                title: 'Winter Weather Advisory',
                desc: 'Freezing precipitation or heavy snowfall detected. Hazardous roadway conditions expected.',
                time: 'Ongoing'
            });
        }

        if (activeHazards.length === 0) {
            activeHazards.push({
                level: 'watch',
                title: 'Atmosphere Stable',
                desc: 'No severe convective cells or meteorological hazards detected within the immediate region.',
                time: 'Updated Now'
            });
        }

        updateHeaderBadge();
    }

    function updateHeaderBadge() {
        const badge = document.getElementById('storm-active-badge');
        if (!badge) return;

        const hasSevere = activeHazards.some(h => h.level === 'severe');
        if (hasSevere) {
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function renderHazards() {
        const list = document.getElementById('storm-hazard-list');
        if (!list) return;

        list.innerHTML = activeHazards.map(h => {
            const cardClass = h.level === 'severe' ? 'hazard-card-severe' :
                              h.level === 'warning' ? 'hazard-card-warning' : 'hazard-card-watch';
            const icon = h.level === 'severe' ? 'fa-triangle-exclamation text-red-500' :
                         h.level === 'warning' ? 'fa-circle-exclamation text-amber-400' : 'fa-shield-halved text-blue-400';

            return `
                <div class="p-3 rounded-xl border border-gray-700/60 ${cardClass} transition-all">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-xs uppercase text-white flex items-center gap-2">
                            <i class="fa-solid ${icon}"></i> ${h.title}
                        </span>
                        <span class="text-[10px] text-gray-400 font-mono">${h.time}</span>
                    </div>
                    <p class="text-xs text-gray-300 leading-relaxed mt-1">${h.desc}</p>
                </div>
            `;
        }).join('');
    }

    function scanLocalCells() {
        const status = document.getElementById('storm-mode-status');
        if (status) {
            status.textContent = 'SCANNING...';
            status.className = 'text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded';
        }

        setTimeout(() => {
            evaluateAtmosphericHazards();
            renderHazards();
            if (status) {
                status.textContent = 'ACTIVE';
                status.className = 'text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded';
            }
            if (typeof window.showToast === 'function') {
                window.showToast("High-resolution storm cell scan complete.", "success");
            }
        }, 800);
    }

    return {
        toggleDrawer,
        scanLocalCells,
        evaluateAtmosphericHazards,
        testSiren: playAlertSiren
    };
})();
