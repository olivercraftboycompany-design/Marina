/**
 * OmniWeather Ultimate - Master Module Bridge
 * Automatically connects custom feature modules to the main dashboard data lifecycle.
 */

(function OmniModuleBridge() {
    // 1. Hook into existing UI updates
    const existingUpdateUI = window.updateDashboardUI;

    window.updateDashboardUI = function(weatherData, astroData) {
        if (typeof existingUpdateUI === "function") {
            existingUpdateUI(weatherData, astroData);
        }

        if (window.OmniStormCenter && typeof window.OmniStormCenter.evaluateAtmosphericHazards === "function") {
            try {
                window.OmniStormCenter.evaluateAtmosphericHazards();
            } catch (err) {
                console.warn("[OmniBridge] Storm Center sync warning:", err);
            }
        }

        if (window.OmniSpaceWeather && typeof window.OmniSpaceWeather.refreshData === "function") {
            try {
                window.OmniSpaceWeather.refreshData();
            } catch (err) {
                console.warn("[OmniBridge] Space Weather sync warning:", err);
            }
        }
    };

    // 2. Global Keyboard Shortcuts
    window.addEventListener("keydown", (e) => {
        if (e.altKey && e.key.toLowerCase() === "s") {
            e.preventDefault();
            if (window.OmniStormCenter) window.OmniStormCenter.toggleDrawer();
        }
        if (e.altKey && e.key.toLowerCase() === "a") {
            e.preventDefault();
            if (window.OmniSpaceWeather) window.OmniSpaceWeather.toggleModal();
        }
    });

    // 3. Initial load trigger
    window.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            if (window.OmniSpaceWeather) window.OmniSpaceWeather.refreshData();
            if (window.OmniStormCenter) window.OmniStormCenter.evaluateAtmosphericHazards();
        }, 500);
    });
})();
