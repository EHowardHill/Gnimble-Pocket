/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, h, Host } from '@stencil/core/internal/client';
import { b as getIonMode } from './ionic-global.js';

const cardContentIosCss = "ion-card-content{display:block;position:relative}.card-content-ios{-webkit-padding-start:20px;padding-inline-start:20px;-webkit-padding-end:20px;padding-inline-end:20px;padding-top:20px;padding-bottom:20px;font-size:1rem;line-height:1.4}.card-content-ios h1{margin-left:0;margin-right:0;margin-top:0;margin-bottom:2px;font-size:1.5rem;font-weight:normal}.card-content-ios h2{margin-left:0;margin-right:0;margin-top:2px;margin-bottom:2px;font-size:1rem;font-weight:normal}.card-content-ios h3,.card-content-ios h4,.card-content-ios h5,.card-content-ios h6{margin-left:0;margin-right:0;margin-top:2px;margin-bottom:2px;font-size:0.875rem;font-weight:normal}.card-content-ios p{margin-left:0;margin-right:0;margin-top:0;margin-bottom:2px;font-size:0.875rem}ion-card-header+.card-content-ios{padding-top:0}";

const cardContentMdCss = "ion-card-content{display:block;position:relative}.card-content-md{-webkit-padding-start:16px;padding-inline-start:16px;-webkit-padding-end:16px;padding-inline-end:16px;padding-top:13px;padding-bottom:13px;font-size:0.875rem;line-height:1.5}.card-content-md h1{margin-left:0;margin-right:0;margin-top:0;margin-bottom:2px;font-size:1.5rem;font-weight:normal}.card-content-md h2{margin-left:0;margin-right:0;margin-top:2px;margin-bottom:2px;font-size:1rem;font-weight:normal}.card-content-md h3,.card-content-md h4,.card-content-md h5,.card-content-md h6{margin-left:0;margin-right:0;margin-top:2px;margin-bottom:2px;font-size:0.875rem;font-weight:normal}.card-content-md p{margin-left:0;margin-right:0;margin-top:0;margin-bottom:2px;font-size:0.875rem;font-weight:normal;line-height:1.5}ion-card-header+.card-content-md{padding-top:0}";

const CardContent = /*@__PURE__*/ proxyCustomElement(class CardContent extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
    }
    render() {
        const mode = getIonMode(this);
        return (h(Host, { key: 'd98e4d1fc6ad3237549f9bc17e4c67ec5059b1b3', class: {
                [mode]: true,
                // Used internally for styling
                [`card-content-${mode}`]: true,
            } }));
    }
    static get style() { return {
        ios: cardContentIosCss,
        md: cardContentMdCss
    }; }
}, [32, "ion-card-content"]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-card-content"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-card-content":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, CardContent);
            }
            break;
    } });
}

const IonCardContent = CardContent;
const defineCustomElement = defineCustomElement$1;

export { IonCardContent, defineCustomElement };
