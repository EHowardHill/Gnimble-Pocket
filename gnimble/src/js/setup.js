(function () {
    'use strict';

    // Store the saved values globally for reuse
    let savedColor = null;
    let savedWallpaper = null;

    // Color utility functions (inline for immediate use)
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function isLightColor(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return false;
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128;
    }

    function adjustBrightness(hex, percent) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;

        const adjust = (color) => {
            const adjusted = Math.round(color + (color * percent / 100));
            return Math.max(0, Math.min(255, adjusted));
        };

        const newR = adjust(rgb.r);
        const newG = adjust(rgb.g);
        const newB = adjust(rgb.b);

        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    // Function to apply colors immediately
    function applyColors() {
        try {
            savedColor = localStorage.getItem('gnimble-primary-color');
            if (savedColor) {
                // Apply the primary color
                document.documentElement.style.setProperty('--ion-color-primary', savedColor);

                // Generate and apply related color variations
                const rgb = hexToRgb(savedColor);
                if (rgb) {
                    document.documentElement.style.setProperty('--ion-color-primary-rgb', `${rgb.r},${rgb.g},${rgb.b}`);

                    // Generate contrast color
                    const isLight = isLightColor(savedColor);
                    const contrastColor = isLight ? '#000000' : '#ffffff';
                    document.documentElement.style.setProperty('--ion-color-primary-contrast', contrastColor);
                    document.documentElement.style.setProperty('--ion-color-primary-contrast-rgb',
                        isLight ? '0,0,0' : '255,255,255');

                    // Generate shade and tint
                    const shade = adjustBrightness(savedColor, -20);
                    const tint = adjustBrightness(savedColor, 20);

                    document.documentElement.style.setProperty('--ion-color-primary-shade', shade);
                    document.documentElement.style.setProperty('--ion-color-primary-tint', tint);

                    const shadeRgb = hexToRgb(shade);
                    const tintRgb = hexToRgb(tint);

                    if (shadeRgb) {
                        document.documentElement.style.setProperty('--ion-color-primary-shade-rgb',
                            `${shadeRgb.r},${shadeRgb.g},${shadeRgb.b}`);
                    }
                    if (tintRgb) {
                        document.documentElement.style.setProperty('--ion-color-primary-tint-rgb',
                            `${tintRgb.r},${tintRgb.g},${tintRgb.b}`);
                    }
                }

                console.log('Applied saved primary color:', savedColor);
            } else {
                console.log('No saved color found, using default');
            }
        } catch (error) {
            console.error('Error applying immediate colors:', error);
        }
    }

    // Function to apply wallpaper immediately
    function applyWallpaper() {
        try {
            savedWallpaper = localStorage.getItem('gnimble-wallpaper');
            if (savedWallpaper) {
                document.documentElement.style.setProperty('--wallpaper-image', `url("${savedWallpaper}")`);
                console.log('Applied saved wallpaper');
            } else {
                // Ensure default is set
                document.documentElement.style.setProperty('--wallpaper-image', 'url("../assets/imgs/wallpapers/lonely_nights_by_luxjii_dab523c-fullview.jpg")');
                console.log('Applied default wallpaper');
            }
        } catch (error) {
            console.error('Error applying immediate wallpaper:', error);
        }
    }

    function applyDarkMode() {
        try {
            const savedDarkMode = localStorage.getItem('gnimble-dark-mode');
            // If not set in localStorage, default to dark mode (true)
            const isDarkMode = savedDarkMode === null ? false : savedDarkMode === 'true';

            if (isDarkMode) {
                document.documentElement.classList.add('ion-palette-dark');
                console.log('Applied dark mode');
            } else {
                document.documentElement.classList.remove('ion-palette-dark');
                console.log('Applied light mode');
            }
        } catch (error) {
            console.error('Error applying immediate dark mode:', error);
        }
    }

    // Apply colors, wallpaper, and dark mode
    function applyTheme() {
        applyColors();
        applyWallpaper();
    }

    // Enhanced theme application with retries
    function applyThemeWithRetry() {
        applyTheme();

        // Retry after a short delay to handle timing issues
        setTimeout(applyTheme, 100);
        setTimeout(applyTheme, 300);
        setTimeout(applyTheme, 500);
    }

    // Set up navigation event listeners for SPA behavior
    function setupNavigationListeners() {
        // Listen for Ionic page transitions
        document.addEventListener('ionViewDidEnter', function (event) {
            console.log('Page entered:', event.target.tagName);
            applyThemeWithRetry();
        });

        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', function () {
            console.log('Popstate event detected');
            applyThemeWithRetry();
        });

        // Listen for hashchange (if using hash routing)
        window.addEventListener('hashchange', function () {
            console.log('Hash change detected');
            applyThemeWithRetry();
        });

        // Watch for URL changes (for history.pushState)
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function () {
            originalPushState.apply(history, arguments);
            console.log('PushState detected');
            setTimeout(applyThemeWithRetry, 50);
        };

        history.replaceState = function () {
            originalReplaceState.apply(history, arguments);
            console.log('ReplaceState detected');
            setTimeout(applyThemeWithRetry, 50);
        };
    }

    // Watch for DOM mutations and reapply theme to new elements
    function setupMutationObserver() {
        const observer = new MutationObserver(function (mutations) {
            let shouldReapply = false;

            mutations.forEach(function (mutation) {
                // Check if new ion-content or page elements were added
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName && (
                            node.tagName.startsWith('ION-') ||
                            node.classList.contains('page') ||
                            node.querySelector && (
                                node.querySelector('ion-content') ||
                                node.querySelector('.wallpaper')
                            )
                        )) {
                            shouldReapply = true;
                        }
                    }
                });
            });

            if (shouldReapply) {
                console.log('DOM change detected, reapplying theme');
                setTimeout(applyTheme, 10);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize everything
    function initialize() {
        applyTheme();
        setupNavigationListeners();
        setupMutationObserver();

        // Apply on various load events
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyThemeWithRetry);
        } else {
            applyThemeWithRetry();
        }

        window.addEventListener('load', applyThemeWithRetry);

        // Set up interval to periodically check and reapply (fallback)
        setInterval(function () {
            const currentColor = getComputedStyle(document.documentElement).getPropertyValue('--ion-color-primary').trim();
            const currentDarkMode = document.documentElement.classList.contains('ion-palette-dark');
            const savedDarkModeSetting = localStorage.getItem('gnimble-dark-mode');

            if ((savedColor && currentColor !== savedColor) || (currentDarkMode !== savedDarkModeSetting)) {
                console.log('Theme drift detected, reapplying');
                applyTheme();
            }
        }, 2000);
    }

    // Start initialization
    initialize();
})();