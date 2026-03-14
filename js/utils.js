function initUtils() {
    const notFoundImg = document.querySelector('.not-found-image');
    if (notFoundImg) {
        const fallbackSrc = 'images/placeholder.webp';
        notFoundImg.onerror = function() {
            this.src = fallbackSrc;
            this.onerror = null;
        };
        if (notFoundImg.complete && notFoundImg.naturalWidth === 0) {
            notFoundImg.src = fallbackSrc;
        }
    }

    const goTopBtn = document.getElementById('go-top');
    if (goTopBtn) {
        
        const throttledScroll = throttle(function() {
            if (window.scrollY > 300) {
                goTopBtn.style.display = 'block';
            } else {
                goTopBtn.style.display = 'none';
            }
        }, 150);

        window.addEventListener('scroll', throttledScroll);

        const topLink = goTopBtn.querySelector('a');
        if (topLink) {
            topLink.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}