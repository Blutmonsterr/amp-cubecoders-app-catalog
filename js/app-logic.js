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

const isExpired = (val) => {
    if (typeof val !== 'string') return false;
    const expiryDate = new Date(val);
    return !isNaN(expiryDate.getTime()) && new Date() > expiryDate;
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

const areAppsDifferent = (appA, appB) => {
    if (!appA || !appB) return true;
    const keys = ['desc', 'image', 'alias', 'isNew', 'isBeta', 'isCrossplay'];
    return keys.some(key => {
        // Normalisierung: Behandelt null/undefined und entfernt überflüssige Leerzeichen
        const valA = (appA[key] || '').toString().trim();
        const valB = (appB[key] || '').toString().trim();
        return valA !== valB;
    });
};

function mergeAppLists(local, remote) {
    const merged = [];
    const localMap = new Map(local.map(app => [app.name.toLowerCase(), app]));
    const handledNames = new Set();

    if (remote) {
        remote.forEach(remoteApp => {
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

    local.forEach(localApp => {
        if (!handledNames.has(localApp.name.toLowerCase())) {
            merged.push({ ...localApp, _source: 'local' });
        }
    });

    return merged;
}

async function checkForProjectUpdates() {
    const config = window.config || {};
    if (!config.features || !config.features.checkForUpdates) return;
    if (document.getElementById('update-notice')) return;

    try {
        const response = await fetch('https://api.github.com/repos/Blutmonsterr/amp-cubecoders-app-catalog/commits/main');
        if (!response.ok) return;
        const data = await response.json();
        const latestCommitDate = new Date(data.commit.author.date);
        
        const lastChecked = localStorage.getItem('last_update_viewed');
        if (lastChecked !== data.sha) {
            if (document.getElementById('update-notice')) return;

            const banner = document.createElement('div');
            banner.id = 'update-notice';
            banner.className = 'update-nav-button';
            const t = getTranslation();
            
            const isGitUpdateActive = config.features && config.features.gitUpdate;
            const tooltipText = isGitUpdateActive 
                ? (t.updateTooltipGit || 'New version available! App lists are automatically loaded live from GitHub.') 
                : (t.updateTooltipNormal || 'New version available on GitHub! A manual update is recommended.');

            banner.innerHTML = `<i class="fa fa-info-circle update-info-trigger" title="Klicken für mehr Infos" style="cursor: pointer;"></i> <div class="update-text-container update-info-trigger" title="Klicken für mehr Infos" style="cursor: pointer;"><span id="update-notice-text">${t.updateAvailable || 'Update available'}</span></div> 
                                <button class="close-update" title="Schließen" onclick="this.parentElement.remove(); localStorage.setItem('last_update_viewed', '${data.sha}')">&times;</button>`;
            
            const showPopup = () => {
                if (document.getElementById('updatePopupOverlay')) return;
                const overlay = document.createElement('div');
                overlay.id = 'updatePopupOverlay';
                overlay.className = 'update-popup-overlay';
                overlay.innerHTML = `
                    <div class="update-popup-box">
                        <h3><i class="fa fa-info-circle"></i> ${t.updateAvailable || 'Update Info'}</h3>
                        <p>${tooltipText}</p>
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
                overlay.onclick = (e) => { if(e.target === overlay) closePopup(); };
            };

            banner.querySelectorAll('.update-info-trigger').forEach(el => el.onclick = showPopup);

            const langSelect = document.getElementById('lang-select');
            if (langSelect) {
                langSelect.insertAdjacentElement('afterend', banner);
            } else {
                document.body.prepend(banner);
            }
            
            setTimeout(() => {
                if (document.body.contains(banner)) {
                    banner.remove();
                    localStorage.setItem('last_update_viewed', data.sha);
                }
            }, 15000);
        }
    } catch (err) {
        console.warn("Update check failed:", err);
    }
}

async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        return response.ok ? await response.json() : null;
    } catch (err) {
        return null;
    }
}

async function fetchOptionalAppList(url, errorElementId, fallbackUrl = null) {
    try {
        const data = await fetchJSON(url);
        if (data) return { data, source: url.includes('githubusercontent') ? 'github' : 'local' };
        
        if (fallbackUrl && url !== fallbackUrl) {
            const fallbackData = await fetchJSON(fallbackUrl);
            if (fallbackData) return { data: fallbackData, source: 'local' };
        }
        return null;
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
    const appList = document.getElementById('appList');
    const globalLoader = document.getElementById('globalLoader');
    
    checkForProjectUpdates();

    const t = getTranslation();

    appList.innerHTML = '';
    if (globalLoader) {
        globalLoader.style.display = 'block';
        globalLoader.innerText = t.loading || 'Lade Apps...';
    }

    document.getElementById('greelanLoadError').style.display = 'none';
    document.getElementById('customLoadError').style.display = 'none';

    let allApps = [];
    const config = window.config || { features: { customApps: true, GreelanApps: true, gitUpdate: false } };
    const customAppsEnabled = config.features && config.features.customApps !== false;
    const greelanAppsEnabled = config.features && config.features.GreelanApps !== false;

    const showCustom = customAppsEnabled && (localStorage.getItem('show_custom_apps') === 'true');
    const showGreelan = greelanAppsEnabled && (localStorage.getItem('show_greelan_apps') === 'true');

    const gitUpdate = config.features && config.features.gitUpdate === true;
    const remoteBase = config.remoteBase || 'https://raw.githubusercontent.com/Blutmonsterr/amp-cubecoders-app-catalog/main/';

    const urlParams = new URLSearchParams(window.location.search);
    const appParam = urlParams.get('app')?.toUpperCase();

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
        const isGitHub = app._source === 'github';
        li.innerHTML = `
            <div class="app-item${app.isNew ? ' new-app' : ''}${app.isBeta ? ' beta-app' : ''}">
                <div class="app-info">
                    <span class="app-name">${escapeHtml(app.name)}</span>
                    <span class="app-desc">${escapeHtml(app.desc || '')}</span>
                    <span class="app-alias" style="display:none;">${escapeHtml(app.alias || '')}</span>
                </div>
                <div class="image-container">
                    <div class="img-loader"></div>
                    <img src="images/games/${app.image}" alt="${escapeHtml(app.name)}" class="app-image" loading="lazy" decoding="async">
                    <span class="card-source-badge ${isGitHub ? 'live' : 'local'}" title="${isGitHub ? 'GitHub Raw' : 'Local File'}"><i class="fa fa-${isGitHub ? 'github' : 'server'}"></i></span>
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
                this.src = 'images/placeholder.webp';
                this.style.opacity = '1';
                this.onerror = null;
            };
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
        let baseApps;
        let blocksRendered = 0;
        const basePath = 'js/apps/apps.json';
        const cacheBuster = `t=${Date.now()}`;
        
        // Fetch local first
        const localBase = await fetchJSON(basePath);
        if (!localBase) throw new Error("Could not load local apps.json");

        if (gitUpdate) {
            const remoteBaseData = await fetchJSON(`${remoteBase}${basePath}?${cacheBuster}`);
            baseApps = mergeAppLists(localBase, remoteBaseData);
        } else {
            baseApps = localBase.map(a => ({ ...a, _source: 'local' }));
        }

        if (baseApps && baseApps.length > 0) {
            renderBlock(baseApps, appList);
            blocksRendered++;
            allApps = allApps.concat(baseApps);
        }

        // --- Block 2: Greelan Apps (Optional) ---
        if (showGreelan) {
            const greelanPath = 'js/apps/apps-g.json';
            const localG = await fetchJSON(greelanPath) || [];
            let finalG;
            
            if (gitUpdate) {
                const remoteG = await fetchJSON(`${remoteBase}${greelanPath}?${cacheBuster}`);
                finalG = mergeAppLists(localG, remoteG);
            } else {
                finalG = localG.map(a => ({ ...a, _source: 'local' }));
            }

            if (finalG && finalG.length > 0) {
                if (blocksRendered > 0) renderSeparator(appList);
                renderBlock(finalG, appList);
                blocksRendered++;
                allApps = allApps.concat(finalG);
            }
        }

        // --- Block 3: Custom Apps (Optional) ---
        if (showCustom) {
            const localC = await fetchJSON('js/apps/apps-c.json');
            if (localC && localC.length > 0) {
                const finalC = localC.map(a => ({ ...a, _source: 'local' }));
                if (blocksRendered > 0) renderSeparator(appList);
                renderBlock(finalC, appList);
                blocksRendered++;
                allApps = allApps.concat(finalC);
            }
        }

        if (globalLoader) globalLoader.style.display = 'none';

        cacheAppElements();
        filterApps();

        if (appParam) {
            const target = allApps.find(a => a.name.toUpperCase() === appParam);
            if (target) {
                setTimeout(() => openModal(target), 100);
            }
        }
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

        .card-source-badge { position: absolute; bottom: 8px; left: 8px; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; z-index: 5; display: flex; align-items: center; gap: 3px; }
        .card-source-badge.live { background: rgba(39, 174, 96, 0.2); color: #2ecc71; border: 1px solid rgba(39, 174, 96, 0.4); }
        .card-source-badge.local { background: rgba(149, 165, 166, 0.2); color: #bdc3c7; border: 1px solid rgba(149, 165, 166, 0.4); }

        .update-nav-button { margin: 10px 15px; background: linear-gradient(135deg, rgba(57, 181, 74, 0.15) 0%, rgba(30, 30, 30, 0.9) 100%); backdrop-filter: blur(10px); color: #fff; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 12px; border: 1px solid rgba(57, 181, 74, 0.3); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; cursor: default; animation: slideInDown 0.5s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .update-nav-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); border-color: rgba(57, 181, 74, 0.6); }
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
        .update-nav-button i { color: #39b54a; font-size: 1.2rem; animation: pulse-icon 2s infinite; cursor: pointer; }
        @keyframes pulse-icon { 0% { transform: scale(1); opacity: 1; text-shadow: 0 0 0 rgba(57, 181, 74, 0); } 50% { transform: scale(1.1); opacity: 0.8; text-shadow: 0 0 8px rgba(57, 181, 74, 0.6); } 100% { transform: scale(1); opacity: 1; text-shadow: 0 0 0 rgba(57, 181, 74, 0); } }
        .update-text-container { font-size: 0.9rem; flex-grow: 1; font-family: "Montserrat", sans-serif; font-weight: 500; letter-spacing: 0.5px; cursor: pointer; }
        .close-update { background: rgba(255, 255, 255, 0.1); border: none; color: #ccc; cursor: pointer; font-size: 1.2rem; line-height: 1; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; }
        .close-update:hover { background: rgba(255, 255, 255, 0.2); color: #fff; transform: rotate(90deg); }

        .update-popup-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeInBackdrop 0.3s; }
        .update-popup-box { background: #1e1e1e; padding: 25px; border-radius: 8px; border: 1px solid rgba(57, 181, 74, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.5); max-width: 400px; width: 90%; text-align: center; color: #fff; animation: slideInDown 0.3s; }
        .update-popup-box h3 { margin-top: 0; color: #39b54a; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1.3rem; }
        .update-popup-box p { font-size: 1rem; line-height: 1.5; color: #ccc; margin-bottom: 20px; font-family: "Montserrat", sans-serif; }
        .update-popup-btn { background: #39b54a; color: #fff; border: none; padding: 10px 25px; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: bold; transition: opacity 0.3s; }
        .update-popup-btn:hover { opacity: 0.8; }
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
                <img src="images/games/${app.image}" alt="${escapeHtml(app.name)}" class="modal-app-image" decoding="async">
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