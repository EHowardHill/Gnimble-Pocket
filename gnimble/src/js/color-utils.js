// color-utils.js
// Global color, wallpaper, and dark mode management utility for Gnimble app

class ColorUtils {
    // Color utility methods
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static isLightColor(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return false;
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128;
    }

    static adjustBrightness(hex, percent) {
        const rgb = this.hexToRgb(hex);
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

    // Color CSS application and management
    static applyColorToCSS(color) {
        try {
            // Apply the primary color
            document.documentElement.style.setProperty('--ion-color-primary', color);

            // Generate and apply related color variations
            const rgb = this.hexToRgb(color);
            if (rgb) {
                document.documentElement.style.setProperty('--ion-color-primary-rgb', `${rgb.r},${rgb.g},${rgb.b}`);

                // Generate contrast color
                const isLight = this.isLightColor(color);
                const contrastColor = isLight ? '#000000' : '#ffffff';
                document.documentElement.style.setProperty('--ion-color-primary-contrast', contrastColor);
                document.documentElement.style.setProperty('--ion-color-primary-contrast-rgb',
                    isLight ? '0,0,0' : '255,255,255');

                // Generate shade and tint
                const shade = this.adjustBrightness(color, -20);
                const tint = this.adjustBrightness(color, 20);

                document.documentElement.style.setProperty('--ion-color-primary-shade', shade);
                document.documentElement.style.setProperty('--ion-color-primary-tint', tint);

                const shadeRgb = this.hexToRgb(shade);
                const tintRgb = this.hexToRgb(tint);

                if (shadeRgb) {
                    document.documentElement.style.setProperty('--ion-color-primary-shade-rgb',
                        `${shadeRgb.r},${shadeRgb.g},${shadeRgb.b}`);
                }
                if (tintRgb) {
                    document.documentElement.style.setProperty('--ion-color-primary-tint-rgb',
                        `${tintRgb.r},${tintRgb.g},${tintRgb.b}`);
                }
            }
        } catch (error) {
            console.error('Error applying color to CSS:', error);
        }
    }

    static loadSavedColor() {
        try {
            const savedColor = localStorage.getItem('gnimble-primary-color');
            if (savedColor) {
                this.applyColorToCSS(savedColor);
                return savedColor;
            }
            return null;
        } catch (error) {
            console.error('Error loading saved color:', error);
            return null;
        }
    }

    static saveColor(color) {
        try {
            localStorage.setItem('gnimble-primary-color', color);
            this.applyColorToCSS(color);
            return true;
        } catch (error) {
            console.error('Error saving color:', error);
            return false;
        }
    }

    static getSavedColor() {
        try {
            return localStorage.getItem('gnimble-primary-color') || '#3880ff';
        } catch (error) {
            console.error('Error getting saved color:', error);
            return '#3880ff';
        }
    }

    // Wallpaper management methods
    static applyWallpaperToCSS(wallpaperData) {
        try {
            // Apply the wallpaper using CSS custom property
            if (wallpaperData) {
                document.documentElement.style.setProperty('--wallpaper-image', `url("${wallpaperData}")`);
            } else {
                document.documentElement.style.setProperty('--wallpaper-image', 'url("../assets/imgs/wallpapers/lonely_nights_by_luxjii_dab523c-fullview.jpg")');
            }

            // Also apply directly to any existing .wallpaper elements as a fallback
            const wallpaperElements = document.querySelectorAll('.wallpaper');
            wallpaperElements.forEach(element => {
                if (wallpaperData) {
                    element.style.setProperty('--wallpaper-image', `url("${wallpaperData}")`);
                } else {
                    element.style.removeProperty('--wallpaper-image');
                }
            });
        } catch (error) {
            console.error('Error applying wallpaper to CSS:', error);
        }
    }

    static loadSavedWallpaper() {
        try {
            const savedWallpaper = localStorage.getItem('gnimble-wallpaper');
            if (savedWallpaper) {
                this.applyWallpaperToCSS(savedWallpaper);
                return savedWallpaper;
            } else {
                this.applyWallpaperToCSS(null); // Apply default
            }
            return null;
        } catch (error) {
            console.error('Error loading saved wallpaper:', error);
            return null;
        }
    }

    static saveWallpaper(wallpaperData) {
        try {
            if (wallpaperData) {
                localStorage.setItem('gnimble-wallpaper', wallpaperData);
            } else {
                localStorage.removeItem('gnimble-wallpaper');
            }
            this.applyWallpaperToCSS(wallpaperData);
            return true;
        } catch (error) {
            console.error('Error saving wallpaper:', error);
            return false;
        }
    }

    static getSavedWallpaper() {
        try {
            return localStorage.getItem('gnimble-wallpaper');
        } catch (error) {
            console.error('Error getting saved wallpaper:', error);
            return null;
        }
    }

    // Dark mode management methods
    static applyDarkModeToCSS(isDarkMode) {
        try {
            if (isDarkMode) {
                document.documentElement.classList.add('ion-palette-dark');
                console.log('Dark mode applied');
            } else {
                document.documentElement.classList.remove('ion-palette-dark');
                console.log('Light mode applied');
            }
        } catch (error) {
            console.error('Error applying dark mode to CSS:', error);
        }
    }

    static loadSavedDarkMode() {
        try {
            const savedDarkMode = localStorage.getItem('gnimble-dark-mode');
            const isDarkMode = savedDarkMode === 'true';
            this.applyDarkModeToCSS(isDarkMode);
            return isDarkMode;
        } catch (error) {
            console.error('Error loading saved dark mode:', error);
            return false;
        }
    }

    static saveDarkMode(isDarkMode) {
        try {
            localStorage.setItem('gnimble-dark-mode', isDarkMode.toString());
            this.applyDarkModeToCSS(isDarkMode);
            console.log('Dark mode saved:', isDarkMode);
            return true;
        } catch (error) {
            console.error('Error saving dark mode:', error);
            return false;
        }
    }

    static getSavedDarkMode() {
        try {
            const savedDarkMode = localStorage.getItem('gnimble-dark-mode');
            return savedDarkMode === 'true';
        } catch (error) {
            console.error('Error getting saved dark mode:', error);
            return false;
        }
    }

    // Watch for new .wallpaper elements and apply saved wallpaper
    static observeWallpaperElements() {
        try {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Check if the added node or its children have .wallpaper class
                            const wallpaperElements = node.classList && node.classList.contains('wallpaper') 
                                ? [node] 
                                : node.querySelectorAll ? node.querySelectorAll('.wallpaper') : [];
                                
                            if (wallpaperElements.length > 0) {
                                const savedWallpaper = this.getSavedWallpaper();
                                wallpaperElements.forEach(element => {
                                    if (savedWallpaper) {
                                        element.style.setProperty('--wallpaper-image', `url("${savedWallpaper}")`);
                                    }
                                });
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (error) {
            console.error('Error setting up wallpaper observer:', error);
        }
    }

    // Enhanced initialization method
    static initializeColors() {
        this.loadSavedColor();
        this.loadSavedWallpaper();
        this.loadSavedDarkMode();
        
        // Also watch for DOM changes and reapply wallpaper to new elements
        this.observeWallpaperElements();
    }
}

// Auto-initialize when the script loads
ColorUtils.initializeColors();

export default ColorUtils;