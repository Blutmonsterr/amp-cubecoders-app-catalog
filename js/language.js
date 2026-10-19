let currentLang = 'de';

function getTranslation() {
    return window.translations && window.translations[currentLang] ? window.translations[currentLang] : {};
}

function changeLanguage(lang) {
    if (lang === currentLang) return;
    localStorage.setItem('web_lang', lang);
    setLanguage(lang);
}

function setLanguage(lang) {
    if (!window.translations || !window.translations[lang]) return;
    
    currentLang = lang;
    document.documentElement.lang = lang;

    const t = window.translations[lang];
    const config = window.config || {};
    
    const bindings = [
        { id: 'pageHeading', text: config.title || t.heading },
        { sel: '#no-results p', text: t.noResults },
        { id: 'infoTooltipText', text: t.settingsTooltip },
        { id: 'customAppsLabel', text: t.customApps },
        { id: 'filterBtnAll', text: t.filterAll },
        { id: 'filterBtnNew', text: t.filterNew },
        { id: 'filterBtnBeta', text: t.filterBeta },
        { id: 'filterBtnCrossplayText', text: t.filterCrossplay },
        { id: 'filterBtnCrossplayTooltip', text: t.filterCrossplayTooltip || 'Crossplay über den DDE Server möglich (PC, Xbox, PSN/PS4/PS5, etc.). Info: Es kann zu Fehlern kommen!' },
        { id: 'greelanLoadError', attr: 'title', text: t.loadListError },
        { id: 'customLoadError', attr: 'title', text: t.loadListError },
        { sel: '#go-top a', attr: 'title', text: t.backToTop },
        { id: 'update-notice-text', text: t.updateAvailable },
        { sel: '.settings-dropbtn', attr: 'aria-label', text: t.settingsAria },
        { id: 'searchInput', attr: 'aria-label', text: t.searchAria }
    ];

    bindings.forEach(({ id, sel, text, attr }) => {
        if (!text) return;
        const el = id ? document.getElementById(id) : document.querySelector(sel);
        if (!el) return;
        if (attr && attr.startsWith('aria-')) {
            el.setAttribute(attr, text);
        } else {
            el[attr || 'innerText'] = text;
        }
    });

    const globalLoader = document.getElementById('globalLoader');
    if (globalLoader && globalLoader.style.display !== 'none' && !globalLoader.dataset.hasError) {
        globalLoader.innerText = t.loading || 'Lade Apps...';
    }

    const input = document.getElementById('searchInput');
    if (input) input.placeholder = config.placeholder || t.placeholder || '...';

    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        const customText = config.features && config.features.backButton && config.features.backButton.text;
        backBtn.innerText = customText || t.back;
    }

    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = lang;

    const newLabel = t.filterNew || 'Neu';
    document.querySelectorAll('.app-item.new-app').forEach(el => {
        el.setAttribute('data-new-label', newLabel);
    });

    const crossplayLabel = t.filterCrossplay || 'Crossplay';
    document.querySelectorAll('.card-crossplay-badge').forEach(el => {
        el.title = crossplayLabel;
    });

    if (typeof appCache !== 'undefined' && appCache.length > 0) {
        filterApps();
    }
}

function initLanguage() {
    const config = window.config || { language: { enabled: true, default: 'de' } };
    const langConfig = config.language || { enabled: true, default: 'de' };
    const langSelect = document.getElementById('lang-select');

    if (langSelect && window.translations) {
        const existingValues = new Set(Array.from(langSelect.options).map(o => o.value));
        Object.keys(window.translations).forEach(code => {
            if (!existingValues.has(code)) {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = code.toUpperCase();
                langSelect.appendChild(opt);
            }
        });
    }

    let savedLang = localStorage.getItem('web_lang');
    let langToLoad = null;
    const disabledLangs = Array.isArray(langConfig.disabled) ? langConfig.disabled : [];
    
    if (langConfig.enabled === false) {
        langToLoad = langConfig.default || 'de';
        if (langSelect) langSelect.style.display = 'none';
    } else {
        if (savedLang && disabledLangs.includes(savedLang)) {
            savedLang = null;
        }
        langToLoad = savedLang || langConfig.default || 'de';

        if (disabledLangs.length > 0 && langSelect) {
            Array.from(langSelect.options).forEach(opt => {
                if (disabledLangs.includes(opt.value)) {
                    opt.hidden = true;
                    opt.disabled = true;
                    opt.style.display = 'none';
                }
            });
        }
    }

    if (!window.translations || !window.translations[langToLoad]) {
        console.error(`Language file for '${langToLoad}' not found or invalid. Attempting to fall back.`);
        
        let fallbackLang = langConfig.default || 'en';
        if (!window.translations || !window.translations[fallbackLang]) {
            fallbackLang = 'en';
        }

        if (!window.translations || !window.translations[fallbackLang]) {
            const emergency_t = window.translations && window.translations['de'] ? window.translations['de'] : {};
            const criticalMsg = emergency_t.criticalLangError || 'CRITICAL ERROR: Core language files (e.g., en.js) are missing.';
            document.body.innerHTML = `<div style="color:red; text-align:center; padding: 2rem; font-family: sans-serif;">${criticalMsg}</div>`;
            return;
        }

        langToLoad = fallbackLang;
        const t = window.translations[langToLoad];
        const errorMsg = t.langLoadError || `Could not load language file. Switched to default.`;
        const errorDiv = document.getElementById('langLoadError');
        if (errorDiv) {
            errorDiv.innerText = errorMsg;
            errorDiv.style.display = 'block';
        }
    }

    setLanguage(langToLoad);
}