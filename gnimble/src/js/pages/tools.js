// tools.js

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export class ToolsPanel {
  constructor(editorInstance) {
    this.editor = editorInstance;
    this.container = null;
    this.isWideLayout = false;
    this.tools = [];
    this.activeToolId = null;
    this.clickTimeout = null;
    this.focusKeyHandler = null;
    this.storedSelection = null;
  }

  initialize(container, isWideLayout) {
    this.container = container;
    this.isWideLayout = isWideLayout;
    this.initializeDefaultTools();
    this.addActiveToolStyles();
    this.setupFocusModeKeyboardShortcut();
    this.render();
    this.setupEventListeners();
  }

  addActiveToolStyles() {
    if (document.getElementById('tools-active-styles')) return;

    const style = document.createElement('style');
    style.id = 'tools-active-styles';
    style.textContent = `
      ion-item.tool-active {
        --background: var(--ion-color-primary-tint);
        --color: var(--ion-color-primary-shade);
      }
      
      ion-item.tool-active ion-icon {
        color: var(--ion-color-primary);
      }
      
      /* Ensure tools panel takes full height */
      .tools-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      .tools-panel ion-header {
        flex-shrink: 0;
      }
      
      .tools-panel ion-content {
        flex: 1;
        height: auto;
      }
      
      /* For narrow layout tools tab */
      #narrow-tools-target {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      
      #narrow-tools-target ion-content {
        flex: 1;
      }
      
      /* Focus mode exit button styles */
      #focus-mode-exit {
        position: fixed !important;
        top: 85px !important;
        right: 20px !important;
        z-index: 10000 !important;
      }
      
      #focus-mode-exit ion-fab-button {
        --background: rgba(0, 0, 0, 0.6);
        --background-hover: rgba(0, 0, 0, 0.8);
        --color: white;
        --box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }
    `;

    document.head.appendChild(style);
  }

  initializeDefaultTools() {
    // Initialize with some basic writing tools
    this.tools = [
      {
        id: 'writing-goals',
        name: 'Writing Goals',
        icon: 'flag-outline',
        category: 'productivity',
        description: 'Set and track writing targets'
      },
      {
        id: 'focus-mode',
        name: 'Focus Mode',
        icon: 'eye-off-outline',
        category: 'productivity',
        description: 'Distraction-free writing'
      },
      {
        id: 'export-options',
        name: 'Export',
        icon: 'download-outline',
        category: 'utility',
        description: 'Export document in various formats'
      },
      {
        id: 'find-replace',
        name: 'Find & Replace',
        icon: 'search-outline',
        category: 'utility',
        description: 'Advanced text search and replacement'
      }
    ];
  }

  render() {
    this.container.innerHTML = `     
      <ion-content class="tools-content">
        ${this.generateToolsHTML()}
      </ion-content>
    `;
  }

  generateToolsHTML() {
    if (this.tools.length === 0) {
      return `
        <div style="text-align: center; padding: 40px 20px; color: var(--ion-color-medium);">
          <ion-icon name="construct-outline" size="large" style="margin-bottom: 16px; opacity: 0.6;"></ion-icon>
          <p style="margin: 0; font-style: italic;">No tools available</p>
        </div>
      `;
    }

    // Group tools by category
    const categories = this.groupToolsByCategory();

    let html = '';

    Object.keys(categories).forEach(category => {
      html += `
        <ion-item-group>
          <ion-item-divider>
            <ion-label>${this.capitalizeFirst(category)}</ion-label>
          </ion-item-divider>
          
          <ion-list>
            ${categories[category].map(tool => this.generateToolHTML(tool)).join('')}
          </ion-list>
        </ion-item-group>
      `;
    });

    return html;
  }

  generateToolHTML(tool) {
    const isActive = this.activeToolId === tool.id;

    return `
      <ion-item button="true" data-tool-id="${tool.id}" class="${isActive ? 'tool-active' : ''}">
        <ion-icon name="${tool.icon}" slot="start"></ion-icon>
        <ion-label>
          <h3>${tool.name}</h3>
          <p>${tool.description}</p>
        </ion-label>
        <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
      </ion-item>
    `;
  }



  groupToolsByCategory() {
    const categories = {};

    this.tools.forEach(tool => {
      const category = tool.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(tool);
    });

    return categories;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  setupEventListeners() {
    if (!this.container) return;

    // Handle tool clicks using event delegation
    this.container.addEventListener('click', (e) => {
      // Find the ion-item that was clicked
      const toolItem = e.target.closest('ion-item[data-tool-id]');
      if (toolItem) {
        e.preventDefault();
        e.stopPropagation();

        // Small delay to prevent double-clicks
        if (this.clickTimeout) {
          clearTimeout(this.clickTimeout);
        }

        this.clickTimeout = setTimeout(() => {
          const toolId = toolItem.dataset.toolId;
          this.activateTool(toolId);
          this.clickTimeout = null;
        }, 100);
      }
    });
  }

  activateTool(toolId) {
    const tool = this.tools.find(t => t.id === toolId);
    if (!tool) return;

    console.log('Activating tool:', tool.name);

    // If clicking the same tool that's already active, deselect it
    if (this.activeToolId === toolId) {
      this.clearActiveTool();
      return;
    }

    // Update active state
    this.setActiveTool(toolId);

    // Handle specific tools
    switch (toolId) {
      case 'writing-goals':
        this.showWritingGoalsTool();
        break;
      case 'focus-mode':
        this.toggleFocusMode();
        break;
      case 'export-options':
        this.showExportOptions();
        break;
      case 'find-replace':
        this.showFindReplaceTool();
        break;
      default:
        this.showComingSoonMessage(tool.name);
    }
  }

  setActiveTool(toolId) {
    // Remove active class from all tools
    this.container.querySelectorAll('ion-item[data-tool-id]').forEach(item => {
      item.classList.remove('tool-active');
    });

    // Add active class to selected tool
    const activeItem = this.container.querySelector(`ion-item[data-tool-id="${toolId}"]`);
    if (activeItem) {
      activeItem.classList.add('tool-active');
    }

    this.activeToolId = toolId;
  }

  clearActiveTool() {
    // Remove active class from all tools
    this.container.querySelectorAll('ion-item[data-tool-id]').forEach(item => {
      item.classList.remove('tool-active');
    });

    this.activeToolId = null;
  }

  async showWritingGoalsTool() {
    console.log('Opening Writing Goals modal...');

    // Completely pause Quill editor
    this.blurEditor();

    const alert = document.createElement('ion-alert');
    alert.header = 'Writing Goals';
    alert.inputs = [
      {
        name: 'wordGoal',
        type: 'number',
        placeholder: 'Word count goal',
        value: localStorage.getItem('writing-goal-words') || ''
      },
      {
        name: 'timeGoal',
        type: 'number',
        placeholder: 'Time goal (minutes)',
        value: localStorage.getItem('writing-goal-time') || ''
      }
    ];
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Writing Goals cancelled');
          this.clearActiveTool();
          this.restoreEditor();
        }
      },
      {
        text: 'Set Goals',
        handler: (data) => {
          console.log('Writing Goals set:', data);
          this.setWritingGoals(data);
          this.clearActiveTool();
          this.restoreEditor();
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();

    // Wait for modal to fully render then focus first input
    setTimeout(() => {
      const inputs = alert.querySelectorAll('input');
      console.log('Found inputs:', inputs.length);
      if (inputs.length > 0) {
        console.log('Focusing first input...');
        inputs[0].focus();
        inputs[0].select(); // Select existing text if any
        console.log('Input focused. Active element:', document.activeElement);
      }
    }, 300);
  }

  setWritingGoals(goals) {
    if (goals.wordGoal) {
      localStorage.setItem('writing-goal-words', goals.wordGoal);
    }
    if (goals.timeGoal) {
      localStorage.setItem('writing-goal-time', goals.timeGoal);
    }

    this.showToast('Writing goals updated!');
    // Could emit event to update UI with progress indicators
    this.emitGoalsUpdated(goals);
  }

  toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    const isActive = document.body.classList.contains('focus-mode');

    if (isActive) {
      this.showToast('Focus mode enabled. Press Escape or click × to exit.');
      // Hide navigation and tools panels
      this.hidePanels();
      // Show focus mode exit button
      this.showFocusExitButton();
      // Keep focus mode tool active to show it's enabled
      this.setActiveTool('focus-mode');
    } else {
      this.showToast('Focus mode disabled');
      this.showPanels();
      // Hide focus mode exit button
      this.hideFocusExitButton();
      // Clear active state when focus mode is disabled
      this.clearActiveTool();
    }

    this.emitFocusModeToggled(isActive);
  }

  // Replace the existing showExportOptions method
  async showExportOptions() {
    // Blur Quill editor to prevent any focus issues
    this.blurEditor();

    const actionSheet = document.createElement('ion-action-sheet');
    actionSheet.header = 'Export Options';
    actionSheet.buttons = [
      {
        text: 'Export as Text (.txt)',
        icon: 'document-text-outline',
        handler: () => {
          this.exportAsText();
          this.clearActiveTool();
          this.restoreEditor();
        }
      },
      {
        text: 'Export as PDF',
        icon: 'document-attach-outline',
        handler: () => {
          this.exportAsPdf();
          this.clearActiveTool();
          this.restoreEditor();
        }
      },
      {
        text: 'Print',
        icon: 'print-outline',
        handler: () => {
          this.printDocument();
          this.clearActiveTool();
          this.restoreEditor();
        }
      },
      {
        text: 'Cancel',
        icon: 'close-outline',
        role: 'cancel',
        handler: () => {
          this.clearActiveTool();
          this.restoreEditor();
        }
      }
    ];

    document.body.appendChild(actionSheet);
    await actionSheet.present();
  }

  // Enhanced text export
  async exportAsText() {
    if (!window.quill) {
      this.showToast('Editor not ready');
      return;
    }

    try {
      this.showToast('Preparing text export...');

      const title = this.getDocumentTitle();
      const content = window.quill.getText();

      await this.saveFile(content, `${title}.txt`, 'text/plain');
      this.showToast('Text exported successfully!');
    } catch (error) {
      console.error('Text export failed:', error);
      this.showToast('Export failed. Please try again.');
    }
  }

  // PDF export using jsPDF and html2canvas
  async exportAsPdf() {
    if (!window.quill) {
      this.showToast('Editor not ready');
      return;
    }

    try {
      this.showToast('Generating PDF...');

      const title = this.getDocumentTitle();

      // Create a temporary container for PDF rendering
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: 210mm;
      padding: 20mm;
      background: white;
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      color: black;
    `;

      // Add title and content
      tempContainer.innerHTML = `
      <h1 style="font-size: 18pt; margin-bottom: 20px; text-align: center;">${title}</h1>
      <div class="content">${window.quill.root.innerHTML}</div>
    `;

      document.body.appendChild(tempContainer);

      // Capture as canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight
      });

      // Remove temp container
      document.body.removeChild(tempContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pdfBuffer = pdf.output('arraybuffer');

      await this.saveFile(pdfBuffer, `${title}.pdf`, 'application/pdf');
      this.showToast('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      this.showToast('PDF export failed. Please try again.');
    }
  }

  // Convert Quill Delta to DOCX paragraphs
  convertDeltaToDocxParagraphs(delta) {
    const paragraphs = [];
    let currentParagraph = [];

    delta.ops.forEach(op => {
      if (typeof op.insert === 'string') {
        const text = op.insert;
        const attributes = op.attributes || {};

        // Split by line breaks to create separate paragraphs
        const lines = text.split('\n');

        lines.forEach((line, index) => {
          if (line.length > 0) {
            const textRun = new TextRun({
              text: line,
              bold: attributes.bold || false,
              italics: attributes.italic || false,
              underline: attributes.underline ? {} : undefined,
              size: attributes.size ? parseInt(attributes.size) * 2 : 24, // Convert to half-points
            });
            currentParagraph.push(textRun);
          }

          // Create new paragraph on line break (except for last empty line)
          if (index < lines.length - 1 || (index === lines.length - 1 && line.length === 0)) {
            if (currentParagraph.length > 0) {
              paragraphs.push(new Paragraph({
                children: currentParagraph,
              }));
            } else {
              // Empty paragraph for spacing
              paragraphs.push(new Paragraph({
                children: [new TextRun({ text: '' })],
              }));
            }
            currentParagraph = [];
          }
        });
      }
    });

    // Add any remaining content
    if (currentParagraph.length > 0) {
      paragraphs.push(new Paragraph({
        children: currentParagraph,
      }));
    }

    return paragraphs;
  }

  // Unified file saving method for Capacitor
  async saveFile(content, filename, mimeType) {
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // Save to device using Capacitor Filesystem
      try {
        // Convert content to base64 if it's binary
        let data;
        if (content instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(content);
          data = btoa(String.fromCharCode(...uint8Array));
        } else if (typeof content === 'string') {
          data = btoa(unescape(encodeURIComponent(content)));
        } else {
          throw new Error('Unsupported content type');
        }

        // Save file to Documents directory
        const result = await Filesystem.writeFile({
          path: filename,
          data: data,
          directory: Directory.Documents,
          encoding: content instanceof ArrayBuffer ? undefined : 'utf8'
        });

        console.log('File saved:', result.uri);

        // Share the file
        await Share.share({
          title: 'Export Complete',
          text: `${filename} has been exported`,
          url: result.uri,
          dialogTitle: 'Share exported file'
        });

      } catch (error) {
        console.error('Native file save failed:', error);
        // Fallback to web download
        this.downloadFileWeb(content, filename, mimeType);
      }
    } else {
      // Web download
      this.downloadFileWeb(content, filename, mimeType);
    }
  }

  // Web download fallback
  downloadFileWeb(content, filename, mimeType) {
    let blob;

    if (content instanceof ArrayBuffer) {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = new Blob([content], { type: mimeType });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Helper method to get document title
  getDocumentTitle() {
    return this.editor.getStory()?.title || 'document';
  }

  // Enhanced print method with better formatting
  printDocument() {
    if (!window.quill) return;

    const content = window.quill.root.innerHTML;
    const title = this.getDocumentTitle();

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.6; 
              margin: 1in;
              color: black;
            }
            h1 { 
              font-size: 18pt; 
              margin-bottom: 20pt; 
              text-align: center;
              page-break-after: avoid;
            }
            h2 { 
              font-size: 16pt; 
              margin: 16pt 0 12pt 0;
              page-break-after: avoid;
            }
            h3 { 
              font-size: 14pt; 
              margin: 14pt 0 10pt 0;
              page-break-after: avoid;
            }
            p { 
              margin-bottom: 12pt; 
              text-align: justify;
              orphans: 2;
              widows: 2;
            }
            .ql-editor {
              padding: 0;
            }
            @page {
              margin: 1in;
            }
          }
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6; 
            margin: 1in;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="content">${content}</div>
      </body>
    </html>
  `);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }

  async showFindReplaceTool() {
    console.log('Opening Find & Replace modal...');

    // Completely pause Quill editor
    this.blurEditor();

    const alert = document.createElement('ion-alert');
    alert.header = 'Find & Replace';
    alert.inputs = [
      {
        name: 'findText',
        type: 'text',
        placeholder: 'Find...'
      },
      {
        name: 'replaceText',
        type: 'text',
        placeholder: 'Replace with...'
      }
    ];
    alert.buttons = [
      {
        text: 'Find',
        handler: (data) => {
          console.log('Find clicked:', data);
          // Restore editor first, then search (without restoring previous selection)
          this.restoreEditorForSearch();
          setTimeout(() => {
            this.findText(data.findText);
          }, 50);
          this.clearActiveTool();
        }
      },
      {
        text: 'Replace All',
        handler: (data) => {
          console.log('Replace All clicked:', data);
          this.restoreEditor();
          setTimeout(() => {
            this.replaceAllText(data.findText, data.replaceText);
          }, 50);
          this.clearActiveTool();
        }
      },
      {
        text: 'Cancel',
        role: 'cancel',
        handler: () => {
          console.log('Find & Replace cancelled');
          this.clearActiveTool();
          this.restoreEditor();
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();

    // Wait for modal to fully render then focus first input
    setTimeout(() => {
      const inputs = alert.querySelectorAll('input');
      console.log('Found inputs:', inputs.length);
      if (inputs.length > 0) {
        console.log('Focusing first input...');
        inputs[0].focus();
        inputs[0].select(); // Select existing text if any
        console.log('Input focused. Active element:', document.activeElement);
      }
    }, 300);
  }

  // Tool implementation methods
  getDocumentStats() {
    // Get stats from editor core or calculate here
    if (window.quill) {
      const html = window.quill.root.innerHTML;
      const text = window.quill.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;

      return {
        words,
        characters: text.length,
        charactersNoSpaces: text.replace(/\s/g, '').length,
        paragraphs: html.split(/<\/p>|<br>/i).filter(p => p.trim().length > 0).length,
        readingTime: Math.ceil(words / 200) || 1,
        estimatedPages: Math.ceil(words / 85) || 1
      };
    }

    return { words: 0, characters: 0, charactersNoSpaces: 0, paragraphs: 0, readingTime: 0, estimatedPages: 0 };
  }

  exportAs(format) {
    if (!window.quill) {
      this.showToast('Editor not ready');
      return;
    }

    const title = this.editor.getStory()?.title || 'document';
    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'txt':
        content = window.quill.getText();
        mimeType = 'text/plain';
        extension = 'txt';
        break;
      case 'html':
        content = window.quill.root.innerHTML;
        mimeType = 'text/html';
        extension = 'html';
        break;
      case 'md':
        content = this.convertToMarkdown(window.quill.root.innerHTML);
        mimeType = 'text/markdown';
        extension = 'md';
        break;
    }

    this.downloadFile(content, `${title}.${extension}`, mimeType);
    this.showToast(`Exported as ${format.toUpperCase()}`);
  }

  convertToMarkdown(html) {
    // Basic HTML to Markdown conversion
    let markdown = html;

    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');

    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

    return markdown;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  printDocument() {
    if (!window.quill) return;

    const content = window.quill.root.innerHTML;
    const title = this.editor.getStory()?.title || 'Document';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 1in; }
            h1 { font-size: 18pt; margin-bottom: 12pt; }
            h2 { font-size: 16pt; margin-bottom: 10pt; }
            p { margin-bottom: 12pt; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  findText(searchTerm) {
    this.container.dispatchEvent(new CustomEvent('search-document', {
      bubbles: true,
      detail: { searchTerm }
    }));
  }

  replaceAllText(findText, replaceText) {
    if (!window.quill || !findText) return;

    // Get the current Delta (formatted content) instead of plain text
    const delta = window.quill.getContents();
    let totalReplacements = 0;
    let newDelta = { ops: [] };

    // Process each operation in the Delta
    delta.ops.forEach(op => {
      if (typeof op.insert === 'string') {
        // This is a text operation - check for replacements
        let text = op.insert;
        const originalLength = text.length;

        // Count occurrences before replacement
        const occurrences = text.split(findText).length - 1;
        totalReplacements += occurrences;

        // Replace the text while preserving attributes
        text = text.replaceAll(findText, replaceText);

        // Add the modified operation to new Delta
        if (op.attributes) {
          newDelta.ops.push({ insert: text, attributes: op.attributes });
        } else {
          newDelta.ops.push({ insert: text });
        }
      } else {
        // This is an embed (image, etc.) - keep as is
        newDelta.ops.push(op);
      }
    });

    if (totalReplacements > 0) {
      // Set the new Delta content (preserves all formatting)
      window.quill.setContents(newDelta);
      this.showToast(`Replaced ${totalReplacements} occurrence(s)`);
      console.log(`Replaced ${totalReplacements} occurrences while preserving formatting`);
    } else {
      this.showToast('No matches found');
    }
  }

  hidePanels() {
    const navPanel = document.querySelector('.navigation-panel');
    const toolsPanel = document.querySelector('.tools-panel');

    if (navPanel && navPanel.style.display !== 'none') {
      navPanel.dataset.wasVisible = 'true';
      navPanel.style.display = 'none';
    }
    if (toolsPanel && toolsPanel.style.display !== 'none') {
      toolsPanel.dataset.wasVisible = 'true';
      toolsPanel.style.display = 'none';
    }
  }

  showPanels() {
    const navPanel = document.querySelector('.navigation-panel');
    const toolsPanel = document.querySelector('.tools-panel');

    if (navPanel && navPanel.dataset.wasVisible === 'true') {
      navPanel.style.display = '';
      delete navPanel.dataset.wasVisible;
    }
    if (toolsPanel && toolsPanel.dataset.wasVisible === 'true') {
      toolsPanel.style.display = '';
      delete toolsPanel.dataset.wasVisible;
    }

    // Force layout recalculation
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
  }

  showFocusExitButton() {
    // Remove existing button if any
    this.hideFocusExitButton();

    const exitButton = document.createElement('ion-fab');
    exitButton.id = 'focus-mode-exit';
    exitButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
    `;

    exitButton.innerHTML = `
      <ion-fab-button color="medium" size="small" title="Exit Focus Mode">
        <ion-icon name="return-up-back-outline"></ion-icon>
      </ion-fab-button>
    `;

    // Add click handler
    exitButton.addEventListener('click', () => {
      this.toggleFocusMode();
    });

    document.body.appendChild(exitButton);
  }

  hideFocusExitButton() {
    const existingButton = document.getElementById('focus-mode-exit');
    if (existingButton) {
      existingButton.remove();
    }
  }

  setupFocusModeKeyboardShortcut() {
    // Add keyboard shortcut to exit focus mode (Escape key)
    if (!this.focusKeyHandler) {
      this.focusKeyHandler = (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) {
          this.toggleFocusMode();
        }
      };

      document.addEventListener('keydown', this.focusKeyHandler);
    }
  }

  // Event emission methods
  emitGoalsUpdated(goals) {
    this.container.dispatchEvent(new CustomEvent('writing-goals-updated', {
      bubbles: true,
      detail: goals
    }));
  }

  emitFocusModeToggled(isActive) {
    this.container.dispatchEvent(new CustomEvent('focus-mode-toggled', {
      bubbles: true,
      detail: { isActive }
    }));
  }

  async showComingSoonMessage(toolName) {
    this.showToast(`${toolName} coming soon!`);
    this.clearActiveTool();
  }

  async showToast(message) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';

    document.body.appendChild(toast);
    await toast.present();
  }

  // Public methods for adding custom tools
  addTool(tool) {
    this.tools.push(tool);
    this.render();
  }

  removeTool(toolId) {
    this.tools = this.tools.filter(tool => tool.id !== toolId);
    this.render();
  }

  getTool(toolId) {
    return this.tools.find(tool => tool.id === toolId);
  }

  // Method to handle layout changes
  switchLayout(isWideLayout) {
    this.isWideLayout = isWideLayout;
    this.render();
    this.setupEventListeners();
  }

  // Helper methods for handling Quill focus conflicts with modals
  blurEditor() {
    // Try multiple approaches to pause the editor
    let editorPaused = false;

    // First try: Use the editor core's pause method
    if (this.editor && this.editor.editorCore && this.editor.editorCore.pauseQuill) {
      try {
        this.editor.editorCore.pauseQuill();
        editorPaused = true;
        console.log('Editor paused via editorCore');
      } catch (error) {
        console.warn('Failed to pause via editorCore:', error);
      }
    }

    // Second try: Direct Quill manipulation if editor core failed
    if (!editorPaused && window.quill) {
      try {
        // Store selection
        this.storedSelection = window.quill.getSelection();

        // Remove all event listeners
        window.quill.off('selection-change');
        window.quill.off('text-change');
        window.quill.off('editor-change');

        // Disable and blur
        window.quill.disable();
        window.quill.blur();

        // Make non-interactive
        const container = window.quill.container;
        if (container) {
          container.style.pointerEvents = 'none';
          container.setAttribute('tabindex', '-1');
          container.blur();
        }

        // Remove focus from any active element in the editor
        const activeElement = document.activeElement;
        if (activeElement && window.quill.container.contains(activeElement)) {
          activeElement.blur();
        }

        editorPaused = true;
        console.log('Editor paused via direct Quill');
      } catch (error) {
        console.warn('Failed to pause via direct Quill:', error);
      }
    }

    if (!editorPaused) {
      console.warn('Could not pause editor - neither editorCore nor Quill available');
    }
  }

  restoreEditor() {
    // Try multiple approaches to restore the editor
    let editorRestored = false;

    // First try: Use the editor core's resume method
    if (this.editor && this.editor.editorCore && this.editor.editorCore.resumeQuill) {
      try {
        this.editor.editorCore.resumeQuill();
        editorRestored = true;
        console.log('Editor restored via editorCore');
      } catch (error) {
        console.warn('Failed to restore via editorCore:', error);
      }
    }

    // Second try: Direct Quill restoration if editor core failed
    if (!editorRestored && window.quill) {
      try {
        // Restore container interactivity
        const container = window.quill.container;
        if (container) {
          container.style.pointerEvents = '';
          container.removeAttribute('tabindex');
        }

        // Re-enable the editor
        window.quill.enable();

        // Restore event listeners (we need to get them from the editor core)
        if (this.editor && this.editor.editorCore && this.editor.editorCore.reestablishEventListeners) {
          // Re-setup the event listeners using the new method
          setTimeout(() => {
            this.editor.editorCore.reestablishEventListeners();
          }, 50);
        }

        // Restore selection if it existed
        if (this.storedSelection) {
          setTimeout(() => {
            window.quill.setSelection(this.storedSelection);
            this.storedSelection = null;
          }, 100);
        }

        editorRestored = true;
        console.log('Editor restored via direct Quill');
      } catch (error) {
        console.warn('Failed to restore via direct Quill:', error);
      }
    }

    if (!editorRestored) {
      console.warn('Could not restore editor - neither editorCore nor Quill available');
    }
  }

  restoreEditorForSearch() {
    // Similar to restoreEditor but without restoring previous selection
    // This prevents cursor jumping when doing searches
    let editorRestored = false;

    // First try: Use the editor core's special search resume method
    if (this.editor && this.editor.editorCore && this.editor.editorCore.resumeQuillForSearch) {
      try {
        this.editor.editorCore.resumeQuillForSearch();
        editorRestored = true;
        console.log('Editor restored for search via editorCore.resumeQuillForSearch');
      } catch (error) {
        console.warn('Failed to restore for search via editorCore:', error);
      }
    }

    // Second try: Direct Quill restoration if editor core failed
    if (!editorRestored && window.quill) {
      try {
        // Restore container interactivity
        const container = window.quill.container;
        if (container) {
          container.style.pointerEvents = '';
          container.removeAttribute('tabindex');
        }

        // Re-enable the editor
        window.quill.enable();

        // Restore event listeners
        if (this.editor && this.editor.editorCore && this.editor.editorCore.reestablishEventListeners) {
          setTimeout(() => {
            this.editor.editorCore.reestablishEventListeners();
          }, 50);
        }

        // DON'T restore previous selection - let search set its own selection
        this.storedSelection = null; // Clear it to prevent accidental restoration

        editorRestored = true;
        console.log('Editor restored for search via direct Quill');
      } catch (error) {
        console.warn('Failed to restore for search via direct Quill:', error);
      }
    }

    if (!editorRestored) {
      console.warn('Could not restore editor for search');
    }
  }
}