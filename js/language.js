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

    const t = window.translations[lang];
    const config = window.config || {};
    
    const bindings = [
        { id: 'pageHeading', text: config.title || t.heading },
        { sel: '#no-results p', text: t.noResults },
        { id: 'infoTooltipText', text: t.settingsTooltip },
        { id: 'customAppsLabel', text: t.customApps },
        { id: 'filterBtnAll', text: t.filterAll },
        { id: 'filterBtnNew', text: t.filterNew },
        { id: 'filterBtnCrossplayText', text: t.filterCrossplay },
        { id: 'greelanLoadError', attr: 'title', text: t.loadListError },
        { id: 'customLoadError', attr: 'title', text: t.loadListError },
        { sel: '#go-top a', attr: 'title', text: t.backToTop },
        { id: 'update-notice-text', text: t.updateAvailable }
    ];

    bindings.forEach(({ id, sel, text, attr }) => {
        if (!text) return;
        const el = id ? document.getElementById(id) : document.querySelector(sel);
        if (el) el[attr || 'innerText'] = text;
    });

    const input = document.getElementById('searchInput');
    if (input) input.placeholder = config.placeholder || t.placeholder;

    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        const customText = config.features && config.features.backButton && config.features.backButton.text;
        backBtn.innerText = customText || t.back;
    }

    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = lang;

    filterApps();
}

function initLanguage() {
    const config = window.config || { language: { enabled: true, default: 'de' } };
    let savedLang = localStorage.getItem('web_lang');
    let langToLoad = null;
    
    if (config.language.enabled === false) {
        langToLoad = config.language.default;
        const langSelect = document.getElementById('lang-select');
        if (langSelect) langSelect.style.display = 'none';
    } else {
        langToLoad = savedLang || config.language.default || 'de';

        if (config.language.disabled && config.language.disabled.length > 0) {
            const langSelect = document.getElementById('lang-select');
            if (langSelect) {
                const options = langSelect.options;
                for (let i = 0; i < options.length; i++) {
                    if (config.language.disabled.includes(options[i].value)) options[i].style.display = 'none';
                }
            }
        }
    }

    if (!window.translations || !window.translations[langToLoad]) {
        console.error(`Language file for '${langToLoad}' not found or invalid. Attempting to fall back.`);
        
        let fallbackLang = (config.language && config.language.default) || 'en';
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