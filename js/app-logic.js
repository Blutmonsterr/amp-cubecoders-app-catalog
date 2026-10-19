let appCache = [];
let allLoadedApps = [];
let updateCheckCompleted = false;
const listMemoryCache = new Map();
let activeModalCloseHandler = null;

const escapeHtml = (unsafe) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const isExpired = (val) => {
    if (typeof val !== 'string') return false;
    const trimmed = val.trim();
    const expiryDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
        ? new Date(`${trimmed}T23:59:59.999`)
        : new Date(trimmed);
    return !isNaN(expiryDate.getTime()) && new Date() > expiryDate;
};

function filterApps() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const rawValue = input.value.trim();
    const filter = rawValue.toUpperCase();
    
    const url = new URL(window.location);
    if (rawValue) {
        url.searchParams.set('search', rawValue);
    } else {
        url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url);

    const isSearching = filter.length > 0;
    
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
        clearBtn.style.display = isSearching ? 'block' : 'none';
    }

    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        const chipFilter = (chip.dataset.filter || '').toUpperCase();
        if (chipFilter === filter) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    const tokens = isSearching ? filter.split(/\s+/) : [];
    let requireNew = false;
    let requireBeta = false;
    let requireCrossplay = false;
    const textTokens = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === 'F:NEW') requireNew = true;
        else if (token === 'F:BETA') requireBeta = true;
        else if (token === 'F:CROSSPLAY') requireCrossplay = true;
        else textTokens.push(token);
    }

    let visibleCount = 0;
    const sectionCounts = { base: 0, greelan: 0, custom: 0 };

    for (let i = 0; i < appCache.length; i++) {
        const app = appCache[i];
        let matchesSearch = true;

        if (requireNew && !app.isNew) matchesSearch = false;
        if (matchesSearch && requireBeta && !app.isBeta) matchesSearch = false;
        if (matchesSearch && requireCrossplay && !app.isCrossplay) matchesSearch = false;

        if (matchesSearch && textTokens.length > 0) {
            for (let j = 0; j < textTokens.length; j++) {
                if (app.searchText.indexOf(textTokens[j]) === -1) {
                    matchesSearch = false;
                    break;
                }
            }
        }

        if (matchesSearch) {
            if (app.element.style.display !== "") app.element.style.display = "";
            visibleCount++;
            if (app.section && sectionCounts[app.section] !== undefined) {
                sectionCounts[app.section]++;
            }
        } else {
            if (app.element.style.display !== "none") app.element.style.display = "none";
        }
    }

    const separators = document.querySelectorAll('.list-separator');
    separators.forEach(sep => {
        const secKey = sep.dataset.section;
        const count = secKey && sectionCounts[secKey] !== undefined ? sectionCounts[secKey] : 0;
        const countEl = sep.querySelector('.separator-count');
        if (countEl) countEl.textContent = count;
        sep.style.display = count > 0 ? '' : 'none';
    });

    const globalLoader = document.getElementById('globalLoader');
    const noResults = document.getElementById("no-results");
    
    const isLoading = globalLoader && globalLoader.style.display !== 'none';
    if (noResults) {
        noResults.style.display = (visibleCount === 0 && !isLoading) ? "block" : "none";
    }
    
    const resultCountEl = document.getElementById('resultCount');
    if (resultCountEl) {
        if (isLoading) {
            resultCountEl.innerText = '';
        } else {
            const t = getTranslation();
            const resultText = t.resultsFound || "Ergebnisse gefunden";
            resultCountEl.innerText = `${visibleCount} ${resultText}`;
        }
    }
}

function setFilter(val) {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.value = val;
    filterApps();
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
        const name = li.dataset.searchName || '';
        const desc = li.dataset.searchDesc || '';
        const alias = li.dataset.searchAlias || '';
        appCache.push({
            element: li,
            section: li.dataset.section || 'base',
            isNew: li.dataset.isNew === 'true',
            isBeta: li.dataset.isBeta === 'true',
            isCrossplay: li.dataset.isCrossplay === 'true',
            name,
            desc,
            alias,
            searchText: `${name} ${desc} ${alias}`
        });
    });
}

const areAppsDifferent = (appA, appB) => {
    if (!appA || !appB) return true;
    const keys = ['desc', 'image', 'alias', 'isNew', 'isBeta', 'isCrossplay'];
    return keys.some(key => {
        const valA = (appA[key] || '').toString().trim();
        const valB = (appB[key] || '').toString().trim();
        return valA !== valB;
    });
};

