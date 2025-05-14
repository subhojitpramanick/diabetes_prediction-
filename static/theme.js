/**
 * Theme Toggle Functionality
 * Allows switching between light and dark modes with smooth transitions
 */

// Check for saved theme preference or use the system preference
document.addEventListener('DOMContentLoaded', function() {
    // Check if theme is saved in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Use saved theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateToggleUI(savedTheme === 'dark');
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        updateToggleUI(prefersDark);
    }
    
    // Apply initial animations
    applyInitialAnimations();
});

/**
 * Toggles between light and dark themes
 */
function toggleTheme() {
    const checkbox = document.getElementById('theme-toggle');
    const isDark = checkbox.checked;
    
    // Update HTML attribute
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Save preference to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update the toggle UI
    updateToggleUI(isDark);
    
    // Add transition effect to body
    addThemeTransitionEffect();
}

/**
 * Updates the toggle UI based on theme
 * @param {boolean} isDark - Whether the theme is dark
 */
function updateToggleUI(isDark) {
    const toggleCheckbox = document.getElementById('theme-toggle');
    const toggleIcon = document.getElementById('toggle-icon');
    
    // Update checkbox state
    toggleCheckbox.checked = isDark;
    
    // Update icon
    if (isDark) {
        toggleIcon.classList.remove('fa-sun');
        toggleIcon.classList.add('fa-moon');
    } else {
        toggleIcon.classList.remove('fa-moon');
        toggleIcon.classList.add('fa-sun');
    }
}

/**
 * Adds transition effect when changing themes
 */
function addThemeTransitionEffect() {
    // Create overlay for transition effect
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    overlay.style.zIndex = '9999';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.pointerEvents = 'none';
    
    document.body.appendChild(overlay);
    
    // Fade in
    setTimeout(() => {
        overlay.style.opacity = '0.3';
    }, 50);
    
    // Fade out and remove
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 300);
    }, 300);
    
    // Update charts if they exist
    updateChartsForTheme();
}

/**
 * Updates charts to match current theme
 */
function updateChartsForTheme() {
    if (window.riskChart) {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
        
        window.riskChart.options.plugins.title.color = textColor;
        window.riskChart.options.plugins.legend.labels.color = textColor;
        window.riskChart.options.scales.y.ticks.color = mutedColor;
        window.riskChart.options.scales.x.ticks.color = mutedColor;
        
        window.riskChart.update();
    }
}

/**
 * Apply initial subtle animations to page elements
 */
function applyInitialAnimations() {
    // Subtle entrance animation for the app card
    const appCard = document.querySelector('.app-card');
    if (appCard) {
        appCard.style.opacity = '0';
        appCard.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            appCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            appCard.style.opacity = '1';
            appCard.style.transform = 'translateY(0)';
        }, 300);
    }
    
    // Add pulse animation to interactive elements
    const buttons = document.querySelectorAll('.btn-primary, .btn-outline-primary');
    buttons.forEach(button => {
        button.addEventListener('mouseover', function() {
            this.classList.add('pulse');
        });
        
        button.addEventListener('mouseout', function() {
            this.classList.remove('pulse');
        });
    });
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
        // Only auto-switch if user hasn't manually set a preference
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateToggleUI(e.matches);
    }
});