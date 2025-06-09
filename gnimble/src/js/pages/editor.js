// editor.js

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
    this.statusBarVisible = false; // Hidden by default
    this.isWideLayout = false;
    this.headingsList = [];
  }

  async connectedCallback() {
    // Get story ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentStoryId = urlParams.get('story');

    if (!currentStoryId) {
      // Redirect to home if no story ID
      window.location.href = '/';
      return;
    }

    try {
      this.story = await getStory(currentStoryId);
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

    // Initialize Quill editor when this page loads
    await this.initializeEditor();
    
    // Set default tab for narrow layout
    this.setDefaultTab();
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
              <ion-title>${this.story?.title || 'Loading...'}</ion-title>
              <ion-buttons slot="end">
                <ion-button fill="clear" id="menu-btn">
                  <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
            <div class="format-toolbar">
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
                <ion-icon name="text-outline"></ion-icon>
              </ion-button>
              <ion-button size="small" fill="outline" id="align-center-btn">
                <ion-icon name="reorder-two-outline"></ion-icon>
              </ion-button>
              <ion-button size="small" fill="outline" id="align-right-btn">
                <ion-icon name="text-outline" style="transform: scaleX(-1);"></ion-icon>
              </ion-button>

              <div style="flex: 1;"> </div>

              <ion-select placeholder="Heading" id="header-select" interface="popover" value="">
                <ion-select-option value="">Normal</ion-select-option>
                <ion-select-option value="1">Heading 1</ion-select-option>
                <ion-select-option value="2">Heading 2</ion-select-option>
                <ion-select-option value="3">Heading 3</ion-select-option>
                <ion-select-option value="4">Heading 4</ion-select-option>
                <ion-select-option value="5">Heading 5</ion-select-option>
                <ion-select-option value="6">Heading 6</ion-select-option>
              </ion-select>
            </div>
          </ion-header>

          <ion-content>
            <div id="editor">
              <p><br /></p>
            </div>
          </ion-content>

          <ion-footer id="status-bar" style="display: none;">
            <ion-toolbar>
              <ion-title size="small" id="word-count">0 words</ion-title>
            </ion-toolbar>
          </ion-footer>
        </ion-page>
      </div>

      <!-- Wide Layout (Desktop) -->
      <div class="wide-layout" style="display: none;">
        <div class="layout-container">
          <div class="navigation-panel">
            <div class="navigation-content">
              <h3>Document Outline</h3>
              <div class="tree-container" id="wide-tree-container">
                <div class="no-headings">No headings found. Add headings to see document structure.</div>
              </div>
            </div>
          </div>
          <div class="editor-panel" id="wide-editor-target">
            <!-- Editor content will be moved here -->
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
            <ion-page>
              <ion-header>
                <ion-toolbar>
                  <ion-title>Document Outline</ion-title>
                  <ion-buttons slot="end">
                    <ion-button fill="clear" id="nav-menu-btn">
                      <ion-icon name="ellipsis-horizontal-outline"></ion-icon>
                    </ion-button>
                  </ion-buttons>
                </ion-toolbar>
              </ion-header>
              <ion-content>
                <div class="navigation-content">
                  <div class="tree-container" id="narrow-tree-container">
                    <div class="no-headings">No headings found. Add headings to see document structure.</div>
                  </div>
                </div>
              </ion-content>
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
          </ion-tab-bar>
        </ion-tabs>
      </div>

      <style>
        .layout-container {
          display: flex;
          height: 100vh;
        }

        .navigation-panel {
          width: 300px;
          background: var(--ion-color-light);
          border-right: 1px solid var(--ion-color-medium);
          overflow-y: auto;
        }

        .editor-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .navigation-content {
          padding: 16px;
        }

        .navigation-content h3 {
          margin-top: 0;
          color: var(--ion-color-medium-shade);
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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

        #editor {
          min-height: 300px;
          padding: 16px;
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

  setDefaultTab() {
    // Ensure editor tab is selected by default on narrow layout
    setTimeout(() => {
      const tabs = this.querySelector('ion-tabs');
      if (tabs && !this.isWideLayout) {
        tabs.selectedTab = 'editor';
      }
    }, 100);
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
      }
    });

    // Setup navigation tree interactions
    this.setupTreeNavigation();
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
    }

    // Update navigation after layout change
    setTimeout(() => {
      this.updateNavigationTree();
    }, 100);
  }

  setupTreeNavigation() {
    // Handle navigation to headings
    this.addEventListener('click', (e) => {
      const navItem = e.target.closest('.tree-item[data-heading-id]');
      if (navItem) {
        const headingId = navItem.dataset.headingId;
        this.navigateToHeading(headingId);
        
        // Update selection
        this.querySelectorAll('.tree-item').forEach(item => {
          item.classList.remove('selected');
        });
        navItem.classList.add('selected');

        // Switch to editor tab on mobile
        if (!this.isWideLayout) {
          const tabs = this.querySelector('ion-tabs');
          if (tabs) {
            tabs.selectedTab = 'editor';
          }
        }
      }
    });
  }

  navigateToHeading(headingId) {
    if (!window.quill) return;

    // Find the heading element in the editor
    const editorElement = window.quill.root;
    const headingElement = editorElement.querySelector(`[data-heading-id="${headingId}"]`);
    
    if (headingElement) {
      // Scroll to the heading smoothly
      headingElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Focus the editor
      window.quill.focus();
      
      // Try to place cursor at the heading (using a safer method)
      try {
        // Get all text nodes to find the position
        const range = document.createRange();
        range.selectNodeContents(headingElement);
        range.collapse(true);
        
        // Convert DOM range to Quill selection
        const quillSelection = window.quill.selection.normalizeNative(range);
        if (quillSelection) {
          window.quill.setSelection(quillSelection.index, 0);
        }
      } catch (error) {
        // If cursor positioning fails, just ensure editor is focused
        console.log('Cursor positioning failed, but heading is visible');
      }
      
      console.log('Navigated to heading:', headingElement.textContent);
    }
  }

  extractHeadings() {
    if (!window.quill) return [];

    const headings = [];
    const editorElement = window.quill.root;
    
    // Find all heading elements in the editor
    const headingElements = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const level = parseInt(tagName.charAt(1)); // Extract number from h1, h2, etc.
      const text = element.textContent.trim();
      
      if (text) {
        // Create or reuse heading ID
        let headingId = element.getAttribute('data-heading-id');
        if (!headingId) {
          headingId = `heading-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`;
          element.setAttribute('data-heading-id', headingId);
        }
        
        headings.push({
          id: headingId,
          level: level,
          text: text,
          element: element
        });
      }
    });

    return headings;
  }

  updateNavigationTree() {
    this.headingsList = this.extractHeadings();
    
    // Update both wide and narrow layout trees
    const wideContainer = this.querySelector('#wide-tree-container');
    const narrowContainer = this.querySelector('#narrow-tree-container');
    
    const treeHTML = this.generateTreeHTML();
    
    if (wideContainer) {
      wideContainer.innerHTML = treeHTML;
    }
    if (narrowContainer) {
      narrowContainer.innerHTML = treeHTML;
    }

    console.log('Navigation updated with', this.headingsList.length, 'headings');
  }

  generateTreeHTML() {
    if (this.headingsList.length === 0) {
      return '<div class="no-headings">No headings found. Add headings to see document structure.</div>';
    }

    return this.headingsList.map(heading => {
      const icon = this.getHeadingIcon(heading.level);
      return `
        <div class="tree-item level-${heading.level}" data-heading-id="${heading.id}">
          <ion-icon name="${icon}" class="icon"></ion-icon>
          <span class="text">${this.escapeHtml(heading.text)}</span>
        </div>
      `;
    }).join('');
  }

  getHeadingIcon(level) {
    const icons = {
      1: 'library-outline',
      2: 'document-text-outline',
      3: 'reader-outline',
      4: 'list-outline',
      5: 'ellipse-outline',
      6: 'remove-outline'
    };
    return icons[level] || 'document-outline';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async saveDocument() {
    try {
      const html = window.quill.root.innerHTML;
      await writeStoryFile(currentStoryId, html);

      // Update the story reference
      this.story = await getStory(currentStoryId);

      console.log('Content saved for story:', currentStoryId);
      this.showToast('Story saved successfully!');
    } catch (error) {
      console.error('Error saving story:', error);
      this.showToast('Error saving story. Please try again.');
    }
  }

  async initializeEditor() {
    // Wait for layout to be set up
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find the editor container (should be moved to correct layout by now)
    const editorContainer = this.querySelector('#editor');
    if (!editorContainer) {
      console.warn('Editor container not found');
      return;
    }

    // Clean up existing Quill instance
    if (window.quill) {
      window.quill = null;
    }

    // Initialize Quill without toolbar
    window.quill = new Quill(editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: false
      }
    });

    // Try to load existing content
    await this.loadContent();

    // Get references to toolbar buttons and elements
    const boldBtn = this.querySelector('#bold-btn');
    const italicBtn = this.querySelector('#italic-btn');
    const underlineBtn = this.querySelector('#underline-btn');
    const alignLeftBtn = this.querySelector('#align-left-btn');
    const alignCenterBtn = this.querySelector('#align-center-btn');
    const alignRightBtn = this.querySelector('#align-right-btn');
    const headerSelect = this.querySelector('#header-select');
    const menuBtn = this.querySelector('#menu-btn');
    const backBtn = this.querySelector('#back-btn');
    const wordCountElement = this.querySelector('#word-count');

    if (!boldBtn) {
      console.warn('Toolbar buttons not found');
      return;
    }

    // Function to update button states
    const updateButtonStates = () => {
      const format = window.quill.getFormat();

      boldBtn.classList.toggle('format-button-active', !!format.bold);
      italicBtn.classList.toggle('format-button-active', !!format.italic);
      underlineBtn.classList.toggle('format-button-active', !!format.underline);

      const align = format.align || '';
      alignLeftBtn.classList.toggle('format-button-active', align === '');
      alignCenterBtn.classList.toggle('format-button-active', align === 'center');
      alignRightBtn.classList.toggle('format-button-active', align === 'right');

      headerSelect.value = format.header || '';
    };

    // Function to update word count
    const updateWordCount = () => {
      const html = window.quill.root.innerHTML;
      const wordCount = countWords(html);
      if (wordCountElement) {
        wordCountElement.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
      }
    };

    // Function to update navigation tree
    const updateNavigation = () => {
      this.updateNavigationTree();
    };

    // Function for immediate navigation update (no delay)
    const updateNavigationImmediate = () => {
      // Use a small delay to ensure DOM is updated
      setTimeout(() => {
        this.updateNavigationTree();
      }, 50);
    };

    // Add event listeners
    boldBtn.addEventListener('click', () => {
      const isBold = window.quill.getFormat().bold;
      window.quill.format('bold', !isBold);
      updateButtonStates();
    });

    italicBtn.addEventListener('click', () => {
      const isItalic = window.quill.getFormat().italic;
      window.quill.format('italic', !isItalic);
      updateButtonStates();
    });

    underlineBtn.addEventListener('click', () => {
      const isUnderline = window.quill.getFormat().underline;
      window.quill.format('underline', !isUnderline);
      updateButtonStates();
    });

    alignLeftBtn.addEventListener('click', () => {
      window.quill.format('align', '');
      updateButtonStates();
    });

    alignCenterBtn.addEventListener('click', () => {
      window.quill.format('align', 'center');
      updateButtonStates();
    });

    alignRightBtn.addEventListener('click', () => {
      window.quill.format('align', 'right');
      updateButtonStates();
    });

    headerSelect.addEventListener('ionChange', (e) => {
      const value = e.detail.value;
      window.quill.format('header', value || false);
      updateButtonStates();
      // Update navigation immediately after header change
      updateNavigationImmediate();
    });

    // Menu button event listener
    menuBtn.addEventListener('click', () => {
      this.showEditorMenu();
    });

    backBtn.addEventListener('click', () => {
      this.saveDocument();
    });

    // Update button states and word count when selection/content changes
    window.quill.on('selection-change', updateButtonStates);
    window.quill.on('text-change', () => {
      updateButtonStates();
      updateWordCount();
      // Update navigation tree when content changes (more frequent)
      updateNavigationImmediate();
    });

    // Also listen for editor-changed events for more immediate updates
    window.quill.on('editor-change', (eventType) => {
      if (eventType === 'text-change') {
        updateNavigationImmediate();
      }
    });

    updateButtonStates();
    updateWordCount();
    
    // Initial navigation tree update - do it immediately and then again after a short delay
    updateNavigationImmediate();
    setTimeout(() => {
      updateNavigation();
    }, 200);
  }

  // Load existing content if available
  async loadContent() {
    try {
      const content = await readStoryFile(currentStoryId);
      if (content) {
        window.quill.root.innerHTML = content;
      }
    } catch (error) {
      console.log('No existing content found or error loading:', error);
      // This is fine - means no saved content exists yet
    }
  }

  async showEditorMenu() {
    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = 'Editor Options';
    actionSheet.buttons = [
      {
        text: this.statusBarVisible ? 'Hide Status Bar' : 'Show Status Bar',
        icon: this.statusBarVisible ? 'eye-off-outline' : 'eye-outline',
        handler: () => this.toggleStatusBar()
      },
      {
        text: 'Refresh Outline',
        icon: 'refresh-outline',
        handler: () => this.updateNavigationTree()
      },
      {
        text: 'Export Document',
        icon: 'download-outline',
        handler: () => this.exportDocument()
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

  toggleStatusBar() {
    const statusBar = this.querySelector('#status-bar');
    this.statusBarVisible = !this.statusBarVisible;

    if (this.statusBarVisible) {
      statusBar.style.display = 'block';
    } else {
      statusBar.style.display = 'none';
    }
  }

  exportDocument() {
    // Implementation for document export
    this.showToast('Export functionality coming soon!');
  }

  async showToast(message) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
  }
}

// Register the custom element
customElements.define('page-editor', PageEditor);

export default PageEditor;