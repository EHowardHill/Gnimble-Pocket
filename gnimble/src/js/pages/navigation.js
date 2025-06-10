// navigation.js

import { countWords } from '../shared.js';

export class NavigationPanel {
  constructor(editorInstance) {
    this.editor = editorInstance;
    this.container = null;
    this.isWideLayout = false;
    this.headingsList = [];
    this.isOutlineCollapsed = false;
    this.lastSaved = null;
    this.documentStats = {
      words: 0,
      characters: 0,
      paragraphs: 0,
      readingTime: 0,
      currentPage: 1
    };
    this.wordsPerPage = 85; // Estimated for 8x5 paper, 1" margins, 12pt font, 1.5 spacing
  }

  initialize(container, isWideLayout) {
    this.container = container;
    this.isWideLayout = isWideLayout;
    this.render();
    this.setupEventListeners();

    // Initial update after a short delay
    setTimeout(() => {
      this.updateNavigationTree();
      this.refresh();
    }, 1000);
  }

  render() {
    this.container.innerHTML = `
      <div class="navigation-content">
        <ion-header>          
          <div class="stats-toolbar">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number nav-word-count">0</div>
                <div class="stat-label">words</div>
              </div>
              <div class="stat-item">
                <div class="stat-number nav-reading-time">0</div>
                <div class="stat-label">min read</div>
              </div>
              <div class="stat-item">
                <div class="stat-number nav-headings-count">0</div>
                <div class="stat-label">headings</div>
              </div>
            </div>
            
            <div class="quick-actions">
              <ion-button fill="clear" size="small" class="nav-refresh-btn" title="Refresh">
                <ion-icon name="refresh-outline"></ion-icon>
              </ion-button>
            </div>
          </div>
          
          <div class="last-saved-bar nav-last-saved" style="display: none;">
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            <span>Last saved: <span class="nav-saved-time">Never</span></span>
          </div>
        </ion-header>
        
        <div class="tree-container nav-tree-container">
          <div class="no-headings">No headings found. Add headings to see document structure.</div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.container) return;

    // Search functionality
    const searchBtn = this.container.querySelector('.nav-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.showSearchDialog());
    }

    // Collapse/Expand functionality
    const collapseBtn = this.container.querySelector('.nav-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => this.toggleOutlineCollapse());
    }

    const expandBtn = this.container.querySelector('.nav-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => this.expandAllOutline());
    }

    // Refresh functionality (only in wide layout)
    const refreshBtn = this.container.querySelector('.nav-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.updateNavigationTree());
    }

    // Tree navigation - delegate click handling
    this.container.addEventListener('click', (e) => {
      const navItem = e.target.closest('.tree-item[data-heading-id]');
      if (navItem) {
        const headingId = navItem.dataset.headingId;
        this.navigateToHeading(headingId);
        this.updateSelection(navItem);

        // Switch to editor tab on mobile after navigation
        if (!this.isWideLayout) {
          this.editor.switchToTab('editor');
        }
      }
    });
  }

  navigateToHeading(headingId) {
    // Emit event for the editor to handle the actual navigation
    this.container.dispatchEvent(new CustomEvent('navigate-to-heading', {
      bubbles: true,
      detail: { headingId }
    }));
  }

  updateSelection(selectedItem) {
    // Remove selection from all items
    this.container.querySelectorAll('.tree-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Add selection to clicked item
    if (selectedItem) {
      selectedItem.classList.add('selected');
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

  generateTreeHTML() {
    if (this.headingsList.length === 0) {
      return '<div class="no-headings">No headings found. Add headings to see document structure.</div>';
    }

    return this.headingsList.map(heading => {
      const icon = this.getHeadingIcon(heading.level);
      const collapsedClass = this.isOutlineCollapsed ? 'collapsed' : '';
      return `
        <div class="tree-item level-${heading.level} ${collapsedClass}" data-heading-id="${heading.id}">
          <ion-icon name="${icon}" class="icon"></ion-icon>
          <span class="text">${this.escapeHtml(heading.text)}</span>
        </div>
      `;
    }).join('');
  }

  getHeadingIcon(level) {
    const icons = {
      1: 'library-outline',      // Chapter
      2: 'document-text-outline', // Sub-Chapter
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

  updateNavigationTree() {
    this.headingsList = this.extractHeadings();

    // Update the tree display
    const treeContainer = this.container.querySelector('.nav-tree-container');
    if (treeContainer) {
      treeContainer.innerHTML = this.generateTreeHTML();
    }

    // Update document stats
    this.updateDocumentStats();

    // Emit event to notify other components
    this.container.dispatchEvent(new CustomEvent('navigation-updated', {
      bubbles: true,
      detail: { headingsCount: this.headingsList.length }
    }));

    console.log('Navigation updated with', this.headingsList.length, 'headings');
  }

  calculateDocumentStats() {
    if (!window.quill) return;

    const html = window.quill.root.innerHTML;
    const text = window.quill.getText();

    // Word count
    const words = countWords(html);

    // Character count (excluding spaces) - kept for internal calculation
    const characters = text.replace(/\s/g, '').length;

    // Paragraph count (approximate)
    const paragraphs = html.split(/<\/p>|<br>/i).filter(p => p.trim().length > 0).length;

    // Reading time (average 200 words per minute)
    const readingTime = Math.ceil(words / 200);

    // Current page calculation based on cursor position
    const currentPage = this.calculateCurrentPage();

    this.documentStats = {
      words,
      characters,
      paragraphs,
      readingTime: readingTime || 1,
      currentPage
    };
  }

  calculateCurrentPage() {
    if (!window.quill) return 1;

    try {
      // Get cursor position
      const selection = window.quill.getSelection();
      if (!selection) return 1;

      // Get text up to cursor position
      const textBeforeCursor = window.quill.getText(0, selection.index);

      // Count words before cursor
      const wordsBeforeCursor = textBeforeCursor.trim() === '' ? 0 :
        textBeforeCursor.trim().split(/\s+/).length;

      // Calculate page (minimum page 1)
      const calculatedPage = Math.ceil(wordsBeforeCursor / this.wordsPerPage) || 1;

      return calculatedPage;
    } catch (error) {
      // If anything fails, default to page 1
      return 1;
    }
  }

  updateDocumentStats() {
    this.calculateDocumentStats();

    // Update the displayed stats
    const wordCount = this.container.querySelector('.nav-word-count');
    const readingTime = this.container.querySelector('.nav-reading-time');
    const headingsCount = this.container.querySelector('.nav-headings-count');

    if (wordCount) wordCount.textContent = this.documentStats.words.toLocaleString();
    if (readingTime) readingTime.textContent = this.documentStats.readingTime;
    if (headingsCount) headingsCount.textContent = this.headingsList.length;
  }

  updateLastSavedTime() {
    this.lastSaved = new Date();
    const timeString = this.lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const savedTime = this.container.querySelector('.nav-saved-time');
    const lastSaved = this.container.querySelector('.nav-last-saved');

    if (savedTime) savedTime.textContent = timeString;
    if (lastSaved) lastSaved.style.display = 'flex';
  }

  async showSearchDialog() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Search Document';
    alert.inputs = [
      {
        name: 'searchTerm',
        type: 'text',
        placeholder: 'Enter search term...'
      }
    ];
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Search',
        handler: (data) => {
          this.searchInDocument(data.searchTerm);
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  searchInDocument(searchTerm) {
    if (!searchTerm || !window.quill) return;

    // Emit event for the editor to handle the actual search
    this.container.dispatchEvent(new CustomEvent('search-document', {
      bubbles: true,
      detail: { searchTerm }
    }));
  }

  toggleOutlineCollapse() {
    this.isOutlineCollapsed = !this.isOutlineCollapsed;
    this.updateNavigationTree();
  }

  expandAllOutline() {
    this.isOutlineCollapsed = false;
    this.updateNavigationTree();
  }

  // Public methods that can be called from the main editor
  refresh() {
    this.updateNavigationTree();
  }

  getHeadingsCount() {
    return this.headingsList.length;
  }

  getDocumentStats() {
    return { ...this.documentStats };
  }

  getCurrentPage() {
    return this.calculateCurrentPage();
  }

  // Method to handle layout changes
  switchLayout(isWideLayout) {
    this.isWideLayout = isWideLayout;
    this.render();
    this.setupEventListeners();
    // Restore data after re-render
    this.updateNavigationTree();
  }
}