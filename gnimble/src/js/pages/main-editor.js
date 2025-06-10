// main-editor.js

import { NavigationPanel } from './navigation.js';
import { EditorCore } from './editor-core.js';
import { ToolsPanel } from './tools.js';
import {
  countWords,
  getStory,
  writeStoryFile,
  readStoryFile
} from '../shared.js';

// Global variable to track current story
let currentStoryId = null;

// Define Editor Page Component
class PageEditor extends HTMLElement {
  constructor() {
    super();
    this.story = null;
    this.isWideLayout = false;
    this.currentStoryId = null;

    // Initialize components
    this.navigation = new NavigationPanel(this);
    this.editorCore = new EditorCore(this);
    this.tools = new ToolsPanel(this);
  }

  async connectedCallback() {
    // Get story ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.currentStoryId = urlParams.get('story');
    currentStoryId = this.currentStoryId;

    if (!this.currentStoryId) {
      // Redirect to home if no story ID
      window.location.href = '/';
      return;
    }

    try {
      this.story = await getStory(this.currentStoryId);
      if (!this.story) {
        throw new Error('Story not found');
      }
    } catch (error) {
      console.error('Error loading story:', error);
      window.location.href = '/';
      return;
    }

    this.render();
    this.setupResponsiveLayout();

    // Store reference for menu actions
    window.editorPageInstance = this;

    // Initialize components after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeComponents();
      this.setupCrossComponentCommunication();
    }, 100);
  }

  render() {
    this.innerHTML = `
      <!-- Shared Editor Content (persistent across layouts) -->
      <div id="shared-editor-content" style="display: none;">
        <ion-page id="editor-page">

          <ion-header>
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-back-button default-href="/" id="back-btn"></ion-back-button>
              </ion-buttons>
              <div style="flex: 1;">
                <div>
                  <ion-select id="font-select" interface="popover" placeholder="Font" value="times" class="font-selector"
                    fill="outline" label="Font" label-placement="stacked">

                    <ion-select-option value="times" class="font-option-times">
                      Times New Roman
                    </ion-select-option>

                    <ion-select-option value="alegreya" class="font-option-alegreya">
                      Alegreya
                    </ion-select-option>

                    <ion-select-option value="amatic" class="font-option-amatic">
                      Amatic SC
                    </ion-select-option>

                    <ion-select-option value="bree" class="font-option-bree">
                      Bree Serif
                    </ion-select-option>

                    <ion-select-option value="cardo" class="font-option-cardo">
                      Cardo
                    </ion-select-option>

                    <ion-select-option value="garamond" class="font-option-garamond">
                      EB Garamond
                    </ion-select-option>

                    <ion-select-option value="lora" class="font-option-lora">
                      Lora
                    </ion-select-option>

                    <ion-select-option value="lustria" class="font-option-lustria">
                      Lustria
                    </ion-select-option>

                    <ion-select-option value="merriweather" class="font-option-merriweather">
                      Merriweather
                    </ion-select-option>

                    <ion-select-option value="roboto-mono" class="font-option-roboto-mono">
                      Roboto Mono
                    </ion-select-option>

                    <ion-select-option value="oswald" class="font-option-oswald">
                      Oswald
                    </ion-select-option>

                    <ion-select-option value="pacifico" class="font-option-pacifico">
                      Pacifico
                    </ion-select-option>

                    <ion-select-option value="pinyon" class="font-option-pinyon">
                      Pinyon Script
                    </ion-select-option>

                    <ion-select-option value="playfair" class="font-option-playfair">
                      Playfair Display
                    </ion-select-option>

                    <ion-select-option value="sawarabi" class="font-option-sawarabi">
                      Sawarabi Mincho
                    </ion-select-option>

                    <ion-select-option value="spectral" class="font-option-spectral">
                      Spectral
                    </ion-select-option>

                  </ion-select>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: nowrap;">
                  <ion-button size="small" fill="outline" id="bold-btn">
                    <strong>B</strong>
                  </ion-button>
                  <ion-button size="small" fill="outline" id="italic-btn">
                    <em>I</em>
                  </ion-button>
                  <ion-button size="small" fill="outline" id="underline-btn">
                    <u>U</u>
                  </ion-button>

                <ion-button size="small" fill="outline" id="align-left-btn">
                  <ion-icon name="chevron-back-outline"></ion-icon>
                </ion-button>
                <ion-button size="small" fill="outline" id="align-center-btn">
<ion-icon name="reorder-four-outline"></ion-icon>
                </ion-button>
                <ion-button size="small" fill="outline" id="align-right-btn">
                  <ion-icon name="chevron-forward-outline"></ion-icon>
                </ion-button>

                  <div style="flex: 1;"> </div>

                  <ion-select placeholder="Normal" id="header-select" interface="popover" value="" size="small" style="min-width: 80px; max-width: 120px;">
                    <ion-select-option value="">Normal</ion-select-option>
                    <ion-select-option value="1">Chapter</ion-select-option>
                    <ion-select-option value="2">Sub-Chapter</ion-select-option>
                  </ion-select>
                </div>
              </div>
            </ion-toolbar>
          </ion-header>

          <div class="wallpaper">
            <div id="editor">
              <p><br /></p>
            </div>
          </div>

        </ion-page>
      </div>

      <!-- Wide Layout (Desktop) -->
      <div class="wide-layout" style="display: none;">
        <div class="layout-container">
          <div class="navigation-panel" id="wide-navigation-target">
            <!-- Navigation component will be rendered here -->
          </div>
          <div class="editor-panel" id="wide-editor-target">
            <!-- Editor content will be moved here -->
          </div>
          <div class="tools-panel" id="wide-tools-target">
            <!-- Tools component will be rendered here -->
          </div>
        </div>
      </div>

      <!-- Narrow Layout (Mobile) -->
      <div class="narrow-layout">
        <ion-tabs selected-tab="editor">
          <ion-tab tab="editor">
            <div id="narrow-editor-target">
              <!-- Editor content will be moved here -->
            </div>
          </ion-tab>

          <ion-tab tab="navigation">
            <ion-page id="narrow-navigation-target">
              <!-- Navigation component will be rendered here -->
            </ion-page>
          </ion-tab>

          <ion-tab tab="tools">
            <ion-page id="narrow-tools-target">
              <!-- Tools component will be rendered here -->
            </ion-page>
          </ion-tab>

          <ion-tab-bar slot="bottom">
            <ion-tab-button tab="editor" class="tab-editor">
              <ion-icon name="create-outline"></ion-icon>
              <ion-label>Editor</ion-label>
            </ion-tab-button>
            <ion-tab-button tab="navigation" class="tab-navigation">
              <ion-icon name="list-outline"></ion-icon>
              <ion-label>Outline</ion-label>
            </ion-tab-button>
            <ion-tab-button tab="tools" class="tab-tools">
              <ion-icon name="construct-outline"></ion-icon>
              <ion-label>Tools</ion-label>
            </ion-tab-button>
          </ion-tab-bar>
        </ion-tabs>
      </div>

      <style>
        .layout-container {
          display: flex;
          height: 100vh;
        }

        .navigation-panel {
          width: 320px;
          background: var(--ion-color-light);
          border-right: 1px solid var(--ion-color-medium);
          overflow-y: auto;
        }

        .editor-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .tools-panel {
          width: 320px;
          background: var(--ion-color-light);
          border-left: 1px solid var(--ion-color-medium);
          overflow-y: auto;
        }

        .navigation-content,
        .tools-content {
          padding: 0;
        }

        /* Tools Header Styles */
        .tools-header {
          padding: 16px;
          background: var(--ion-color-light-shade);
          border-bottom: 1px solid var(--ion-color-medium);
        }

        .tools-header h3 {
          margin: 0;
          color: var(--ion-color-medium-shade);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Enhanced Stats Toolbar for Narrow Layout */
        .stats-toolbar {
          background: var(--ion-color-light-shade);
          padding: 12px 16px;
          border-bottom: 1px solid var(--ion-color-medium);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 12px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 18px;
          font-weight: 600;
          color: var(--ion-color-primary);
          line-height: 1;
        }

        .stat-item .stat-label {
          font-size: 11px;
          color: var(--ion-color-medium-shade);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }

        .quick-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .quick-actions ion-button {
          --padding-start: 12px;
          --padding-end: 12px;
          height: 32px;
        }

        .last-saved-bar {
          background: var(--ion-color-success-tint);
          color: var(--ion-color-success-shade);
          padding: 8px 16px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .last-saved-bar ion-icon {
          font-size: 16px;
        }

        /* Tree and Tools Container */
        .tree-container,
        .tools-container {
          padding: 16px;
        }

        .tree-item {
          margin: 4px 0;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
          transition: background-color 0.2s;
          position: relative;
        }

        .tree-item:hover {
          background: var(--ion-color-primary-tint);
          color: var(--ion-color-primary-contrast);
        }

        .tree-item.selected {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
        }

        .tree-item.collapsed {
          opacity: 0.6;
        }

        .tree-item .icon {
          margin-right: 8px;
          width: 16px;
          font-size: 14px;
        }

        .tree-item .text {
          flex: 1;
          font-size: 14px;
          line-height: 1.3;
        }

        .tree-item.level-1 {
          font-weight: 600;
          font-size: 15px;
          margin-left: 0;
        }

        .tree-item.level-2 {
          font-weight: 500;
          font-size: 14px;
          margin-left: 16px;
        }

        .tree-item.level-3 {
          font-weight: 400;
          font-size: 13px;
          margin-left: 32px;
        }

        .tree-item.level-4 {
          font-weight: 400;
          font-size: 13px;
          margin-left: 48px;
        }

        .tree-item.level-5 {
          font-weight: 400;
          font-size: 12px;
          margin-left: 64px;
        }

        .tree-item.level-6 {
          font-weight: 400;
          font-size: 12px;
          margin-left: 80px;
        }

        .no-headings {
          color: var(--ion-color-medium);
          font-style: italic;
          text-align: center;
          padding: 20px;
          font-size: 14px;
        }

        .format-toolbar {
          background: var(--ion-color-light);
          padding: 8px;
          border-bottom: 1px solid var(--ion-color-medium);
          display: flex;
          gap: 4px;
          align-items: center;
          flex-wrap: wrap;
        }

        .format-button-active {
          --background: var(--ion-color-primary);
          --color: var(--ion-color-primary-contrast);
        }

        /* Font select styling */
        #font-select {
          min-width: 120px;
          --placeholder-color: var(--ion-color-medium-shade);
        }

        /* Font select dropdown styling */
        #font-select ion-select-option {
          padding: 8px 12px;
        }

        /* Update font select button to show current font */
        #font-select.has-value {
          font-weight: 500;
        }

        /* Font family styles for Quill editor */
        .ql-font-Arial {
          font-family: Arial, sans-serif;
        }

        .ql-font-Times\ New\ Roman {
          font-family: 'Times New Roman', serif;
        }

        .ql-font-Courier\ New {
          font-family: 'Courier New', monospace;
        }

        .ql-font-Georgia {
          font-family: Georgia, serif;
        }

        .ql-font-Verdana {
          font-family: Verdana, sans-serif;
        }

        .ql-font-Helvetica {
          font-family: Helvetica, sans-serif;
        }

        .ql-font-Trebuchet\ MS {
          font-family: 'Trebuchet MS', sans-serif;
        }

        .ql-font-Comic\ Sans\ MS {
          font-family: 'Comic Sans MS', cursive;
        }

        .ql-font-Impact {
          font-family: Impact, sans-serif;
        }

        .ql-font-Lucida\ Console {
          font-family: 'Lucida Console', monospace;
        }

        .ql-font-Palatino {
          font-family: Palatino, serif;
        }

        .ql-font-Tahoma {
          font-family: Tahoma, sans-serif;
        }

        #editor {
          min-height: 300px;
          padding: 16px;
          max-width: 100vh; /* Never wider than viewport height (1:1 aspect ratio) */
          width: 100%;
          margin: 0 auto; /* Center horizontally */
          box-sizing: border-box;
        }

        /* Ensure Quill editor content is visible */
        .ql-container {
          font-size: 16px;
          line-height: 1.6;
        }

        .ql-editor {
          min-height: 300px;
          padding: 16px;
        }

        /* Make sure editor targets take full space */
        #wide-editor-target,
        #narrow-editor-target {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Tools placeholder styling */
        .tools-placeholder {
          text-align: center;
          padding: 40px 20px;
          color: var(--ion-color-medium);
        }

        .tools-placeholder ion-icon {
          margin-bottom: 16px;
          opacity: 0.6;
        }

        .tools-placeholder p {
          margin: 0;
          font-style: italic;
        }

        /* Responsive breakpoint */
        @media (min-width: 768px) {
          .narrow-layout {
            display: none !important;
          }
          .wide-layout {
            display: block !important;
          }
        }

        @media (max-width: 767px) {
          .wide-layout {
            display: none !important;
          }
          .narrow-layout {
            display: block !important;
          }
        }
      </style>
    `;
  }

  setupResponsiveLayout() {
    // Check initial layout and move editor
    this.checkLayoutSize();
    this.moveEditorToCurrentLayout();

    // Listen for window resize
    window.addEventListener('resize', () => {
      const previousLayout = this.isWideLayout;
      this.checkLayoutSize();

      // Only move editor if layout actually changed
      if (previousLayout !== this.isWideLayout) {
        this.moveEditorToCurrentLayout();
        this.reinitializeComponents();
      }
    });
  }

  checkLayoutSize() {
    this.isWideLayout = window.innerWidth >= 768;
  }

  moveEditorToCurrentLayout() {
    const sharedEditor = this.querySelector('#shared-editor-content');
    const editorPage = this.querySelector('#editor-page');

    if (!sharedEditor || !editorPage) return;

    const wideTarget = this.querySelector('#wide-editor-target');
    const narrowTarget = this.querySelector('#narrow-editor-target');

    if (this.isWideLayout && wideTarget) {
      // Move to wide layout
      wideTarget.appendChild(editorPage);
      sharedEditor.style.display = 'none';
    } else if (!this.isWideLayout && narrowTarget) {
      // Move to narrow layout
      narrowTarget.appendChild(editorPage);
      sharedEditor.style.display = 'none';

      // Ensure editor tab is selected when switching to narrow layout
      setTimeout(() => {
        const tabs = this.querySelector('ion-tabs');
        if (tabs) {
          tabs.selectedTab = 'editor';
        }
      }, 100);
    }
  }

  initializeComponents() {
    // Get appropriate containers based on current layout
    const navContainer = this.isWideLayout ?
      this.querySelector('#wide-navigation-target') :
      this.querySelector('#narrow-navigation-target');

    const editorContainer = this.querySelector('#editor-page');

    const toolsContainer = this.isWideLayout ?
      this.querySelector('#wide-tools-target') :
      this.querySelector('#narrow-tools-target');

    // Initialize each component
    if (navContainer) {
      this.navigation.initialize(navContainer, this.isWideLayout);
    }

    if (editorContainer) {
      this.editorCore.initialize(editorContainer);
    }

    if (toolsContainer) {
      this.tools.initialize(toolsContainer, this.isWideLayout);
    }

    // Setup back button
    const backBtn = this.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.saveDocument();
      });
    }
  }

  reinitializeComponents() {
    // Reinitialize components when layout changes
    setTimeout(() => {
      this.initializeComponents();
    }, 100);
  }

  setupCrossComponentCommunication() {
    // Listen for events from components
    this.addEventListener('content-changed', () => {
      this.navigation.updateNavigationTree();
    });

    this.addEventListener('selection-changed', () => {
      this.navigation.updateDocumentStats();
    });

    this.addEventListener('headers-changed', () => {
      setTimeout(() => this.navigation.updateNavigationTree(), 50);
    });

    this.addEventListener('content-saved', () => {
      this.navigation.updateLastSavedTime();
      this.showToast('Story saved successfully!');
    });

    this.addEventListener('navigation-updated', (e) => {
      // Handle navigation updates if needed
      console.log('Navigation updated with', e.detail.headingsCount, 'headings');
    });

    // Listen for heading navigation requests
    this.addEventListener('navigate-to-heading', (e) => {
      this.editorCore.navigateToHeading(e.detail.headingId);
    });

    // Listen for search requests
    this.addEventListener('search-document', (e) => {
      this.editorCore.searchInDocument(e.detail.searchTerm);
    });
  }

  async saveDocument() {
    const success = await this.editorCore.saveContent();
    if (!success) {
      this.showToast('Error saving story. Please try again.');
    }
  }

  async showToast(message) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
  }

  // Utility methods that components might need
  getCurrentStoryId() {
    return this.currentStoryId;
  }

  getStory() {
    return this.story;
  }

  isInWideLayout() {
    return this.isWideLayout;
  }

  // Method to switch tabs programmatically (for narrow layout)
  switchToTab(tabName) {
    if (!this.isWideLayout) {
      const tabs = this.querySelector('ion-tabs');
      if (tabs) {
        tabs.selectedTab = tabName;
      }
    }
  }
}

// Register the custom element
customElements.define('page-editor', PageEditor);

export default PageEditor;