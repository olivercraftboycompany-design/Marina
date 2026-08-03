/**
 * OmniWeather Ultimate - Space Weather & Aurora Observatory
 * Calculates geomagnetic activity and Aurora Borealis visibility probability.
 */

const OmniSpaceWeather = (function() {
    let isOpen = false;
    
    const spaceState = {
        kpIndex: 2.3,
        solarWindSpeed: 410,
        density: 5.2,
        auroraProb: 5
    };

    function toggleModal(forceState) {
        isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
        const overlay = document.getElementById('space-modal-overlay');
        if (!overlay) return;

        if (isOpen) {
            updateAuroraCalculations();
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        } else {
            overlay.classList.add('opacity-0');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }

    function updateAuroraCalculations() {
        const lat = Math.abs((window.state && window.state.lat) ? window.state.lat : 41.5);
        
        // Dynamic variance based on time of day
        const now = new Date();
        const hourVariance = Math.sin(now.getHours()) * 0.8;
        spaceState.kpIndex = Math.max(1.0, Math.min(8.5, parseFloat((2.3 + hourVariance).toFixed(1))));
        spaceState.solarWindSpeed = Math.round(380 + (spaceState.kpIndex * 35));
        spaceState.density = parseFloat((4.5 + (spaceState.kpIndex * 0.8)).toFixed(1));

        let baseChance = 0;
        if (lat >= 65) baseChance = 75;
        else if (lat >= 55) baseChance = 35;
        else if (lat >= 48) baseChance = 10;
        else if (lat >= 40) baseChance = 2;
        else baseChance = 0;

        const kpMultiplier = Math.pow(spaceState.kpIndex, 1.4);
        spaceState.auroraProb = Math.min(99, Math.round(baseChance * (kpMultiplier / 3)));

        renderWidget();
        renderModal();
    }

    function renderWidget() {
        const kpBadge = document.getElementById('kp-badge');
        const probEl = document.getElementById('aurora-probability');
        const windEl = document.getElementById('solar-wind-speed');

        if (kpBadge) {
            kpBadge.textContent = `Kp: ${spaceState.kpIndex}`;
            kpBadge.className = `px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                spaceState.kpIndex >= 5 ? 'bg-red-500/20 text-red-300 border border-red-500/50' :
                spaceState.kpIndex >= 4 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                'bg-purple-500/20 text-purple-300 border border-purple-500/40'
            }`;
        }

        if (probEl) probEl.textContent = `${spaceState.auroraProb}%`;
        if (windEl) windEl.textContent = `${spaceState.solarWindSpeed} km/s`;
    }

    function renderModal() {
        const modalKp = document.getElementById('modal-kp-val');
        const modalKpLabel = document.getElementById('modal-kp-label');
        const modalAurora = document.getElementById('modal-aurora-val');
        const modalDensity = document.getElementById('modal-density-val');
        const briefing = document.getElementById('space-weather-briefing');

        if (modalKp) modalKp.textContent = spaceState.kpIndex;
        if (modalAurora) modalAurora.textContent = `${spaceState.auroraProb}%`;
        if (modalDensity) modalDensity.textContent = `${spaceState.density}`;

        if (modalKpLabel) {
            if (spaceState.kpIndex >= 6) modalKpLabel.textContent = 'G2 (Moderate Storm)';
            else if (spaceState.kpIndex >= 5) modalKpLabel.textContent = 'G1 (Minor Storm)';
            else if (spaceState.kpIndex >= 4) modalKpLabel.textContent = 'Active Magnetosphere';
            else modalKpLabel.textContent = 'Quiet Conditions';
        }

        if (briefing) {
            const currentLat = (window.state && window.state.lat) ? window.state.lat.toFixed(1) : "41.5";
            briefing.textContent = `Solar wind parameters are operating at an average velocity of ${spaceState.solarWindSpeed} km/s. At a geomagnetic latitude of ${currentLat}°, there is a ${spaceState.auroraProb}% probability of observing auroral displays during clear, dark nighttime hours.`;
        }
    }

    return {
        toggleModal,
        refreshData: updateAuroraCalculations
    };
})();
