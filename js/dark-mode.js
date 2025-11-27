// Dark Mode Toggle Functionality
function toggleDarkMode() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
        html.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
    } else {
        html.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
    }
}

// Check for saved dark mode preference on page load
(function() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.documentElement.classList.add('dark');
    }
})();
