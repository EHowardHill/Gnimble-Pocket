import {
  loadStoriesIndex,
  createStory,
  deleteStory,
  renameStory,
  formatDate
} from '../shared.js';

// Define Home Page Component
class PageHome extends HTMLElement {
  constructor() {
    super();
    this.stories = [];
  }

  async connectedCallback() {



    this.innerHTML = `
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-title>
              <img class="img-white" width="128px" src="assets/imgs/gnimble-logo.png"></img>
            </ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" id="profile-btn" title="Profile">
                <div id="profile-avatar">
                  <ion-icon name="person-outline" id="default-profile-icon"></ion-icon>
                  <img id="profile-image" style="width: 32px; height: 32px; display: none;" />
                </div>
              </ion-button>
              <ion-button fill="clear" id="settings-btn" title="Settings">
                <ion-icon name="settings-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" id="add-story-btn" title="Add Story">
                <ion-icon name="add-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="wallpaper ion-padding">
          <div class="wallpaper wallpaper-override" id="stories-container">
            <ion-text color="medium" class="ion-text-center">
              <p>Loading stories...</p>
            </ion-text>
          </div>
        </ion-content>
        
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small">Version 2.0.2</ion-title>
          </ion-toolbar>
        </ion-footer>
      </ion-page>
    `;

    this.setupEventListeners();
    await this.loadStories();

    // Load saved primary color if it exists
    this.loadSavedPrimaryColor();
  }

  // Add these methods to the PageHome class:

  setupEventListeners() {
    const addBtn = this.querySelector('#add-story-btn');
    const profileBtn = this.querySelector('#profile-btn');
    const settingsBtn = this.querySelector('#settings-btn');

    addBtn.addEventListener('click', () => this.showCreateStoryModal());
    profileBtn.addEventListener('click', () => this.navigateToLogin());
    settingsBtn.addEventListener('click', () => this.navigateToSettings());
  }

  navigateToLogin() {
    window.location.href = '/login';
  }

  navigateToSettings() {
    window.location.href = '/settings';
  }

  loadSavedPrimaryColor() {
    const savedColor = localStorage.getItem('gnimble-primary-color');
    if (savedColor) {
      document.documentElement.style.setProperty('--ion-color-primary', savedColor);
      console.log('Force applied color:', savedColor);
    }
  }

  applyColorToCSS(color) {
    // Apply the color to CSS custom properties
    document.documentElement.style.setProperty('--ion-color-primary', color);

    // Generate and apply related color variations
    const rgb = this.hexToRgb(color);
    if (rgb) {
      document.documentElement.style.setProperty('--ion-color-primary-rgb', `${rgb.r},${rgb.g},${rgb.b}`);

      // Generate contrast color (simple approach)
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
  }

  // Utility functions (add these to the PageHome class)
  isValidHexColor(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  isLightColor(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return false;
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
  }

  adjustBrightness(hex, percent) {
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

  async loadStories() {
    try {
      this.stories = await loadStoriesIndex();
      this.renderStories();
    } catch (error) {
      console.error('Error loading stories:', error);
      this.showErrorMessage('Error loading stories');
    }
  }

  renderStories() {
    const container = this.querySelector('#stories-container');

    if (this.stories.length === 0) {
      container.innerHTML = `
        <div class="ion-text-center ion-margin-top">
          <ion-icon name="book-outline" size="large" color="medium"></ion-icon>
          <h3>No stories yet</h3>
          <p color="medium">Tap the + button to create your first story</p>
        </div>
      `;
      return;
    }

    // Sort stories by last modified (newest first)
    const sortedStories = [...this.stories].sort((a, b) => b.lastModified - a.lastModified);

    container.innerHTML = sortedStories.map(story => `
      <ion-card button onclick="window.location.href='/editor?story=${story.id}'">
        <ion-card-header>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; min-width: 0;">
              <ion-card-title>${story.title}</ion-card-title>
              <ion-card-subtitle>
                ${story.wordCount} words • ${formatDate(story.lastModified)}
              </ion-card-subtitle>
            </div>
            <ion-button fill="clear" size="small" onclick="event.stopPropagation(); window.homePageInstance.showStoryOptions('${story.id}')" style="margin: -8px;">
              <ion-icon name="ellipsis-vertical-outline"></ion-icon>
            </ion-button>
          </div>
        </ion-card-header>
      </ion-card>
    `).join('');

    // Store reference for option menu
    window.homePageInstance = this;
  }

  async showCreateStoryModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title>New Story</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-modal">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Story Title</ion-label>
          <ion-input id="story-title-input" placeholder="Enter story title" maxlength="100"></ion-input>
        </ion-item>
        <ion-button expand="block" id="create-story-btn" disabled>Create Story</ion-button>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.present();

    const titleInput = modal.querySelector('#story-title-input');
    const createBtn = modal.querySelector('#create-story-btn');
    const closeBtn = modal.querySelector('#close-modal');

    titleInput.addEventListener('ionInput', (e) => {
      const value = e.detail.value.trim();
      createBtn.disabled = value.length === 0;
    });

    createBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      if (title) {
        try {
          await createStory(title);
          await this.loadStories();
          await modal.dismiss();
          this.showToast('Story created successfully!');
        } catch (error) {
          console.error('Error creating story:', error);
          this.showToast('Error creating story. Please try again.');
        }
      }
    });

    closeBtn.addEventListener('click', () => modal.dismiss());

    // Focus on input after modal opens
    setTimeout(() => titleInput.setFocus(), 300);
  }

