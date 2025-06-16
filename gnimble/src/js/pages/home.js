// home.js

import {
  loadStoriesIndex,
  createStory,
  deleteStory,
  renameStory,
  formatDate,
  isAuthenticated,
  canSync,
  getUsername,
  loadStoryFromCloud,
  syncStoryToCloud,
  syncStoryFromCloud,
  makeApiCall
} from '../shared.js';

// Define Home Page Component
class PageHome extends HTMLElement {
  constructor() {
    super();
    this.stories = [];
    this.syncStatuses = new Map(); // Store sync status for each story
  }

  async connectedCallback() {
    const isUserAuthenticated = isAuthenticated();
    const userCanSync = canSync();

    this.innerHTML = `
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-title>
              <img class="img-white" width="128px" src="assets/imgs/gnimble-logo.png"></img>
            </ion-title>
            <ion-buttons slot="end">
              ${isUserAuthenticated ? `
                <ion-button fill="clear" id="cloud-sync-btn" title="Sync All Stories" ${!userCanSync ? 'disabled' : ''}>
                  <ion-icon name="sync-outline"></ion-icon>
                </ion-button>
              ` : ''}
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
          ${!userCanSync && isUserAuthenticated ? `
            <ion-card color="warning" style="margin-bottom: 16px;">
              <ion-card-content>
                <ion-text>
                  <h4>Upgrade to sync your stories</h4>
                  <p>Get a premium membership to sync your stories across devices and access them anywhere.</p>
                </ion-text>
              </ion-card-content>
            </ion-card>
          ` : ''}
          
          <div class="wallpaper wallpaper-override" id="stories-container">
            <ion-text color="medium" class="ion-text-center">
              <p>Loading stories...</p>
            </ion-text>
          </div>
          
          <!-- Cloud sync progress indicator -->
          <div id="cloud-sync-progress" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--ion-color-dark); padding: 20px; border-radius: 8px; z-index: 1000;">
            <ion-spinner name="crescent"></ion-spinner>
            <p style="margin-top: 10px; color: white;">Syncing stories...</p>
          </div>
        </ion-content>
        
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small">Version 2.0.3</ion-title>
          </ion-toolbar>
        </ion-footer>
      </ion-page>
      
      <style>
        .sync-status-icon {
          margin-left: 8px;
          font-size: 18px;
          vertical-align: middle;
        }
        
        .sync-status-icon.synced {
          color: var(--ion-color-success);
        }
        
        .sync-status-icon.not-synced {
          color: var(--ion-color-warning);
        }
        
        .sync-status-icon.error {
          color: var(--ion-color-danger);
        }
        
        .sync-status-icon.offline {
          color: var(--ion-color-medium);
        }
        
        .sync-status-icon.membership-required {
          color: var(--ion-color-warning);
        }
        
        .sync-status-icon.syncing {
          color: var(--ion-color-primary);
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        .story-meta-line {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      </style>
    `;

    this.setupEventListeners();

    // First sync cloud stories if user can sync
    if (userCanSync) {
      await this.syncCloudStories();
    }

    await this.loadStories();

    // NEW: Auto-sync all stories if user can sync
    if (userCanSync) {
      await this.syncAllStories();
    } else {
      // Just check sync statuses for status indication
      await this.checkSyncStatuses();
    }

    // Load saved primary color if it exists
    this.loadSavedPrimaryColor();
  }

