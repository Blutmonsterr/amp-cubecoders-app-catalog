let appCache = [];

const escapeHtml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

function filterApps() {
    const input = document.getElementById('searchInput');
    const filter = input.value.trim().toUpperCase();
    
    const url = new URL(window.location);
    if (input.value) {
        url.searchParams.set('search', input.value);
    } else {
        url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url);

    const isSearching = filter.length > 0;
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = isSearching ? 'block' : 'none';
    }

    let visibleCount = 0;
    const isNewFilter = filter === 'F:NEW';
    const isBetaFilter = filter === 'F:BETA';
    const isCrossplayFilter = filter === 'F:CROSSPLAY';

    appCache.forEach(app => {
        let matchesSearch;

        if (isNewFilter) {
            matchesSearch = app.isNew;
        } else if (isBetaFilter) {
            matchesSearch = app.isBeta;
        } else if (isCrossplayFilter) {
            matchesSearch = app.isCrossplay;
        } else {
            matchesSearch = !isSearching || app.name.indexOf(filter) > -1 || app.desc.indexOf(filter) > -1 || app.alias.indexOf(filter) > -1;
        }

        if (matchesSearch) {
            app.element.style.display = "";
            visibleCount++;
        } else {
            app.element.style.display = "none";
        }
    });

    const separators = document.querySelectorAll('.list-separator');
    separators.forEach(sep => {
        sep.style.display = isSearching ? 'none' : 'block';
    });

    const globalLoader = document.getElementById('globalLoader');
    const noResults = document.getElementById("no-results");
    
    const isLoading = globalLoader && globalLoader.style.display !== 'none';
    if (visibleCount === 0 && !isLoading) {
        noResults.style.display = "block";
    } else {
        noResults.style.display = "none";
    }
    
    const t = getTranslation();
    const resultText = t.resultsFound || "Ergebnisse gefunden";
    document.getElementById('resultCount').innerText = visibleCount + " " + resultText;

}

function setFilter(val) {
    const input = document.getElementById('searchInput');
    input.value = val;
    filterApps();

    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        if (chip.dataset.filter === val) chip.classList.add('active');
        else chip.classList.remove('active');
    });
    input.focus();
}

function toggleCustomApps(isChecked) {
    localStorage.setItem('show_custom_apps', isChecked);
    loadApps();
}

function toggleGreelanApps(isChecked) {
    localStorage.setItem('show_greelan_apps', isChecked);
    loadApps();
}

function cacheAppElements() {
    appCache = [];
    const ul = document.getElementById("appList");
    if (!ul) return;

    const liElements = ul.querySelectorAll('li:not(.list-separator)');
    liElements.forEach(li => {
        appCache.push({
            element: li,
            isNew: li.dataset.isNew === 'true',
            isBeta: li.dataset.isBeta === 'true',
            isCrossplay: li.dataset.isCrossplay === 'true',
            name: li.dataset.searchName || '',
            desc: li.dataset.searchDesc || '',
            alias: li.dataset.searchAlias || ''
        });
    });
}

/**
 * Fetches an optional list of apps from a given URL.
 * Logs a warning and displays a UI error on failure.
 * @param {string} url The URL of the JSON file to fetch.
 * @param {string} errorElementId The ID of the element to display as an error indicator.
 * @returns {Promise<Array|null>} A promise that resolves to the array of apps, or null on failure.
 */
async function fetchOptionalAppList(url, errorElementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.warn(`Could not load optional app list from ${url}:`, err);
        const errorIndicator = document.getElementById(errorElementId);
        if (errorIndicator) {
            errorIndicator.style.display = 'inline';
            const t = getTranslation();
            errorIndicator.title = t.loadListError || 'Laden der Liste fehlgeschlagen.';
        }
        return null;
    }
}

