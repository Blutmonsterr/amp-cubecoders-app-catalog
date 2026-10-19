function initFeatures() {
    const config = window.config || { features: { customApps: true, GreelanApps: true } };
    const features = config.features || {};

    const customAppsEnabled = features.customApps !== false;
    const greelanAppsEnabled = features.GreelanApps !== false;

    const settingsDropdown = document.querySelector('.settings-dropdown');
    const infoTooltip = document.querySelector('.info-tooltip');

    if (!customAppsEnabled && !greelanAppsEnabled) {
        if (settingsDropdown) settingsDropdown.style.display = 'none';
        if (infoTooltip) infoTooltip.style.display = 'none';
    } else {
        const toggle = document.getElementById('customAppsToggle');
        if (toggle) {
            if (!customAppsEnabled) {
                const wrapper = toggle.closest('.dropdown-item');
                if (wrapper) wrapper.style.display = 'none';
            } else {
                toggle.checked = localStorage.getItem('show_custom_apps') === 'true';
            }
        }
        
        const toggleGreelan = document.getElementById('greelanAppsToggle');
        if (toggleGreelan) {
            if (!greelanAppsEnabled) {
                const wrapper = toggleGreelan.closest('.dropdown-item');
                if (wrapper) wrapper.style.display = 'none';
            } else {
                toggleGreelan.checked = localStorage.getItem('show_greelan_apps') === 'true';
            }
        }

        if (settingsDropdown) {
            const dropBtn = settingsDropdown.querySelector('.settings-dropbtn');
            if (dropBtn) {
                dropBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    settingsDropdown.classList.toggle('open');
                });
            }
        }

        if (infoTooltip) {
            infoTooltip.addEventListener('click', (e) => {
                e.stopPropagation();
                infoTooltip.classList.toggle('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (settingsDropdown && !settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('open');
            }
            if (infoTooltip && !infoTooltip.contains(e.target)) {
                infoTooltip.classList.remove('open');
            }
        });
    }

    if (features.backButton) {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            if (features.backButton.enabled === false) {
                backBtn.style.display = 'none';
            } else if (features.backButton.url) {
                backBtn.href = features.backButton.url;
            }
        }
    }

    if (features.extraLink && features.extraLink.enabled) {
        const btn = document.getElementById('extraLinkBtn');
        if (btn) {
            btn.href = features.extraLink.url;
            btn.innerText = features.extraLink.text;
            btn.style.display = 'inline-block';
        }
    }

    if (features.filterButtons === false) {
        const filterChips = document.querySelector('.filter-chips');
        if (filterChips) filterChips.style.display = 'none';
    }
}