  // NEW METHOD: Sync all stories automatically
  async syncAllStories() {
    if (!canSync() || this.stories.length === 0) {
      return;
    }

    const progressIndicator = this.querySelector('#cloud-sync-progress');
    let syncedCount = 0;
    let errorCount = 0;

    try {
      // Show progress indicator
      if (progressIndicator) {
        progressIndicator.style.display = 'block';
      }

      // Sync each story
      const syncPromises = this.stories.map(async (story) => {
        try {
          // Mark as syncing
          this.syncStatuses.set(story.id, 'syncing');
          this.updateStorySyncIcon(story.id, 'syncing');

          // Check cloud version first
          const cloudData = await loadStoryFromCloud(story.title);

          if (cloudData && cloudData.lastModified !== undefined) {
            const cloudTime = new Date(cloudData.lastModified).getTime();
            const localTime = new Date(story.lastModified).getTime();

            if (localTime > cloudTime) {
              // Local is newer - upload to cloud
              await syncStoryToCloud(story.id);
              console.log(`Uploaded "${story.title}" to cloud`);
            } else if (cloudTime > localTime) {
              // Cloud is newer - download from cloud
              await syncStoryFromCloud(story.title);
              console.log(`Downloaded "${story.title}" from cloud`);
              // Reload this specific story data
              const updatedStories = await loadStoriesIndex();
              const updatedStory = updatedStories.find(s => s.id === story.id);
              if (updatedStory) {
                // Update the story in our local array
                const storyIndex = this.stories.findIndex(s => s.id === story.id);
                if (storyIndex !== -1) {
                  this.stories[storyIndex] = updatedStory;
                }
              }
            }
            // If timestamps are equal, story is already in sync
          } else {
            // Not in cloud yet - upload it
            await syncStoryToCloud(story.id);
            console.log(`Uploaded new story "${story.title}" to cloud`);
          }

          // Mark as synced
          this.syncStatuses.set(story.id, 'synced');
          this.updateStorySyncIcon(story.id, 'synced');
          syncedCount++;

        } catch (error) {
          console.error(`Error syncing story "${story.title}":`, error);
          this.syncStatuses.set(story.id, 'error');
          this.updateStorySyncIcon(story.id, 'error');
          errorCount++;
        }
      });

      await Promise.all(syncPromises);

      // Re-render stories to reflect any updates
      this.renderStories();

      // Show summary toast only if there were actual sync operations
      if (syncedCount > 0 || errorCount > 0) {
        let message = '';
        if (syncedCount > 0 && errorCount === 0) {
          message = syncedCount === 1 ? 'Synced 1 story' : `Synced ${syncedCount} stories`;
        } else if (syncedCount > 0 && errorCount > 0) {
          message = `Synced ${syncedCount} stories, ${errorCount} errors`;
        } else if (errorCount > 0) {
          message = errorCount === 1 ? 'Error syncing 1 story' : `Error syncing ${errorCount} stories`;
        }
        if (message) {
          this.showToast(message);
        }
      }

    } catch (error) {
      console.error('Error during auto-sync:', error);
      this.showToast('Error syncing stories');
    } finally {
      // Hide progress indicator
      if (progressIndicator) {
        progressIndicator.style.display = 'none';
      }
    }
  }

  // Get list of all stories from cloud
  async getCloudStories() {
    if (!canSync()) {
      return [];
    }

    try {
      // First try the list endpoint if it exists
      try {
        const response = await makeApiCall('/api/story/list/', {}, true);

        if (response.success === 1 && response.data) {
          // The API returns an object with story names as keys
          // Convert to array of story names
          return Object.keys(response.data);
        }
      } catch (listError) {
        console.log('List endpoint not available, trying user data approach...');
      }

      // Alternative: Get user data which might include story list
      const userData = await makeApiCall('/api/user', {
        user: getUsername()
      });

      if (userData && userData.stories) {
        // Assuming user data includes a stories array or object
        return Array.isArray(userData.stories)
          ? userData.stories
          : Object.keys(userData.stories);
      }

      return [];
    } catch (error) {
      console.error('Error fetching cloud stories:', error);
      return [];
    }
  }