function mergeAppLists(local, remote) {
    const safeLocal = Array.isArray(local) ? local : [];
    const safeRemote = Array.isArray(remote) ? remote : null;
    const merged = [];
    const localMap = new Map(safeLocal.map(app => [(app.name || '').toLowerCase(), app]));
    const handledNames = new Set();

    if (safeRemote) {
        safeRemote.forEach(remoteApp => {
            if (!remoteApp || !remoteApp.name) return;
            const nameKey = remoteApp.name.toLowerCase();
            const localApp = localMap.get(nameKey);

            if (!localApp || areAppsDifferent(localApp, remoteApp)) {
                merged.push({ ...remoteApp, _source: 'github' });
            } else {
                merged.push({ ...localApp, _source: 'local' });
            }
            handledNames.add(nameKey);
        });
    }

    safeLocal.forEach(localApp => {
        if (!localApp || !localApp.name) return;
        if (!handledNames.has(localApp.name.toLowerCase())) {
            merged.push({ ...localApp, _source: 'local' });
        }
    });

    merged.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    return merged;
}

async function checkForProjectUpdates() {
    if (updateCheckCompleted || document.getElementById('update-notice')) return;
    updateCheckCompleted = true;

    const config = window.config || {};
    if (!config.features || !config.features.checkForUpdates) return;
    if (document.getElementById('update-notice')) return;

    try {
        const response = await fetch('https://api.github.com/repos/Blutmonsterr/amp-cubecoders-app-catalog/commits/main');
        if (!response.ok) return;
        const data = await response.json();
        if (!data || !data.sha) return;

        const lastChecked = localStorage.getItem('last_update_viewed');
        if (lastChecked !== data.sha && !document.getElementById('update-notice')) {
            const banner = document.createElement('div');
            banner.id = 'update-notice';
            banner.className = 'update-nav-button';
            const t = getTranslation();
            const isGitUpdateActive = config.features && config.features.gitUpdate;

            banner.innerHTML = `<i class="fa fa-info-circle update-info-trigger" style="cursor: pointer;"></i> <div class="update-text-container update-info-trigger" style="cursor: pointer;"><span id="update-notice-text">${escapeHtml(t.updateAvailable || 'Update available')}</span></div> 
                                <button type="button" class="close-update" aria-label="Close">&times;</button>`;

            banner.querySelector('.close-update').addEventListener('click', () => {
                banner.remove();
                localStorage.setItem('last_update_viewed', data.sha);
            });

            const showPopup = () => {
                if (document.getElementById('updatePopupOverlay')) return;
                
                const currentT = getTranslation();
                const currentTooltipText = isGitUpdateActive 
                    ? (currentT.updateTooltipGit || 'New version available! App lists are automatically loaded live from GitHub.') 
                    : (currentT.updateTooltipNormal || 'New version available on GitHub! A manual update is recommended.');

                const overlay = document.createElement('div');
                overlay.id = 'updatePopupOverlay';
                overlay.className = 'update-popup-overlay';
                overlay.innerHTML = `
                    <div class="update-popup-box">
                        <h3><i class="fa fa-info-circle"></i> ${escapeHtml(currentT.updateAvailable || 'Update Info')}</h3>
                        <p>${escapeHtml(currentTooltipText)}</p>
                        <button class="update-popup-btn">OK</button>
                    </div>
                `;
                document.body.appendChild(overlay);
                
                const closePopup = () => {
                    overlay.style.animation = 'fadeOutBackdrop 0.3s forwards';
                    overlay.querySelector('.update-popup-box').style.animation = 'fadeOut 0.3s forwards';
                    setTimeout(() => overlay.remove(), 300);
                };
                overlay.querySelector('.update-popup-btn').onclick = closePopup;
                overlay.onclick = (e) => { if (e.target === overlay) closePopup(); };
            };

            banner.querySelectorAll('.update-info-trigger').forEach(el => el.onclick = showPopup);

            document.body.appendChild(banner);
            
            setTimeout(() => {
                if (document.body.contains(banner)) {
                    banner.remove();
                    localStorage.setItem('last_update_viewed', data.sha);
                }
            }, 35000);
        }
    } catch (err) {
        console.warn("Update check failed:", err);
    }
}

async function fetchJSON(url, useCache = true) {
    if (useCache && listMemoryCache.has(url)) {
        return listMemoryCache.get(url);
    }
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (useCache && data) {
            listMemoryCache.set(url, data);
        }
        return data;
    } catch (err) {
        return null;
    }
}

