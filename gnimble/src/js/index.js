import { FileTransfer } from '@capacitor/file-transfer';
import { Filesystem, Directory } from '@capacitor/filesystem';

let quill;

// Define Home Page Component
class PageHome extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
          <ion-page>
            <ion-header>
              <ion-toolbar>
                <ion-title>
                  <img width="128px" src="assets/imgs/gnimble-logo.png"></img>
                </ion-title>
              </ion-toolbar>
            </ion-header>
            
            <ion-content class="ion-padding">
              <ion-card href="/editor" router-direction="forward">
                <ion-card-header>
                  <ion-card-title>Card Title</ion-card-title>
                  <ion-card-subtitle>Card Subtitle</ion-card-subtitle>
                </ion-card-header>

                <ion-card-content>
                  Here's a small text description for the card content. Nothing more, nothing less.
                </ion-card-content>
              </ion-card>
            </ion-content>
            
            <ion-footer>
              <ion-toolbar>
                <ion-title size="small">Version 2.0.0</ion-title>
              </ion-toolbar>
            </ion-footer>
          </ion-page>
        `;
    }
}

// Define Editor Page Component
class PageEditor extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
          <ion-page>
            <ion-header>
              <ion-toolbar>
                <ion-buttons slot="start">
                  <ion-back-button default-href="/"></ion-back-button>
                </ion-buttons>
                <ion-title>My Story</ion-title>
                <ion-buttons slot="end">
                  <ion-button fill="clear" id="save-btn">
                    <ion-icon name="save-outline"></ion-icon>
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

                <ion-select placeholder="Heading" id="header-select" interface="popover">
                  <ion-select-option value="">Normal</ion-select-option>
                  <ion-select-option value="1">Heading 1</ion-select-option>
                  <ion-select-option value="2">Heading 2</ion-select-option>
                  <ion-select-option value="3">Heading 3</ion-select-option>
                </ion-select>
              </div>
            </ion-header>

            <ion-content>
              <div id="editor">
                <p>Hello World!</p>
                <p>Some initial <strong>bold</strong> text</p>
                <p><br /></p>
              </div>
            </ion-content>

            <ion-footer>
            </ion-footer>
          </ion-page>
        `;

        // Initialize Quill editor when this page loads
        this.initializeEditor();
    }

    async initializeEditor() {
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialize Quill without toolbar
        quill = new Quill('#editor', {
            theme: 'snow',
            modules: {
                toolbar: false
            }
        });

        // Get references to toolbar buttons
        const boldBtn = this.querySelector('#bold-btn');
        const italicBtn = this.querySelector('#italic-btn');
        const underlineBtn = this.querySelector('#underline-btn');
        const alignLeftBtn = this.querySelector('#align-left-btn');
        const alignCenterBtn = this.querySelector('#align-center-btn');
        const alignRightBtn = this.querySelector('#align-right-btn');
        const headerSelect = this.querySelector('#header-select');
        const saveBtn = this.querySelector('#save-btn');

        // Function to update button states
        const updateButtonStates = () => {
            const format = quill.getFormat();

            boldBtn.classList.toggle('format-button-active', !!format.bold);
            italicBtn.classList.toggle('format-button-active', !!format.italic);
            underlineBtn.classList.toggle('format-button-active', !!format.underline);

            const align = format.align || '';
            alignLeftBtn.classList.toggle('format-button-active', align === '');
            alignCenterBtn.classList.toggle('format-button-active', align === 'center');
            alignRightBtn.classList.toggle('format-button-active', align === 'right');

            headerSelect.value = format.header || '';
        };

        // Add event listeners
        boldBtn.addEventListener('click', () => {
            const isBold = quill.getFormat().bold;
            quill.format('bold', !isBold);
            updateButtonStates();
        });

        italicBtn.addEventListener('click', () => {
            const isItalic = quill.getFormat().italic;
            quill.format('italic', !isItalic);
            updateButtonStates();
        });

        underlineBtn.addEventListener('click', () => {
            const isUnderline = quill.getFormat().underline;
            quill.format('underline', !isUnderline);
            updateButtonStates();
        });

        alignLeftBtn.addEventListener('click', () => {
            quill.format('align', '');
            updateButtonStates();
        });

        alignCenterBtn.addEventListener('click', () => {
            quill.format('align', 'center');
            updateButtonStates();
        });

        alignRightBtn.addEventListener('click', () => {
            quill.format('align', 'right');
            updateButtonStates();
        });

        headerSelect.addEventListener('ionChange', (e) => {
            const value = e.detail.value;
            quill.format('header', value || false);
            updateButtonStates();
        });

        saveBtn.addEventListener('click', () => {
            const content = quill.getContents();
            const html = quill.root.innerHTML;

            console.log('Saving content:', { content, html });
            this.showToast('Document saved!');
        });

        // Update button states when selection changes
        quill.on('selection-change', updateButtonStates);
        quill.on('text-change', updateButtonStates);

        updateButtonStates();
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

// Register custom elements
customElements.define('page-home', PageHome);
customElements.define('page-editor', PageEditor);