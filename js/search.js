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
        searchInput.addEventListener('input', debounce(filterApps, 150));

        searchInput.addEventListener('keydown', (e) => {
            const modal = document.getElementById('appDetailModal');
            const isModalOpen = modal && modal.style.display === 'block';
            if (e.key === 'Escape' && !isModalOpen && searchInput.value) {
                e.preventDefault();
                searchInput.value = '';
                filterApps();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
            const modal = document.getElementById('appDetailModal');
            if (!modal || modal.style.display !== 'block') {
                e.preventDefault();
                searchInput?.focus();
            }
        }
    });

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