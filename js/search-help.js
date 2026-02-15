function initSearchHelp() {
    const config = window.config || { features: {} };
    
    if (config.features.searchHelp && config.features.searchHelp.enabled) {
        const infoBtn = document.getElementById('searchInfoBtn');
        if (infoBtn) {
            infoBtn.style.display = 'block';
            
            const tooltip = document.createElement('div');
            tooltip.className = 'search-help-tooltip';
            document.body.appendChild(tooltip);

            if (!document.getElementById('search-help-tooltip-styles')) {
                const style = document.createElement('style');
                style.id = 'search-help-tooltip-styles';
                style.textContent = `
                    .search-help-tooltip {
                        position: fixed;
                        background-color: #1e1e1e;
                        border: 1px solid #333;
                        padding: 15px;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                        z-index: 10000;
                        color: #fff;
                        width: max-content;
                        max-width: 300px;
                        text-align: left;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.2s, visibility 0.2s;
                        pointer-events: none;
                        transform: translateX(-50%);
                    }
                    .search-help-tooltip.visible {
                        opacity: 1;
                        visibility: visible;
                    }
                    .search-help-tooltip ul { padding-left: 20px; margin: 0; }
                    .search-help-tooltip li { margin-bottom: 4px; color: #ccc; font-size: 0.85rem; }
                    
                    body.light-theme .search-help-tooltip { background-color: #fff; color: #333; border-color: #ddd; }
                    body.light-theme .search-help-tooltip li { color: #555; }
                `;
                document.head.appendChild(style);
            }

            const updateTooltip = () => {
                const t = typeof getTranslation === 'function' ? getTranslation() : {};
                
                let listHtml = '<ul>';
                const items = config.features.searchHelp.items || [];
                items.forEach(itemKey => {
                    const text = t[itemKey] || itemKey;
                    listHtml += `<li>${text}</li>`;
                });
                listHtml += '</ul>';

                tooltip.innerHTML = `${listHtml}`;
            };

            infoBtn.addEventListener('mouseenter', function() {
                updateTooltip();
                const rect = infoBtn.getBoundingClientRect();
                tooltip.style.top = (rect.bottom + 10) + 'px';
                tooltip.style.left = (rect.left + rect.width / 2) + 'px';
                tooltip.classList.add('visible');
            });

            infoBtn.addEventListener('mouseleave', function() {
                tooltip.classList.remove('visible');
            });
        }
    }
}