  // Sync stories from cloud to local
  async syncCloudStories() {
    if (!canSync()) {
      return;
    }

    const progressIndicator = this.querySelector('#cloud-sync-progress');

    try {
      // Show progress indicator
      if (progressIndicator) {
        progressIndicator.style.display = 'block';
      }

      // Get list of cloud stories
      const cloudStoryNames = await this.getCloudStories();
      if (cloudStoryNames.length === 0) {
        return;
      }

      // Get local stories
      const localStories = await loadStoriesIndex();
      const localStoryTitles = new Set(localStories.map(s => s.title.toLowerCase()));

      // Find stories that exist in cloud but not locally (case-insensitive comparison)
      const missingStories = cloudStoryNames.filter(cloudName =>
        !localStoryTitles.has(cloudName.toLowerCase())
      );

      if (missingStories.length > 0) {
        console.log(`Found ${missingStories.length} cloud stories to sync locally:`, missingStories);

        // Download each missing story
        for (const storyName of missingStories) {
          try {
            await syncStoryFromCloud(storyName);
            console.log(`Successfully synced "${storyName}" from cloud`);
          } catch (error) {
            console.error(`Error syncing story "${storyName}" from cloud:`, error);
          }
        }

        // Show toast with sync results
        if (missingStories.length === 1) {
          this.showToast(`Downloaded 1 story from cloud`);
        } else {
          this.showToast(`Downloaded ${missingStories.length} stories from cloud`);
        }
      }
    } catch (error) {
      console.error('Error during cloud sync:', error);
      // Don't show error toast on initial load to avoid annoying users
      // Only show if this was a manual sync
    } finally {
      // Hide progress indicator
      if (progressIndicator) {
        progressIndicator.style.display = 'none';
      }
    }
  }

  // Add method to check sync status for all stories
  async checkSyncStatuses() {
    if (!isAuthenticated()) {
      // If not authenticated, all stories are "offline"
      this.stories.forEach(story => {
        this.syncStatuses.set(story.id, 'offline');
      });
      this.renderStories();
      return;
    }

    if (!canSync()) {
      // If authenticated but no active membership, show membership required
      this.stories.forEach(story => {
        this.syncStatuses.set(story.id, 'membership-required');
      });
      this.renderStories();
      return;
    }

    // Check each story's sync status
    const syncPromises = this.stories.map(async (story) => {
      try {
        // Mark as syncing during check
        this.syncStatuses.set(story.id, 'syncing');
        this.updateStorySyncIcon(story.id, 'syncing');

        // Try to load from cloud
        const cloudData = await loadStoryFromCloud(story.title);

        if (cloudData && cloudData.lastModified !== undefined) {
          // Compare timestamps to determine sync status
          const cloudTime = new Date(cloudData.lastModified).getTime();
          const localTime = new Date(story.lastModified).getTime();

          if (Math.abs(cloudTime - localTime) < 1000) {
            // Timestamps are within 1 second - consider them synced
            this.syncStatuses.set(story.id, 'synced');
          } else if (localTime > cloudTime) {
            // Local is newer - needs to upload
            this.syncStatuses.set(story.id, 'not-synced');
          } else {
            // Cloud is newer - needs to download
            this.syncStatuses.set(story.id, 'not-synced');
          }
        } else {
          // Not in cloud - needs to upload
          this.syncStatuses.set(story.id, 'not-synced');
        }
      } catch (error) {
        console.error(`Error checking sync status for story ${story.id}:`, error);
        this.syncStatuses.set(story.id, 'error');
      }

      // Update the icon for this specific story
      this.updateStorySyncIcon(story.id, this.syncStatuses.get(story.id));
    });

    await Promise.all(syncPromises);
  }

  // Update sync icon for a specific story without re-rendering all stories
  updateStorySyncIcon(storyId, status) {
    const iconElement = this.querySelector(`#sync-icon-${storyId}`);
    if (iconElement) {
      const { icon, className, title } = this.getSyncIconDetails(status);
      iconElement.name = icon;
      iconElement.className = `sync-status-icon ${className}`;
      iconElement.title = title;
    }
  }

