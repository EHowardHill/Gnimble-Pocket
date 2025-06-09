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
              <img width="128px" src="assets/imgs/gnimble-logo.png"></img>
            </ion-title>
            <ion-buttons slot="end">
              <ion-button fill="clear" id="add-story-btn">
                <ion-icon name="add-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="ion-padding">
          <div id="stories-container">
            <ion-text color="medium" class="ion-text-center">
              <p>Loading stories...</p>
            </ion-text>
          </div>
        </ion-content>
        
        <ion-footer>
          <ion-toolbar>
            <ion-title size="small">Version 2.0.0</ion-title>
          </ion-toolbar>
        </ion-footer>
      </ion-page>
    `;

        this.setupEventListeners();
        await this.loadStories();
    }

    setupEventListeners() {
        const addBtn = this.querySelector('#add-story-btn');
        addBtn.addEventListener('click', () => this.showCreateStoryModal());
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