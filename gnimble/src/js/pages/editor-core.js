// editor-core.js

import { countWords, writeStoryFile, readStoryFile } from '../shared.js';

export class EditorCore {
  constructor(editorInstance) {
    this.editor = editorInstance;
    this.container = null;
    this.quill = null;
    this.toolbarButtons = {};
  }

  async initialize(container) {
    this.container = container;
    
    // Wait for layout to be set up
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await this.setupEditor();
    this.setupToolbar();
    this.setupBackButton();
  }

  async setupEditor() {
    // Find the editor container
    const editorContainer = this.container.querySelector('#editor');
    if (!editorContainer) {
      console.warn('Editor container not found');
      return;
    }

    // Clean up existing Quill instance
    if (window.quill) {
      window.quill = null;
    }

    // Configure Google Fonts for Quill
    const Font = Quill.import('formats/font');
    Font.whitelist = [
      'times', 'alegreya', 'amatic', 'bree', 'cardo', 
      'garamond', 'lora', 'lustria', 'merriweather', 
      'roboto-mono', 'oswald', 'pacifico', 'pinyon', 
      'playfair', 'sawarabi', 'spectral'
    ];
    Quill.register(Font, true);

    // Initialize Quill without toolbar (we have our custom toolbar)
    this.quill = new Quill(editorContainer, {
      theme: 'snow',
      modules: {
        toolbar: false
      }
    });

    // Set default font to Times New Roman
    this.quill.format('font', 'times');

    // Make quill globally available for other components
    window.quill = this.quill;

    // Load existing content
    await this.loadContent();

    // Setup Quill event listeners
    this.quill.on('selection-change', () => {
      this.updateButtonStates();
      this.emitSelectionChange();
    });

    this.quill.on('text-change', () => {
      this.updateButtonStates();
      this.emitContentChange();
    });

    // Also listen for editor-changed events for more immediate updates
    this.quill.on('editor-change', (eventType) => {
      if (eventType === 'text-change') {
        this.emitHeadersChange();
      }
    });

    // Initial button state update
    this.updateButtonStates();
  }

  setupToolbar() {
    // Get references to toolbar buttons
    this.toolbarButtons = {
      bold: this.container.querySelector('#bold-btn'),
      italic: this.container.querySelector('#italic-btn'),
      underline: this.container.querySelector('#underline-btn'),
      alignLeft: this.container.querySelector('#align-left-btn'),
      alignCenter: this.container.querySelector('#align-center-btn'),
      alignRight: this.container.querySelector('#align-right-btn'),
      headerSelect: this.container.querySelector('#header-select'),
      fontSelect: this.container.querySelector('#font-select') // Add font selector
    };

    // Verify buttons exist
    if (!this.toolbarButtons.bold) {
      console.warn('Toolbar buttons not found');
      return;
    }

    // Setup formatting button event listeners
    this.toolbarButtons.bold?.addEventListener('click', () => {
      this.toggleFormat('bold');
    });

    this.toolbarButtons.italic?.addEventListener('click', () => {
      this.toggleFormat('italic');
    });

    this.toolbarButtons.underline?.addEventListener('click', () => {
      this.toggleFormat('underline');
    });

    // Setup alignment button event listeners
    this.toolbarButtons.alignLeft?.addEventListener('click', () => {
      this.setAlignment('');
    });

    this.toolbarButtons.alignCenter?.addEventListener('click', () => {
      this.setAlignment('center');
    });

    this.toolbarButtons.alignRight?.addEventListener('click', () => {
      this.setAlignment('right');
    });

    // Setup header select event listener
    this.toolbarButtons.headerSelect?.addEventListener('ionChange', (e) => {
      const value = e.detail.value;
      this.quill.format('header', value || false);
      this.updateButtonStates();
      // Emit immediate header change for navigation update
      this.emitHeadersChangeImmediate();
    });

    // Setup font select event listener
    this.toolbarButtons.fontSelect?.addEventListener('ionChange', (e) => {
      const value = e.detail.value;
      this.setFont(value);
      this.updateButtonStates();
    });
  }