async function loadApps() {
    injectModalStyles();
    const appList = document.getElementById('appList');
    const globalLoader = document.getElementById('globalLoader');
    
    const t = getTranslation();

    appList.innerHTML = '';
    if (globalLoader) {
        globalLoader.style.display = 'block';
        globalLoader.innerText = t.loading || 'Lade Apps...';
    }

    document.getElementById('greelanLoadError').style.display = 'none';
    document.getElementById('customLoadError').style.display = 'none';

    const config = window.config || { features: { customApps: true } };
    const customAppsEnabled = config.features && config.features.customApps !== false;
    const showCustom = customAppsEnabled && (localStorage.getItem('show_custom_apps') === 'true');
    const showGreelan = customAppsEnabled && (localStorage.getItem('show_greelan_apps') === 'true');

    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app');

    const isExpired = (val) => {
        if (typeof val !== 'string') return false;
        const expiryDate = new Date(val);
        return !isNaN(expiryDate.getTime()) && new Date() > expiryDate;
    };

    const createAppItem = (app) => {
        if (isExpired(app.isNew)) app.isNew = false;
        if (isExpired(app.isBeta)) app.isBeta = false;

        const li = document.createElement('li');
        if (app.isNew) {
            li.dataset.isNew = 'true';
        }
        if (app.isBeta) {
            li.dataset.isBeta = 'true';
        }
        if (app.isCrossplay) {
            li.dataset.isCrossplay = 'true';
        }
        li.dataset.searchName = (app.name || '').toUpperCase();
        li.dataset.searchDesc = (app.desc || '').toUpperCase();
        li.dataset.searchAlias = (app.alias || '').toUpperCase();
        li.style.cursor = 'pointer';
        li.onclick = () => openModal(app);
        li.innerHTML = `
            <div class="app-item${app.isNew ? ' new-app' : ''}${app.isBeta ? ' beta-app' : ''}">
                <div class="app-info">
                    <span class="app-name">${escapeHtml(app.name)}</span>
                    <span class="app-desc">${escapeHtml(app.desc || '')}</span>
                    <span class="app-alias" style="display:none;">${escapeHtml(app.alias || '')}</span>
                </div>
                <div class="image-container">
                    <div class="img-loader"></div>
                    <img src="images/games/${app.image}" alt="${escapeHtml(app.name)}" class="app-image" loading="lazy">
                    ${app.isBeta ? '<span class="card-beta-badge">BETA</span>' : ''}
                    ${app.isCrossplay ? `<span class="card-crossplay-badge" title="${t.filterCrossplay || 'Crossplay'}"><i class="fa fa-gamepad"></i></span>` : ''}
                </div>
            </div>
        `;

        const img = li.querySelector('.app-image');
        const loader = li.querySelector('.img-loader');

        const onImageLoad = () => {
            loader.style.display = 'none';
            img.style.opacity = '1';
        };

        if (img.complete) {
            onImageLoad();
        } else {
            img.onload = onImageLoad;
            img.onerror = function() {
                loader.style.display = 'none';
                this.src = 'https://placehold.co/260x146/222/39b54a?text=No+Image';
                this.style.opacity = '1';
                this.onerror = null;
            };
        }

        if (appParam === app.name) {
            setTimeout(() => openModal(app), 100);
        }

        return li;
    };

    const renderBlock = (apps, targetList) => {
        const fragment = document.createDocumentFragment();
        apps.forEach(app => {
            fragment.appendChild(createAppItem(app));
        });
        targetList.appendChild(fragment);
    };

    const renderSeparator = (targetList) => {
        const separatorLi = document.createElement('li');
        separatorLi.className = 'list-separator';
        separatorLi.innerHTML = `<div class="separator-bar"></div>`;
        targetList.appendChild(separatorLi);
    };

    try {
        // --- Block 1: Base Apps ---
        const baseAppsRes = await fetch('js/apps/apps.json');
        if (!baseAppsRes.ok) throw new Error(`HTTP error ${baseAppsRes.status} for apps.json`);
        const baseApps = await baseAppsRes.json();

        if (baseApps && baseApps.length > 0) {
            renderBlock(baseApps, appList);
            renderSeparator(appList);
        }

        // --- Block 2: Greelan Apps (Optional) ---
        if (showGreelan) {
            const greelanApps = await fetchOptionalAppList('js/apps/apps-g.json', 'greelanLoadError');
            if (greelanApps && greelanApps.length > 0) {
                renderBlock(greelanApps, appList);
                renderSeparator(appList);
            }
        }

        // --- Block 3: Custom Apps (Optional) ---
        if (showCustom) {
            const customApps = await fetchOptionalAppList('js/apps/apps-c.json', 'customLoadError');
            if (customApps && customApps.length > 0) {
                renderBlock(customApps, appList);
                renderSeparator(appList);
            }
        }

        if (globalLoader) globalLoader.style.display = 'none';

        cacheAppElements();
        filterApps();
    } catch (err) {
        const t = typeof getTranslation === 'function' ? getTranslation() : {};
        const errorText = t.appLoadError || 'Fehler beim Laden der Apps:';
        console.error(errorText, err);
        if (globalLoader) globalLoader.innerText = t.loadError || 'Fehler beim Laden der Daten.';
    }
}