function attachImageFallback(img, imageName, loader = null) {
    const config = window.config || {};
    const gitUpdate = config.features && config.features.gitUpdate === true;
    const remoteBase = config.remoteBase || 'https://raw.githubusercontent.com/Blutmonsterr/amp-cubecoders-app-catalog/main/';

    const onImageLoad = () => {
        if (loader) loader.style.display = 'none';
        img.style.opacity = '1';
    };

    if (img.complete && img.naturalWidth > 0) {
        onImageLoad();
        return;
    }

    let triedRemote = false;
    img.onload = onImageLoad;
    img.onerror = function() {
        if (gitUpdate && !triedRemote && imageName) {
            triedRemote = true;
            this.src = `${remoteBase}images/games/${encodeURIComponent(imageName)}`;
            return;
        }
        if (loader) loader.style.display = 'none';
        this.src = 'images/placeholder.webp';
        this.style.opacity = '1';
        this.onerror = null;
    };
}

async function loadApps() {
    const appList = document.getElementById('appList');
    const globalLoader = document.getElementById('globalLoader');
    if (!appList) return;

    checkForProjectUpdates();

    const t = getTranslation();

    appList.innerHTML = '';
    if (globalLoader) {
        delete globalLoader.dataset.hasError;
        globalLoader.style.display = 'block';
        globalLoader.innerText = t.loading || 'Lade Apps...';
    }

    const greelanErrorEl = document.getElementById('greelanLoadError');
    const customErrorEl = document.getElementById('customLoadError');
    if (greelanErrorEl) greelanErrorEl.style.display = 'none';
    if (customErrorEl) customErrorEl.style.display = 'none';

    let allApps = [];
    const config = window.config || { features: { customApps: true, GreelanApps: true, gitUpdate: false } };
    const customAppsEnabled = config.features && config.features.customApps !== false;
    const greelanAppsEnabled = config.features && config.features.GreelanApps !== false;

    const showCustom = customAppsEnabled && (localStorage.getItem('show_custom_apps') === 'true');
    const showGreelan = greelanAppsEnabled && (localStorage.getItem('show_greelan_apps') === 'true');

    const showDesc = config.features && config.features.descriptions !== false;
    const gitUpdate = config.features && config.features.gitUpdate === true;
    const remoteBase = config.remoteBase || 'https://raw.githubusercontent.com/Blutmonsterr/amp-cubecoders-app-catalog/main/';

    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app')?.toUpperCase();

    const createAppItem = (data, sectionKey = 'base') => {
        const app = { ...data };
        if (isExpired(app.isNew)) app.isNew = false;
        if (isExpired(app.isBeta)) app.isBeta = false;

        const li = document.createElement('li');
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        li.dataset.section = sectionKey;
        if (app.isNew) li.dataset.isNew = 'true';
        if (app.isBeta) li.dataset.isBeta = 'true';
        if (app.isCrossplay) li.dataset.isCrossplay = 'true';

        li.dataset.searchName = (app.name || '').toUpperCase();
        li.dataset.searchDesc = (app.desc || '').toUpperCase();
        li.dataset.searchAlias = (app.alias || '').toUpperCase();
        li.onclick = () => openModal(app);
        li.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(app);
            }
        };

        const isGitHub = app._source === 'github';
        const newLabel = escapeHtml((t.filterNew || 'Neu').toUpperCase());
        const safeImage = escapeHtml(app.image || '');

        li.innerHTML = `
            <div class="app-item${app.isNew ? ' new-app' : ''}${app.isBeta ? ' beta-app' : ''}">
                <div class="image-container">
                    <div class="img-loader"></div>
                    <img src="images/games/${safeImage}" alt="${escapeHtml(app.name)}" class="app-image" loading="lazy" decoding="async">
                    ${(app.isNew || app.isCrossplay) ? `
                        <div class="card-badges-top">
                            ${app.isNew ? `<span class="card-new-badge">${newLabel}</span>` : ''}
                            ${app.isCrossplay ? `<span class="card-crossplay-badge" title="${escapeHtml(t.filterCrossplay || 'Crossplay')}"><i class="fa fa-gamepad" aria-hidden="true"></i></span>` : ''}
                        </div>
                    ` : ''}
                    <span class="card-source-badge ${isGitHub ? 'live' : 'local'}" title="${isGitHub ? 'GitHub Raw' : 'Local File'}"><i class="fa fa-${isGitHub ? 'github' : 'server'}" aria-hidden="true"></i></span>
                    ${app.isBeta ? `<span class="card-beta-badge">${escapeHtml((t.filterBeta || 'BETA').toUpperCase())}</span>` : ''}
                </div>
                <div class="app-info">
                    <span class="app-name" title="${escapeHtml(app.name)}">${escapeHtml(app.name)}</span>
                    ${showDesc ? `<span class="app-desc" title="${escapeHtml(app.desc || '')}">${escapeHtml(app.desc || '')}</span>` : ''}
                    <span class="app-alias">${escapeHtml(app.alias || '')}</span>
                </div>
            </div>
        `;

        const img = li.querySelector('.app-image');
        const loader = li.querySelector('.img-loader');
        attachImageFallback(img, app.image, loader);

        return { li, app };
    };

    const renderBlock = (apps, targetList, sectionKey = 'base') => {
        const fragment = document.createDocumentFragment();
        const normalizedApps = [];
        apps.forEach(rawApp => {
            const { li, app } = createAppItem(rawApp, sectionKey);
            fragment.appendChild(li);
            normalizedApps.push(app);
        });
        targetList.appendChild(fragment);
        return normalizedApps;
    };

    const renderSeparator = (targetList, sectionKey, title, icon, count, i18nKey = '') => {
        const separatorLi = document.createElement('li');
        separatorLi.className = 'list-separator';
        separatorLi.dataset.section = sectionKey;
        separatorLi.innerHTML = `
            <div class="separator-line"></div>
            <div class="separator-badge">
                <i class="fa ${escapeHtml(icon)}" aria-hidden="true"></i>
                <span class="separator-title"${i18nKey ? ` data-i18n="${escapeHtml(i18nKey)}"` : ''}>${escapeHtml(title)}</span>
                <span class="separator-count">${count}</span>
            </div>
            <div class="separator-line"></div>
        `;
        targetList.appendChild(separatorLi);
    };

    try {
        const basePath = 'js/apps/apps.json';
        const greelanPath = 'js/apps/apps-g.json';
        const customPath = 'js/apps/apps-c.json';

        const [localBase, remoteBaseData, localG, remoteG, localC] = await Promise.all([
            fetchJSON(basePath),
            gitUpdate ? fetchJSON(`${remoteBase}${basePath}`) : Promise.resolve(null),
            showGreelan ? fetchJSON(greelanPath) : Promise.resolve(null),
            (showGreelan && gitUpdate) ? fetchJSON(`${remoteBase}${greelanPath}`) : Promise.resolve(null),
            showCustom ? fetchJSON(customPath) : Promise.resolve(null)
        ]);

        if (!localBase && !remoteBaseData) {
            throw new Error("Could not load apps.json");
        }

        let blocksRendered = 0;

        // --- Block 1: Base Apps ---
        const baseApps = gitUpdate
            ? mergeAppLists(localBase || [], remoteBaseData)
            : (localBase || []).map(a => ({ ...a, _source: 'local' }));

        if (baseApps.length > 0) {
            const renderedBase = renderBlock(baseApps, appList, 'base');
            blocksRendered++;
            allApps = allApps.concat(renderedBase);
        }

        // --- Block 2: Greelan Apps (Optional) ---
        if (showGreelan) {
            if (!localG && !remoteG) {
                if (greelanErrorEl) {
                    greelanErrorEl.style.display = 'inline';
                    greelanErrorEl.title = t.loadListError || 'Laden der Liste fehlgeschlagen.';
                }
            } else {
                const finalG = gitUpdate
                    ? mergeAppLists(localG || [], remoteG)
                    : (localG || []).map(a => ({ ...a, _source: 'local' }));

                if (finalG.length > 0) {
                    if (blocksRendered > 0) {
                        renderSeparator(appList, 'greelan', 'Greelan (B-DEV&DB)', 'fa-flask', finalG.length);
                    }
                    const renderedG = renderBlock(finalG, appList, 'greelan');
                    blocksRendered++;
                    allApps = allApps.concat(renderedG);
                }
            }
        }

        // --- Block 3: Custom Apps (Optional) ---
        if (showCustom) {
            if (!localC) {
                if (customErrorEl) {
                    customErrorEl.style.display = 'inline';
                    customErrorEl.title = t.loadListError || 'Laden der Liste fehlgeschlagen.';
                }
            } else if (localC.length > 0) {
                const finalC = localC.map(a => ({ ...a, _source: 'local' }));
                if (blocksRendered > 0) {
                    renderSeparator(appList, 'custom', t.customApps || 'Custom Apps', 'fa-puzzle-piece', finalC.length, 'customApps');
                }
                const renderedC = renderBlock(finalC, appList, 'custom');
                blocksRendered++;
                allApps = allApps.concat(renderedC);
            }
        }

        allLoadedApps = allApps;
        if (globalLoader) globalLoader.style.display = 'none';

        cacheAppElements();
        filterApps();

        if (appParam) {
            const target = allApps.find(a => (a.name || '').toUpperCase() === appParam);
            if (target) {
                openModal(target, false);
            }
        }
    } catch (err) {
        const tErr = typeof getTranslation === 'function' ? getTranslation() : {};
        const errorText = tErr.appLoadError || 'Fehler beim Laden der Apps:';
        console.error(errorText, err);
        if (globalLoader) {
            globalLoader.dataset.hasError = 'true';
            globalLoader.innerText = tErr.loadError || 'Fehler beim Laden der Daten.';
        }
    }
}