  setupBackButton() {
    const backBtn = this.container.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.saveContent();
      });
    }
  }

  toggleFormat(formatType) {
    if (!this.quill) return;

    const currentFormat = this.quill.getFormat()[formatType];
    this.quill.format(formatType, !currentFormat);
    this.updateButtonStates();
  }

  setAlignment(alignValue) {
    if (!this.quill) return;

    this.quill.format('align', alignValue);
    this.updateButtonStates();
  }

  setFont(fontValue) {
    if (!this.quill) return;

    // If no font value provided, use Times New Roman as default
    const font = fontValue || 'times';
    this.quill.format('font', font);
    this.updateButtonStates();
  }

  updateButtonStates() {
    if (!this.quill) return;

    const format = this.quill.getFormat();

    // Update formatting buttons
    this.toolbarButtons.bold?.classList.toggle('format-button-active', !!format.bold);
    this.toolbarButtons.italic?.classList.toggle('format-button-active', !!format.italic);
    this.toolbarButtons.underline?.classList.toggle('format-button-active', !!format.underline);

    // Update alignment buttons
    const align = format.align || '';
    this.toolbarButtons.alignLeft?.classList.toggle('format-button-active', align === '');
    this.toolbarButtons.alignCenter?.classList.toggle('format-button-active', align === 'center');
    this.toolbarButtons.alignRight?.classList.toggle('format-button-active', align === 'right');

    // Update header select
    if (this.toolbarButtons.headerSelect) {
      this.toolbarButtons.headerSelect.value = format.header || '';
    }

    // Update font select and its display font
    if (this.toolbarButtons.fontSelect) {
      const currentFont = format.font || 'times';
      this.toolbarButtons.fontSelect.value = currentFont;
      
      // Update the font selector's own display font to match selection
      this.updateFontSelectorDisplay(currentFont);
    }
  }

  updateFontSelectorDisplay(fontValue) {
    if (!this.toolbarButtons.fontSelect) return;

    const fontMap = {
      'times': '"Times New Roman", Times, serif',
      'alegreya': '"Alegreya", serif',
      'amatic': '"Amatic SC", cursive',
      'bree': '"Bree Serif", serif',
      'cardo': '"Cardo", serif',
      'garamond': '"EB Garamond", serif',
      'lora': '"Lora", serif',
      'lustria': '"Lustria", serif',
      'merriweather': '"Merriweather", serif',
      'roboto-mono': '"Roboto Mono", monospace',
      'oswald': '"Oswald", sans-serif',
      'pacifico': '"Pacifico", cursive',
      'pinyon': '"Pinyon Script", cursive',
      'playfair': '"Playfair Display", serif',
      'sawarabi': '"Sawarabi Mincho", serif',
      'spectral': '"Spectral", serif'
    };

    // Apply the font family to the selector itself
    const fontFamily = fontMap[fontValue] || fontMap['times'];
    this.toolbarButtons.fontSelect.style.fontFamily = fontFamily;
    
    // Adjust font size for decorative fonts
    if (['amatic', 'pacifico', 'pinyon'].includes(fontValue)) {
      this.toolbarButtons.fontSelect.style.fontSize = '18px';
    } else if (fontValue === 'roboto-mono') {
      this.toolbarButtons.fontSelect.style.fontSize = '14px';
    } else {
      this.toolbarButtons.fontSelect.style.fontSize = '16px';
    }
  }

  async loadContent() {
    try {
      const storyId = this.editor.getCurrentStoryId();
      const content = await readStoryFile(storyId);
      if (content) {
        this.quill.root.innerHTML = content;
      }
    } catch (error) {
      console.log('No existing content found or error loading:', error);
      // This is fine - means no saved content exists yet
    }
  }

  async saveContent() {
    try {
      const html = this.quill.root.innerHTML;
      const storyId = this.editor.getCurrentStoryId();
      await writeStoryFile(storyId, html);

      // Update the story reference in main editor
      this.editor.story = await this.editor.getStory();

      console.log('Content saved for story:', storyId);
      this.emitContentSaved();
      return true;
    } catch (error) {
      console.error('Error saving story:', error);
      return false;
    }
  }

  navigateToHeading(headingId) {
    if (!this.quill) return;

    // Find the heading element in the editor
    const editorElement = this.quill.root;
    const headingElement = editorElement.querySelector(`[data-heading-id="${headingId}"]`);

    if (headingElement) {
      // Scroll to the heading smoothly
      headingElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Focus the editor
      this.quill.focus();

      // Try to place cursor at the heading
      try {
        // Get all text nodes to find the position
        const range = document.createRange();
        range.selectNodeContents(headingElement);
        range.collapse(true);

        // Convert DOM range to Quill selection
        const quillSelection = this.quill.selection.normalizeNative(range);
        if (quillSelection) {
          this.quill.setSelection(quillSelection.index, 0);
        }
      } catch (error) {
        // If cursor positioning fails, just ensure editor is focused
        console.log('Cursor positioning failed, but heading is visible');
      }

      console.log('Navigated to heading:', headingElement.textContent);
    }
  }

  searchInDocument(searchTerm) {
    if (!searchTerm || !this.quill) return;

    const text = this.quill.getText();
    const index = text.toLowerCase().indexOf(searchTerm.toLowerCase());

    if (index !== -1) {
      // Select the found text
      this.quill.setSelection(index, searchTerm.length);
      this.quill.focus();
      
      // Show success message
      this.showToast(`Found "${searchTerm}"`);

      // Scroll the selection into view
      const selection = this.quill.getSelection();
      if (selection) {
        const bounds = this.quill.getBounds(selection.index);
        const editorContainer = this.quill.container;
        editorContainer.scrollTop = bounds.top - editorContainer.clientHeight / 2;
      }
    } else {
      this.showToast(`"${searchTerm}" not found`);
    }
  }

  // Font-specific utility methods
  getFontOptions() {
    return [
      { value: 'times', label: 'Times New Roman', family: '"Times New Roman", Times, serif' },
      { value: 'alegreya', label: 'Alegreya', family: '"Alegreya", serif' },
      { value: 'amatic', label: 'Amatic SC', family: '"Amatic SC", cursive' },
      { value: 'bree', label: 'Bree Serif', family: '"Bree Serif", serif' },
      { value: 'cardo', label: 'Cardo', family: '"Cardo", serif' },
      { value: 'garamond', label: 'EB Garamond', family: '"EB Garamond", serif' },
      { value: 'lora', label: 'Lora', family: '"Lora", serif' },
      { value: 'lustria', label: 'Lustria', family: '"Lustria", serif' },
      { value: 'merriweather', label: 'Merriweather', family: '"Merriweather", serif' },
      { value: 'roboto-mono', label: 'Roboto Mono', family: '"Roboto Mono", monospace' },
      { value: 'oswald', label: 'Oswald', family: '"Oswald", sans-serif' },
      { value: 'pacifico', label: 'Pacifico', family: '"Pacifico", cursive' },
      { value: 'pinyon', label: 'Pinyon Script', family: '"Pinyon Script", cursive' },
      { value: 'playfair', label: 'Playfair Display', family: '"Playfair Display", serif' },
      { value: 'sawarabi', label: 'Sawarabi Mincho', family: '"Sawarabi Mincho", serif' },
      { value: 'spectral', label: 'Spectral', family: '"Spectral", serif' }
    ];
  }

  getCurrentFont() {
    if (!this.quill) return 'times';
    const format = this.quill.getFormat();
    return format.font || 'times';
  }

  setDefaultFont() {
    this.setFont('times');
  }

  // Event emission methods for cross-component communication
  emitContentChange() {
    this.container.dispatchEvent(new CustomEvent('content-changed', {
      bubbles: true,
      detail: {
        wordCount: this.getWordCount(),
        textLength: this.getTextLength()
      }
    }));
  }

  emitSelectionChange() {
    this.container.dispatchEvent(new CustomEvent('selection-changed', {
      bubbles: true,
      detail: {
        selection: this.quill?.getSelection(),
        format: this.quill?.getFormat()
      }
    }));
  }

  emitHeadersChange() {
    // Use a small delay to ensure DOM is updated
    setTimeout(() => {
      this.container.dispatchEvent(new CustomEvent('headers-changed', {
        bubbles: true
      }));
    }, 50);
  }

  emitHeadersChangeImmediate() {
    // For immediate updates like when user changes header dropdown
    this.container.dispatchEvent(new CustomEvent('headers-changed', {
      bubbles: true
    }));
  }

  emitContentSaved() {
    this.container.dispatchEvent(new CustomEvent('content-saved', {
      bubbles: true,
      detail: {
        timestamp: new Date(),
        storyId: this.editor.getCurrentStoryId()
      }
    }));
  }

  // Utility methods
  getWordCount() {
    if (!this.quill) return 0;
    const html = this.quill.root.innerHTML;
    return countWords(html);
  }

  getTextLength() {
    if (!this.quill) return 0;
    return this.quill.getText().length;
  }

  getText() {
    if (!this.quill) return '';
    return this.quill.getText();
  }

  getHTML() {
    if (!this.quill) return '';
    return this.quill.root.innerHTML;
  }

  getSelection() {
    if (!this.quill) return null;
    return this.quill.getSelection();
  }

  getFormat() {
    if (!this.quill) return {};
    return this.quill.getFormat();
  }

  focus() {
    if (this.quill) {
      this.quill.focus();
    }
  }

  // Method to insert text at current cursor position
  insertText(text) {
    if (!this.quill) return;
    
    const selection = this.quill.getSelection();
    if (selection) {
      this.quill.insertText(selection.index, text);
    } else {
      this.quill.insertText(0, text);
    }
  }

  // Method to insert formatted text
  insertFormattedText(text, format = {}) {
    if (!this.quill) return;
    
    const selection = this.quill.getSelection();
    const index = selection ? selection.index : 0;
    
    this.quill.insertText(index, text, format);
  }

  // Method to apply formatting to selected text
  formatSelection(format) {
    if (!this.quill) return;
    
    const selection = this.quill.getSelection();
    if (selection && selection.length > 0) {
      this.quill.formatText(selection.index, selection.length, format);
    }
  }

  // Method to clear all formatting from selection
  clearFormatting() {
    if (!this.quill) return;
    
    const selection = this.quill.getSelection();
    if (selection && selection.length > 0) {
      // Clear all formats by applying them as false
      this.quill.removeFormat(selection.index, selection.length);
      // Reset to default font
      this.quill.formatText(selection.index, selection.length, 'font', 'times');
    }
  }

  // Method to set the entire document content
  setContent(html) {
    if (!this.quill) return;
    this.quill.root.innerHTML = html;
  }

  // Method to append content to the document
  appendContent(html) {
    if (!this.quill) return;
    
    const currentLength = this.quill.getLength();
    this.quill.clipboard.dangerouslyPasteHTML(currentLength - 1, html);
  }

  async showToast(message) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
  }

  // Method to handle cleanup when component is destroyed
  destroy() {
    if (this.quill) {
      // Remove event listeners and clean up
      this.quill.off('selection-change');
      this.quill.off('text-change');
      this.quill.off('editor-change');
      
      // Clear global reference
      if (window.quill === this.quill) {
        window.quill = null;
      }
      
      this.quill = null;
    }
    
    this.toolbarButtons = {};
    this.container = null;
  }

  // Method to get document statistics
  getDocumentStats() {
    if (!this.quill) return null;

    const html = this.quill.root.innerHTML;
    const text = this.quill.getText();
    
    return {
      words: countWords(html),
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      paragraphs: html.split(/<\/p>|<br>/i).filter(p => p.trim().length > 0).length,
      lines: text.split('\n').length
    };
  }

  // Method to check if document has unsaved changes
  hasUnsavedChanges() {
    // This would require tracking the last saved state
    // For now, return false but could be enhanced
    return false;
  }

  // Method to undo last action
  undo() {
    if (this.quill) {
      this.quill.history.undo();
    }
  }

  // Method to redo last undone action
  redo() {
    if (this.quill) {
      this.quill.history.redo();
    }
  }
}