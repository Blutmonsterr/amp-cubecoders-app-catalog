function initSearchHelp() {
    const config = window.config || { features: {} };
    
    if (config.features && config.features.searchHelp && config.features.searchHelp.enabled) {
        const infoBtn = document.getElementById('searchInfoBtn');
        if (infoBtn) {
            infoBtn.style.display = 'block';
            infoBtn.tabIndex = 0;
            infoBtn.setAttribute('role', 'button');
            
            const tooltip = document.createElement('div');
            tooltip.className = 'search-help-tooltip';
            document.body.appendChild(tooltip);

            const updateTooltip = () => {
                const t = typeof getTranslation === 'function' ? getTranslation() : {};
                
                let listHtml = '<ul>';
                const items = config.features.searchHelp.items || [];
                items.forEach(itemKey => {
                    const text = t[itemKey] || itemKey;
                    listHtml += `<li>${text}</li>`;
                });
                listHtml += '</ul>';

                tooltip.innerHTML = listHtml;
            };

            const showTooltip = () => {
                updateTooltip();
                const rect = infoBtn.getBoundingClientRect();
                tooltip.style.top = `${rect.bottom + 10}px`;
                const centerX = rect.left + rect.width / 2;
                const halfWidth = Math.min(160, window.innerWidth / 2 - 16);
                const clampedX = Math.max(halfWidth + 16, Math.min(window.innerWidth - halfWidth - 16, centerX));
                tooltip.style.left = `${clampedX}px`;
                tooltip.classList.add('visible');
            };

            const hideTooltip = () => {
                tooltip.classList.remove('visible');
            };

            infoBtn.addEventListener('mouseenter', () => {
                if (window.innerWidth > 768) showTooltip();
            });
            infoBtn.addEventListener('mouseleave', () => {
                if (window.innerWidth > 768) hideTooltip();
            });
            infoBtn.addEventListener('focus', showTooltip);
            infoBtn.addEventListener('blur', hideTooltip);
            infoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (tooltip.classList.contains('visible')) {
                    hideTooltip();
                } else {
                    showTooltip();
                }
            });

            document.addEventListener('click', (e) => {
                if (!tooltip.contains(e.target) && !infoBtn.contains(e.target)) {
                    hideTooltip();
                }
            });
            window.addEventListener('scroll', hideTooltip, { passive: true });
        }
    }
}