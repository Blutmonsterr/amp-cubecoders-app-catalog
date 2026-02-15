function toggleTheme(isLight) {
    const theme = isLight ? 'light' : 'dark';
    setTheme(theme);
}

function setTheme(theme) {
    document.body.classList.toggle('light-mode', theme === 'light');
    localStorage.setItem('theme', theme);
}

document.addEventListener('DOMContentLoaded', () => {
    const config = window.config || {};
    const defaultTheme = (config.features && config.features.defaultTheme) || 'dark';
    const savedTheme = localStorage.getItem('theme') || defaultTheme;
    const toggle = document.getElementById('themeToggle');
    
    setTheme(savedTheme);
    if (toggle) {
        toggle.checked = (savedTheme === 'light');
    }
});