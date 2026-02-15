function initFeatures() {
    const config = window.config || { features: { customApps: true, themeSwitcher: true } };

    if (config.features.customApps === false) {
        const settingsDropdown = document.querySelector('.settings-dropdown');
        const infoTooltip = document.querySelector('.info-tooltip');
        if (settingsDropdown) settingsDropdown.style.display = 'none';
        if (infoTooltip) infoTooltip.style.display = 'none';
    } else {
        const showCustom = localStorage.getItem('show_custom_apps') === 'true';
        const toggle = document.getElementById('customAppsToggle');
        if (toggle) {
            toggle.checked = showCustom;
        }
        
        const showGreelan = localStorage.getItem('show_greelan_apps') === 'true';
        const toggleGreelan = document.getElementById('greelanAppsToggle');
        if (toggleGreelan) {
            toggleGreelan.checked = showGreelan;
        }
    }

    if (config.features.themeSwitcher === false) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const wrapper = themeToggle.closest('.dropdown-item');
            if (wrapper) wrapper.style.display = 'none';
        }
    }

    if (config.features.backButton) {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            if (config.features.backButton.enabled === false) {
                backBtn.style.display = 'none';
            } else if (config.features.backButton.url) {
                backBtn.href = config.features.backButton.url;
            }
        }
    }

    if (config.features.extraLink && config.features.extraLink.enabled) {
        const btn = document.getElementById('extraLinkBtn');
        if (btn) {
            btn.href = config.features.extraLink.url;
            btn.innerText = config.features.extraLink.text;
            btn.style.display = 'inline-block';
        }
    }

    if (config.features.filterButtons === false) {
        const filterChips = document.querySelector('.filter-chips');
        if (filterChips) filterChips.style.display = 'none';
    }
}