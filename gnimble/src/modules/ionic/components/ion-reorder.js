/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, h, Host } from '@stencil/core/internal/client';
import { r as reorderThreeOutline, s as reorderTwoSharp } from './index6.js';
import { b as getIonMode } from './ionic-global.js';
import { d as defineCustomElement$2 } from './icon.js';

const reorderIosCss = ":host([slot]){display:none;line-height:0;z-index:100}.reorder-icon{display:block}::slotted(ion-icon){font-size:dynamic-font(16px)}.reorder-icon{font-size:2.125rem;opacity:0.4}";

const reorderMdCss = ":host([slot]){display:none;line-height:0;z-index:100}.reorder-icon{display:block}::slotted(ion-icon){font-size:dynamic-font(16px)}.reorder-icon{font-size:1.9375rem;opacity:0.3}";

const Reorder = /*@__PURE__*/ proxyCustomElement(class Reorder extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
    }
    onClick(ev) {
        const reorderGroup = this.el.closest('ion-reorder-group');
        ev.preventDefault();
        // Only stop event propagation if the reorder is inside of an enabled
        // reorder group. This allows interaction with clickable children components.
        if (!reorderGroup || !reorderGroup.disabled) {
            ev.stopImmediatePropagation();
        }
    }
    render() {
        const mode = getIonMode(this);
        const reorderIcon = mode === 'ios' ? reorderThreeOutline : reorderTwoSharp;
        return (h(Host, { key: 'e6807bb349725682e99e791ac65e729a360d64e8', class: mode }, h("slot", { key: '1c691cdbffa6427ba08dc12184c69559ed5d5506' }, h("ion-icon", { key: '8b4150302cdca475379582b2251737b5e74079b1', icon: reorderIcon, lazy: false, class: "reorder-icon", part: "icon", "aria-hidden": "true" }))));
    }
    get el() { return this; }
    static get style() { return {
        ios: reorderIosCss,
        md: reorderMdCss
    }; }
}, [33, "ion-reorder", undefined, [[2, "click", "onClick"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-reorder", "ion-icon"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-reorder":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Reorder);
            }
            break;
        case "ion-icon":
            if (!customElements.get(tagName)) {
                defineCustomElement$2();
            }
            break;
    } });
}

const IonReorder = Reorder;
const defineCustomElement = defineCustomElement$1;

export { IonReorder, defineCustomElement };
