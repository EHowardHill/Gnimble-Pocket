// pages/settings.js
import ColorUtils from '../color-utils.js';

// Define Settings Page Component
class PageSettings extends HTMLElement {
    constructor() {
        super();
        this.currentPrimaryColor = '#3880ff'; // Default Ionic primary color
        this.selectedWallpaper = null; // Store selected wallpaper data
        this.isDarkMode = false; // Track dark mode state
    }

    async connectedCallback() {
        try {
            // Get current saved color
            this.currentPrimaryColor = ColorUtils.getSavedColor();
            
            // Load saved wallpaper
            this.loadSavedWallpaper();
            
            // Load saved dark mode preference
            this.loadSavedDarkMode();
            
            // Render the page
            this.render();
            
            // Setup event listeners after rendering
            this.setupEventListeners();
            
            // Update the selected color option
            this.updateSelectedOption();
            
            // Update wallpaper preview
            this.updateWallpaperPreview();
            
            // Update dark mode toggle
            this.updateDarkModeToggle();
            
        } catch (error) {
            console.error('Error initializing settings page:', error);
            this.renderError();
        }
    }

    getCurrentPrimaryColor() {
        try {
            const cssColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--ion-color-primary').trim();
            return cssColor || '#3880ff';
        } catch (error) {
            console.error('Error getting current primary color:', error);
            return '#3880ff';
        }
    }

    loadSavedWallpaper() {
        try {
            this.selectedWallpaper = ColorUtils.getSavedWallpaper();
        } catch (error) {
            console.error('Error loading saved wallpaper:', error);
        }
    }

    loadSavedDarkMode() {
        try {
            this.isDarkMode = ColorUtils.getSavedDarkMode();
        } catch (error) {
            console.error('Error loading saved dark mode:', error);
        }
    }

    updateWallpaperPreview() {
        try {
            const preview = this.querySelector('#wallpaper-preview');
            const status = this.querySelector('#wallpaper-status');
            const actions = this.querySelector('#wallpaper-actions');
            
            if (this.selectedWallpaper) {
                // For the preview, we'll set a custom property specifically for this preview element
                if (preview) {
                    preview.style.setProperty('--wallpaper-image', `url("${this.selectedWallpaper}")`);
                }
                if (status) {
                    status.textContent = 'Custom wallpaper';
                }
                // Show reset button for existing custom wallpaper
                if (actions) {
                    actions.style.display = 'flex';
                    // Hide apply button, show only reset button
                    const applyBtn = this.querySelector('#apply-wallpaper-btn');
                    const resetBtn = this.querySelector('#reset-wallpaper-btn');
                    if (applyBtn) applyBtn.style.display = 'none';
                    if (resetBtn) resetBtn.style.display = 'block';
                }
            } else {
                // Reset preview to default
                if (preview) {
                    preview.style.removeProperty('--wallpaper-image');
                }
                if (status) {
                    status.textContent = 'Default wallpaper';
                }
                if (actions) {
                    actions.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error updating wallpaper preview:', error);
        }
    }

    handleWallpaperSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select a valid image file.');
            return;
        }

        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showToast('Image file is too large. Please select an image under 5MB.');
            return;
        }

        // Read the file as base64
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.selectedWallpaper = e.target.result;
                this.updateWallpaperPreview();
                
                // Show action buttons
                const actions = this.querySelector('#wallpaper-actions');
                const applyBtn = this.querySelector('#apply-wallpaper-btn');
                const resetBtn = this.querySelector('#reset-wallpaper-btn');
                if (actions) {
                    actions.style.display = 'flex';
                }
                if (applyBtn) applyBtn.style.display = 'block';
                if (resetBtn) resetBtn.style.display = 'block';
                
