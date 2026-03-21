document.addEventListener('DOMContentLoaded', function() {
    const config = window.config || {};
    
    if (config.title) {
        document.title = config.title;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
        const input = document.getElementById('searchInput');
        if (input) input.value = searchParam;
    }

    if (typeof initLanguage === 'function') initLanguage();
    if (typeof initUtils === 'function') initUtils();
    if (typeof initFeatures === 'function') initFeatures();
    if (typeof initSearchHelp === 'function') initSearchHelp();
    if (typeof injectModalStyles === 'function') injectModalStyles();

    document.getElementById('greelanAppsToggle')?.addEventListener('change', (e) => toggleGreelanApps(e.target.checked));
    document.getElementById('customAppsToggle')?.addEventListener('change', (e) => toggleCustomApps(e.target.checked));
    document.getElementById('lang-select')?.addEventListener('change', (e) => changeLanguage(e.target.value));

    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const filterValue = chip.dataset.filter;
            if (typeof setFilter === 'function') {
                setFilter(filterValue);
            }
        });
    });

    const clearBtn = document.getElementById('clearSearch');
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        
        searchInput.addEventListener('input', debounce(filterApps, 250));
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            searchInput.value = '';
            filterApps();
            searchInput.focus();
        });
    }

    loadApps();
});