  async showStoryOptions(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = story.title;
    actionSheet.buttons = [
      {
        text: 'Rename',
        icon: 'create-outline',
        handler: () => this.showRenameStoryModal(storyId)
      },
      {
        text: 'Delete',
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => this.showDeleteConfirmation(storyId)
      },
      {
        text: 'Cancel',
        icon: 'close-outline',
        role: 'cancel'
      }
    ];

    document.body.appendChild(actionSheet);
    await actionSheet.present();
  }

  async showRenameStoryModal(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title>Rename Story</ion-title>
          <ion-buttons slot="end">
            <ion-button id="close-modal">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Story Title</ion-label>
          <ion-input id="story-title-input" value="${story.title}" maxlength="100"></ion-input>
        </ion-item>
        <ion-button expand="block" id="rename-story-btn">Rename Story</ion-button>
      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.present();

    const titleInput = modal.querySelector('#story-title-input');
    const renameBtn = modal.querySelector('#rename-story-btn');
    const closeBtn = modal.querySelector('#close-modal');

    renameBtn.addEventListener('click', async () => {
      const newTitle = titleInput.value.trim();
      if (newTitle && newTitle !== story.title) {
        try {
          await renameStory(storyId, newTitle);
          await this.loadStories();
          await modal.dismiss();
          this.showToast('Story renamed successfully!');
        } catch (error) {
          console.error('Error renaming story:', error);
          this.showToast('Error renaming story. Please try again.');
        }
      } else {
        await modal.dismiss();
      }
    });

    closeBtn.addEventListener('click', () => modal.dismiss());

    // Focus and select all text
    setTimeout(() => {
      titleInput.setFocus();
      titleInput.getInputElement().then(input => input.select());
    }, 300);
  }

  async showDeleteConfirmation(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    const alert = document.createElement('ion-alert');
    alert.header = 'Delete Story';
    alert.message = `Are you sure you want to delete "${story.title}"? This action cannot be undone.`;
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: async () => {
          try {
            await deleteStory(storyId);
            await this.loadStories();
            this.showToast('Story deleted successfully!');
          } catch (error) {
            console.error('Error deleting story:', error);
            this.showToast('Error deleting story. Please try again.');
          }
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  async showToast(message) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
  }

  showErrorMessage(message) {
    const container = this.querySelector('#stories-container');
    container.innerHTML = `
      <div class="ion-text-center ion-margin-top">
        <ion-icon name="warning-outline" size="large" color="danger"></ion-icon>
        <h3>Error</h3>
        <p color="medium">${message}</p>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('page-home', PageHome);

export default PageHome;