                this.showToast('Wallpaper selected! Click "Apply Wallpaper" to use it.');
            } catch (error) {
                console.error('Error processing wallpaper:', error);
                this.showToast('Error processing image. Please try again.');
            }
        };
        
        reader.onerror = () => {
            this.showToast('Error reading image file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    applySelectedWallpaper() {
        try {
            if (!this.selectedWallpaper) {
                this.showToast('No wallpaper selected.');
                return;
            }

            const success = ColorUtils.saveWallpaper(this.selectedWallpaper);
            if (success) {
                // Hide action buttons
                const actions = this.querySelector('#wallpaper-actions');
                if (actions) {
                    actions.style.display = 'none';
                }
                this.showToast('Wallpaper applied successfully!');
            } else {
                this.showToast('Error applying wallpaper. Please try again.');
            }
        } catch (error) {
            console.error('Error applying wallpaper:', error);
            this.showToast('Error applying wallpaper. Please try again.');
        }
    }

    resetWallpaper() {
        try {
            this.selectedWallpaper = null;
            const success = ColorUtils.saveWallpaper(null);
            
            if (success) {
                // Update preview
                this.updateWallpaperPreview();
                
                // Hide action buttons
                const actions = this.querySelector('#wallpaper-actions');
                if (actions) {
                    actions.style.display = 'none';
                }
                
                // Clear file input
                const input = this.querySelector('#wallpaper-input');
                if (input) {
                    input.value = '';
                }
                
                this.showToast('Wallpaper reset to default!');
            } else {
                this.showToast('Error resetting wallpaper. Please try again.');
            }
        } catch (error) {
            console.error('Error resetting wallpaper:', error);
            this.showToast('Error resetting wallpaper. Please try again.');
        }
    }

    // Dark mode management methods
    updateDarkModeToggle() {
        try {
            const toggle = this.querySelector('#dark-mode-toggle');
            if (toggle) {
                toggle.checked = this.isDarkMode;
            }
        } catch (error) {
            console.error('Error updating dark mode toggle:', error);
        }
    }

    toggleDarkMode(isEnabled) {
        try {
            this.isDarkMode = isEnabled;
            const success = ColorUtils.saveDarkMode(isEnabled);
            
            if (success) {
                this.showToast(isEnabled ? 'Dark mode enabled!' : 'Light mode enabled!');
            } else {
                this.showToast('Error changing theme. Please try again.');
            }
        } catch (error) {
            console.error('Error toggling dark mode:', error);
            this.showToast('Error changing theme. Please try again.');
        }
    }

    render() {
        try {
            // Color options
            const colorOptions = [
                '#3880ff', '#3dc2ff', '#2fdf75', '#ffce00',
                '#ff6b6b', '#fc4077', '#8b5cf6', '#06d6a0',
                '#f72585', '#4cc9f0', '#ffd23f', '#e09f3e'
            ].map(color => `
                <div class="color-option" data-color="${color}" style="background-color: ${color}"></div>
            `).join('');

            this.innerHTML = `
                <ion-page>
                    <ion-header>
                        <ion-toolbar color="primary">
                            <ion-buttons slot="start">
                                <ion-button id="back-btn" fill="clear">
                                    <ion-icon name="arrow-back"></ion-icon>
                                </ion-button>
                            </ion-buttons>
                            <ion-title>Settings</ion-title>
                        </ion-toolbar>
                    </ion-header>

                    <ion-content class="wallpaper" style="--padding-start: 0; --padding-end: 0;">
                        <div class="settings-container">
                            <!-- Theme Section -->
                            <div class="settings-section">
                               
                                <!-- Dark Mode Toggle -->
                                <ion-card>
                                    <ion-card-content>
                                        <ion-item>
                                            <ion-icon name="moon-outline" slot="start"></ion-icon>
                                            <ion-label>
                                                <h3>Dark Mode</h3>
                                                
                                            </ion-label>
                                            <ion-toggle id="dark-mode-toggle" slot="end"></ion-toggle>
                                        </ion-item>
                                    </ion-card-content>
                                </ion-card>
                                
                                <!-- Primary Color -->
                                <ion-card>
                                    <ion-card-content>                                        
                                        <div class="color-grid" id="color-grid">
                                            ${colorOptions}
                                        </div>
                                        
                                        <div class="action-buttons">
                                            <ion-button expand="block" id="apply-color-btn">
                                                Apply Color
                                            </ion-button>
                                        </div>
                                    </ion-card-content>
                                </ion-card>                           
                                <ion-card>
                                    <ion-card-header>
                                        <ion-card-title>Background Image</ion-card-title>
                                    </ion-card-header>
                                    <ion-card-content>
                                        <div style="display: flex; width: 100%;">
                                            <div style="flex: 1;"> </div>
                                            <div class="wallpaper-preview" id="wallpaper-preview"> </div>
                                            <div style="flex: 1;"> </div>
                                        </div>
                                        
                                        <div class="wallpaper-upload">
                                            <input type="file" id="wallpaper-input" accept="image/*" style="display: none;">
                                            <ion-button expand="block" fill="outline" id="select-wallpaper-btn">
                                                <ion-icon name="image-outline" slot="start"></ion-icon>
                                                Select New Wallpaper
                                            </ion-button>
                                        </div>
                                        
                                        <div class="action-buttons wallpaper-actions" id="wallpaper-actions" style="display: none;">
                                            <ion-button expand="block" id="apply-wallpaper-btn">
                                                Apply Wallpaper
                                            </ion-button>
                                            <ion-button expand="block" fill="outline" id="reset-wallpaper-btn">
                                                Reset to Default
                                            </ion-button>
                                        </div>
                                    </ion-card-content>
                                </ion-card>
                            </div>
                        </div>
                    </ion-content>
                </ion-page>

                <style>
                .settings-container {
                    padding: 16px;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .settings-section {
                    margin-bottom: 32px;
                }

                .settings-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 1.2em;
                    font-weight: 600;
                    padding-left: 8px;
                }

                .color-preview-container {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                    padding: 16px;
                    background: var(--ion-color-light);
                    border-radius: 8px;
                }

                .color-preview {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 3px solid var(--ion-color-medium);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .wallpaper-preview {
                    width: 100%;
                    height: 256px;
                    border-radius: 8px;
                    border: 3px solid var(--ion-color-medium);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    background: var(--wallpaper-overlay), var(--wallpaper-image);
                    background-size: cover;
                    background-position: 50% 50%;
                    margin-bottom: 12px;
                }

                .wallpaper-upload {
                    margin-bottom: 16px;
                }

                .wallpaper-actions {
                    margin-top: 8px;
                }

                .color-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .color-option {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 3px solid transparent;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .color-option:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                .color-option.selected {
                    border-color: var(--ion-color-dark);
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }

                .action-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .error-container {
                    padding: 40px;
                    text-align: center;
                }

                .error-container ion-icon {
                    font-size: 64px;
                    color: var(--ion-color-danger);
                    margin-bottom: 16px;
                }

                /* Dark mode specific styles */
                .ion-palette-dark .wallpaper-preview-container,
                .ion-palette-dark .color-preview-container {
                    background: var(--ion-color-dark);
                }
                </style>
            `;
        } catch (error) {
            console.error('Error rendering settings page:', error);
            this.renderError();
        }
    }

    renderError() {
        this.innerHTML = `
            <ion-page>
                <ion-header>
                    <ion-toolbar color="primary">
                        <ion-title>Settings</ion-title>
                    </ion-toolbar>
                </ion-header>
                <ion-content>
                    <div class="error-container">
                        <ion-icon name="warning-outline"></ion-icon>
                        <h2>Error Loading Settings</h2>
                        <p>There was a problem loading the settings page. Please try refreshing the page.</p>
                        <ion-button href="/">Return to Home</ion-button>
                    </div>
                </ion-content>
            </ion-page>
        `;
    }

    setupEventListeners() {
        try {
            // Back button
            const backBtn = this.querySelector('#back-btn');
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = '/';
                });
            }

            // Color option clicks
            const colorOptions = this.querySelectorAll('.color-option');
            colorOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const color = e.target.dataset.color;
                    if (color) {
                        this.selectColor(color);
                    }
                });
            });

            // Apply color button
            const applyBtn = this.querySelector('#apply-color-btn');
            if (applyBtn) {
                applyBtn.addEventListener('click', () => {
                    this.applySelectedColor();
                });
            }

            // Wallpaper upload button
            const selectWallpaperBtn = this.querySelector('#select-wallpaper-btn');
            const wallpaperInput = this.querySelector('#wallpaper-input');
            if (selectWallpaperBtn && wallpaperInput) {
                selectWallpaperBtn.addEventListener('click', () => {
                    wallpaperInput.click();
                });

                wallpaperInput.addEventListener('change', (e) => {
                    this.handleWallpaperSelect(e);
                });
            }

            // Apply wallpaper button
            const applyWallpaperBtn = this.querySelector('#apply-wallpaper-btn');
            if (applyWallpaperBtn) {
                applyWallpaperBtn.addEventListener('click', () => {
                    this.applySelectedWallpaper();
                });
            }

            // Reset wallpaper button
            const resetWallpaperBtn = this.querySelector('#reset-wallpaper-btn');
            if (resetWallpaperBtn) {
                resetWallpaperBtn.addEventListener('click', () => {
                    this.resetWallpaper();
                });
            }

            // Dark mode toggle
            const darkModeToggle = this.querySelector('#dark-mode-toggle');
            if (darkModeToggle) {
                darkModeToggle.addEventListener('ionChange', (e) => {
                    this.toggleDarkMode(e.detail.checked);
                });
            }

        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    selectColor(color) {
        try {
            this.currentPrimaryColor = color;

            // Update preview
            const preview = this.querySelector('#color-preview');
            if (preview) {
                preview.style.backgroundColor = color;
            }

            // Update selected state
            this.updateSelectedOption();

            // Apply color immediately for preview
            ColorUtils.applyColorToCSS(color);
        } catch (error) {
            console.error('Error selecting color:', error);
        }
    }

    updateSelectedOption() {
        try {
            // Remove selected class from all options
            const allOptions = this.querySelectorAll('.color-option');
            allOptions.forEach(option => {
                option.classList.remove('selected');
            });

            // Add selected class to current color
            const currentOption = this.querySelector(`[data-color="${this.currentPrimaryColor}"]`);
            if (currentOption) {
                currentOption.classList.add('selected');
            }
        } catch (error) {
            console.error('Error updating selected option:', error);
        }
    }

    applySelectedColor() {
        try {
            const success = ColorUtils.saveColor(this.currentPrimaryColor);
            if (success) {
                this.showToast('Primary color applied successfully!');
            } else {
                this.showToast('Error applying color. Please try again.');
            }
        } catch (error) {
            console.error('Error applying color:', error);
            this.showToast('Error applying color. Please try again.');
        }
    }

    async showToast(message) {
        try {
            const toast = document.createElement('ion-toast');
            toast.message = message;
            toast.duration = 2000;
            toast.position = 'bottom';

            document.body.appendChild(toast);
            await toast.present();
        } catch (error) {
            console.error('Error showing toast:', error);
            // Fallback to console log if toast fails
            console.log(message);
        }
    }
}

// Register the custom element
if (!customElements.get('page-settings')) {
    customElements.define('page-settings', PageSettings);
}

export default PageSettings;