function injectModalStyles() {
    if (document.getElementById('app-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'app-modal-styles';
    style.textContent = `
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(5px); animation: fadeInBackdrop 0.3s; }
        .modal-content { background-color: #1e1e1e; margin: 5% auto; padding: 20px; border: 1px solid #333; width: 90%; max-width: 600px; border-radius: 8px; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.5); position: relative; animation: fadeIn 0.3s; }
        .close-modal { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close-modal:hover { color: #fff; }
        .modal-header { margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .modal-header h2 { margin: 0; font-size: 1.5rem; display: flex; align-items: center; gap: 10px; }
        .modal-body { text-align: center; }
        .modal-app-image { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .modal-app-desc { font-size: 1.1rem; line-height: 1.6; color: #ccc; text-align: left; }
        .new-badge { background-color: #e74c3c; color: white; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle; font-weight: bold; }
        .beta-badge { background-color: #e74c3c; color: white; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle; font-weight: bold; }
        .card-beta-badge { position: absolute; bottom: 8px; right: 8px; background-color: #e74c3c; color: white; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; z-index: 5; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .crossplay-badge { background-color: #9b59b6; color: white; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle; font-weight: bold; }
        .card-crossplay-badge { position: absolute; top: 8px; right: 8px; background-color: #9b59b6; color: white; font-size: 0.85rem; padding: 4px 6px; border-radius: 4px; z-index: 5; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .image-container { position: relative; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInBackdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
        @keyframes fadeOutBackdrop { from { opacity: 1; } to { opacity: 0; } }
        .modal.closing { animation: fadeOutBackdrop 0.3s forwards; }
        .modal.closing .modal-content { animation: fadeOut 0.3s forwards; }
        body.light-theme .modal-content { background-color: #fff; color: #333; border-color: #ddd; }
        body.light-theme .modal-header { border-bottom-color: #eee; }
        body.light-theme .modal-app-desc { color: #555; }
        body.light-theme .close-modal { color: #888; }
        body.light-theme .close-modal:hover { color: #000; }
    `;
    document.head.appendChild(style);
}

function openModal(app) {
    injectModalStyles();
    const t = typeof getTranslation === 'function' ? getTranslation() : {};
    let modal = document.getElementById('appDetailModal');

    let handleEsc;
    let handleBackgroundClick;

    const closeModalAnimated = () => {
        if (modal.classList.contains('closing')) return;
        modal.classList.add('closing');
        
        window.removeEventListener('keydown', handleEsc);
        modal.removeEventListener('click', handleBackgroundClick);

        const onAnimationEnd = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('closing');
                document.body.style.overflow = '';
                
                const url = new URL(window.location);
                url.searchParams.delete('app');
                window.history.pushState({}, '', url);

                modal.removeEventListener('animationend', onAnimationEnd);
            }
        };
        modal.addEventListener('animationend', onAnimationEnd);
    };

    handleEsc = (e) => {
        if (e.key === 'Escape') closeModalAnimated();
    };

    handleBackgroundClick = (e) => {
        if (e.target === modal) closeModalAnimated();
    };

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'appDetailModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <div class="modal-header">
                <h2>${escapeHtml(app.name)} ${app.isNew ? '<span class="new-badge">NEW</span>' : ''}${app.isBeta ? '<span class="beta-badge">BETA</span>' : ''}${app.isCrossplay ? `<span class="crossplay-badge"><i class="fa fa-gamepad"></i> ${t.filterCrossplay || 'Crossplay'}</span>` : ''}</h2>
            </div>
            <div class="modal-body">
                <img src="images/games/${app.image}" alt="${escapeHtml(app.name)}" class="modal-app-image">
                <p class="modal-app-desc">${escapeHtml(app.desc)}</p>
            </div>
        </div>
    `;
    
    modal.querySelector('.close-modal').addEventListener('click', closeModalAnimated);
    modal.addEventListener('click', handleBackgroundClick);
    window.addEventListener('keydown', handleEsc);

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    const url = new URL(window.location);
    url.searchParams.set('app', app.name);
    window.history.pushState({}, '', url);
}