  getSyncIconDetails(status) {
    switch (status) {
      case 'synced':
        return {
          icon: 'cloud-done-outline',
          className: 'synced',
          title: 'Synced to cloud'
        };
      case 'not-synced':
        return {
          icon: 'cloud-upload-outline',
          className: 'not-synced',
          title: 'Not synced to cloud'
        };
      case 'syncing':
        return {
          icon: 'sync-outline',
          className: 'syncing',
          title: 'Syncing...'
        };
      case 'error':
        return {
          icon: 'cloud-offline-outline',
          className: 'error',
          title: 'Sync error'
        };
      case 'membership-required':
        return {
          icon: 'lock-closed-outline',
          className: 'membership-required',
          title: 'Premium membership required for cloud sync'
        };
      case 'offline':
      default:
        return {
          icon: 'cloud-offline-outline',
          className: 'offline',
          title: 'Sign in to enable cloud sync'
        };
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

    container.innerHTML = sortedStories.map(story => {
      const syncStatus = this.syncStatuses.get(story.id) || 'offline';
      const { icon, className, title } = this.getSyncIconDetails(syncStatus);

      return `
        <ion-card button onclick="window.location.href='/editor?story=${story.id}'">
          <ion-card-header>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1; min-width: 0;">
                <ion-card-title>${story.title}</ion-card-title>
                <ion-card-subtitle>
                  <div class="story-meta-line">
                    <span>${story.wordCount} words • ${formatDate(story.lastModified)}</span>
                    <ion-icon 
                      id="sync-icon-${story.id}"
                      name="${icon}" 
                      class="sync-status-icon ${className}"
                      title="${title}"
                    ></ion-icon>
                  </div>
                </ion-card-subtitle>
              </div>
              <ion-button fill="clear" size="small" onclick="event.stopPropagation(); window.homePageInstance.showStoryOptions('${story.id}')" style="margin: -8px;">
                <ion-icon name="ellipsis-vertical-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-card-header>
        </ion-card>
      `;
    }).join('');

    // Store reference for option menu
    window.homePageInstance = this;
  }

  async showStoryOptions(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (!story) return;

    const syncStatus = this.syncStatuses.get(storyId);
    const buttons = [
      {
        text: 'Rename',
        icon: 'create-outline',
        handler: () => this.showRenameStoryModal(storyId)
      }
    ];

    // Add sync option if user can sync
    if (canSync()) {
      buttons.push({
        text: 'Sync Story',
        icon: 'sync-outline',
        handler: () => this.syncSingleStory(storyId)
      });
    }

    // Add share option if authenticated (sharing might not require membership)
    if (isAuthenticated()) {
      buttons.push({
        text: 'Share',
        icon: 'share-outline',
        handler: () => this.shareLink(storyId)
      });
    }

    buttons.push(
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
    );

    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = story.title;
    actionSheet.buttons = buttons;

    document.body.appendChild(actionSheet);
    await actionSheet.present();
  }

  async shareLink(storyId) {
    try {
      // Find the story
      const story = this.stories.find(s => s.id === storyId);
      if (!story) {
        this.showToast('Story not found');
        return;
      }

      // Get the username
      const username = getUsername();
      if (!username) {
        this.showToast('Please sign in to share stories');
        return;
      }

      // Construct the share URL using the view route format
      const shareUrl = `https://gnimble.online/view/${encodeURIComponent(username)}/${encodeURIComponent(story.title)}`;

      // Copy to clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          // Modern clipboard API
          await navigator.clipboard.writeText(shareUrl);
          this.showToast('Share link copied to clipboard!');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (successful) {
            this.showToast('Share link copied to clipboard!');
          } else {
            throw new Error('Copy command failed');
          }
        }
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);

        // Show the URL in a modal if clipboard fails
        const alert = document.createElement('ion-alert');
        alert.header = 'Share Link';
        alert.message = `Copy this link to share your story:`;
        alert.inputs = [
          {
            name: 'shareUrl',
            type: 'text',
            value: shareUrl,
            attributes: {
              readonly: true
            }
          }
        ];
        alert.buttons = [
          {
            text: 'Close',
            role: 'cancel'
          },
          {
            text: 'Copy',
            handler: (data) => {
              // Try copying again
              if (navigator.clipboard) {
                navigator.clipboard.writeText(shareUrl).then(() => {
                  this.showToast('Share link copied to clipboard!');
                }).catch(() => {
                  this.showToast('Unable to copy automatically. Please copy the link manually.');
                });
              }
            }
          }
        ];

        document.body.appendChild(alert);
        await alert.present();
      }

    } catch (error) {
      console.error('Error creating share link:', error);
      this.showToast('Error creating share link. Please try again.');
    }
  }

  async syncSingleStory(storyId) {
    try {
      // Check if user can sync
      if (!canSync()) {
        this.showToast('Premium membership required for cloud sync');
        return;
      }

      // Update UI to show syncing
      this.syncStatuses.set(storyId, 'syncing');
      this.updateStorySyncIcon(storyId, 'syncing');

      const story = this.stories.find(s => s.id === storyId);
      if (!story) return;

      // Check cloud version first
      const cloudData = await loadStoryFromCloud(story.title);

      if (cloudData && cloudData.lastModified !== undefined) {
        const cloudTime = new Date(cloudData.lastModified).getTime();
        const localTime = new Date(story.lastModified).getTime();

        if (localTime > cloudTime) {
          // Local is newer - upload to cloud
          await syncStoryToCloud(storyId);
          this.showToast('Story uploaded to cloud successfully!');
        } else if (cloudTime > localTime) {
          // Cloud is newer - download from cloud
          await syncStoryFromCloud(story.title);
          await this.loadStories(); // Reload to get updated story
          this.showToast('Story updated from cloud successfully!');
        } else {
          // Already in sync
          this.showToast('Story is already in sync!');
        }
      } else {
        // Not in cloud yet - upload it
        await syncStoryToCloud(storyId);
        this.showToast('Story uploaded to cloud successfully!');
      }

      // Update status
      this.syncStatuses.set(storyId, 'synced');
      this.updateStorySyncIcon(storyId, 'synced');

    } catch (error) {
      console.error('Error syncing story:', error);
      this.syncStatuses.set(storyId, 'error');
      this.updateStorySyncIcon(storyId, 'error');

      // Check if error is related to membership
      if (error.message.includes('membership') || error.message.includes('Active membership')) {
        this.showToast('Premium membership required for cloud sync');
      } else {
        this.showToast('Error syncing story. Please try again.');
      }
    }
  }

  // Update loadStories to trigger sync check
  async loadStories() {
    try {
      this.stories = await loadStoriesIndex();
      this.renderStories();
    } catch (error) {
      console.error('Error loading stories:', error);
      this.showErrorMessage('Error loading stories');
    }
  }

  // All other methods remain the same...
  setupEventListeners() {
    const addBtn = this.querySelector('#add-story-btn');
    const profileBtn = this.querySelector('#profile-btn');
    const settingsBtn = this.querySelector('#settings-btn');
    const cloudSyncBtn = this.querySelector('#cloud-sync-btn');

    addBtn.addEventListener('click', () => this.showCreateStoryModal());
    profileBtn.addEventListener('click', () => this.navigateToLogin());
    settingsBtn.addEventListener('click', () => this.navigateToSettings());

    // Cloud sync button (if authenticated and can sync)
    if (cloudSyncBtn) {
      cloudSyncBtn.addEventListener('click', async () => {
        if (!canSync()) {
          this.showToast('Premium membership required for cloud sync');
          return;
        }
        await this.manualCloudSync();
      });
    }

    // Add pull-to-refresh functionality
    const content = this.querySelector('ion-content');
    if (content) {
      const refresher = document.createElement('ion-refresher');
      refresher.slot = 'fixed';
      refresher.innerHTML = '<ion-refresher-content></ion-refresher-content>';

      refresher.addEventListener('ionRefresh', async (event) => {
        if (canSync()) {
          await this.syncCloudStories(true); // Manual refresh
          await this.syncAllStories(); // Also sync all stories on manual refresh
        }
        await this.loadStories();
        event.detail.complete();
      });

      content.appendChild(refresher);
    }
  }

  async manualCloudSync() {
    if (!canSync()) {
      this.showToast('Premium membership required for cloud sync');
      return;
    }

    this.showToast('Syncing all stories...');
    await this.syncCloudStories();
    await this.loadStories();
    await this.syncAllStories(); // Use the new auto-sync method
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
          // Auto-sync the new story if user can sync
          if (canSync()) {
            const newStory = this.stories.find(s => s.title === title);
            if (newStory) {
              await this.syncSingleStory(newStory.id);
            }
          } else {
            await this.checkSyncStatuses(); // Check sync status after creating
          }
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
          await this.checkSyncStatuses(); // Re-check sync status
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
            await this.checkSyncStatuses(); // Re-check remaining stories
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