function injectModalStyles() {
    // Modal, badge, update-popup, and responsive styles are consolidated in css/components.css and css/responsive.css
}

function openModal(app, updateHistory = true) {
    injectModalStyles();
    const t = typeof getTranslation === 'function' ? getTranslation() : {};
    const config = window.config || {};
    const showDesc = config.features && config.features.descriptions !== false;

    let modal = document.getElementById('appDetailModal');

    if (activeModalCloseHandler) {
        activeModalCloseHandler(true);
    }

    let handleEsc;
    let handleBackgroundClick;

    const closeModalAnimated = (immediate = false, fromPopState = false) => {
        if (!modal) return;
        window.removeEventListener('keydown', handleEsc);
        modal.removeEventListener('click', handleBackgroundClick);
        activeModalCloseHandler = null;

        const finishClose = () => {
            modal.style.display = 'none';
            modal.classList.remove('closing');
            document.body.style.overflow = '';

            if (!fromPopState && !immediate) {
                const url = new URL(window.location);
                if (url.searchParams.has('app')) {
                    url.searchParams.delete('app');
                    window.history.pushState({}, '', url);
                }
            }
        };

        if (immediate) {
            finishClose();
            return;
        }

        if (modal.classList.contains('closing')) return;
        modal.classList.add('closing');

        const onAnimationEnd = (e) => {
            if (e.target === modal) {
                modal.removeEventListener('animationend', onAnimationEnd);
                finishClose();
            }
        };
        modal.addEventListener('animationend', onAnimationEnd);
    };

    activeModalCloseHandler = closeModalAnimated;

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
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        document.body.appendChild(modal);
    }

    const safeImage = escapeHtml(app.image || '');
    const newText = escapeHtml((t.filterNew || 'NEW').toUpperCase());
    const betaText = escapeHtml((t.filterBeta || 'BETA').toUpperCase());
    const crossplayText = escapeHtml(t.filterCrossplay || 'Crossplay');

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" role="button" tabindex="0" aria-label="Close">&times;</span>
            <div class="modal-header">
                <h2>${escapeHtml(app.name)} ${app.isNew ? `<span class="new-badge">${newText}</span>` : ''}${app.isBeta ? `<span class="beta-badge">${betaText}</span>` : ''}${app.isCrossplay ? `<span class="crossplay-badge"><i class="fa fa-gamepad" aria-hidden="true"></i> ${crossplayText}</span>` : ''}</h2>
            </div>
            <div class="modal-body">
                <img src="images/games/${safeImage}" alt="${escapeHtml(app.name)}" class="modal-app-image" decoding="async">
                ${(showDesc && app.desc) ? `<p class="modal-app-desc">${escapeHtml(app.desc)}</p>` : ''}
            </div>
        </div>
    `;

    const modalImg = modal.querySelector('.modal-app-image');
    attachImageFallback(modalImg, app.image);

    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => closeModalAnimated());
    closeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeModalAnimated();
        }
    });
    modal.addEventListener('click', handleBackgroundClick);
    window.addEventListener('keydown', handleEsc);

    modal.classList.remove('closing');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    if (updateHistory) {
        const url = new URL(window.location);
        if (url.searchParams.get('app') !== app.name) {
            url.searchParams.set('app', app.name);
            window.history.pushState({}, '', url);
        }
    }
}

window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app')?.toUpperCase();
    const modal = document.getElementById('appDetailModal');

    if (!appParam) {
        if (activeModalCloseHandler && modal && modal.style.display === 'block') {
            activeModalCloseHandler(false, true);
        }
    } else if (allLoadedApps.length > 0) {
        const target = allLoadedApps.find(a => (a.name || '').toUpperCase() === appParam);
        if (target) {
            openModal(target, false);
        }
    }
});