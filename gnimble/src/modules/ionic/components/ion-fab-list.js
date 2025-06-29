/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, h, Host } from '@stencil/core/internal/client';
import { b as getIonMode } from './ionic-global.js';

const fabListCss = ":host{margin-left:0;margin-right:0;margin-top:calc(100% + 10px);margin-bottom:calc(100% + 10px);display:none;position:absolute;top:0;-ms-flex-direction:column;flex-direction:column;-ms-flex-align:center;align-items:center;min-width:56px;min-height:56px}:host(.fab-list-active){display:-ms-flexbox;display:flex}::slotted(.fab-button-in-list){margin-left:0;margin-right:0;margin-top:8px;margin-bottom:8px;width:40px;height:40px;-webkit-transform:scale(0);transform:scale(0);opacity:0;visibility:hidden}:host(.fab-list-side-top) ::slotted(.fab-button-in-list),:host(.fab-list-side-bottom) ::slotted(.fab-button-in-list){margin-left:0;margin-right:0;margin-top:5px;margin-bottom:5px}:host(.fab-list-side-start) ::slotted(.fab-button-in-list),:host(.fab-list-side-end) ::slotted(.fab-button-in-list){-webkit-margin-start:5px;margin-inline-start:5px;-webkit-margin-end:5px;margin-inline-end:5px;margin-top:0;margin-bottom:0}::slotted(.fab-button-in-list.fab-button-show){-webkit-transform:scale(1);transform:scale(1);opacity:1;visibility:visible}:host(.fab-list-side-top){top:auto;bottom:0;-ms-flex-direction:column-reverse;flex-direction:column-reverse}:host(.fab-list-side-start){-webkit-margin-start:calc(100% + 10px);margin-inline-start:calc(100% + 10px);-webkit-margin-end:calc(100% + 10px);margin-inline-end:calc(100% + 10px);margin-top:0;margin-bottom:0;-ms-flex-direction:row-reverse;flex-direction:row-reverse}:host(.fab-list-side-start){inset-inline-end:0}:host(.fab-list-side-end){-webkit-margin-start:calc(100% + 10px);margin-inline-start:calc(100% + 10px);-webkit-margin-end:calc(100% + 10px);margin-inline-end:calc(100% + 10px);margin-top:0;margin-bottom:0;-ms-flex-direction:row;flex-direction:row}:host(.fab-list-side-end){inset-inline-start:0}";

const FabList = /*@__PURE__*/ proxyCustomElement(class FabList extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        /**
         * If `true`, the fab list will show all fab buttons in the list.
         */
        this.activated = false;
        /**
         * The side the fab list will show on relative to the main fab button.
         */
        this.side = 'bottom';
    }
    activatedChanged(activated) {
        const fabs = Array.from(this.el.querySelectorAll('ion-fab-button'));
        // if showing the fabs add a timeout, else show immediately
        const timeout = activated ? 30 : 0;
        fabs.forEach((fab, i) => {
            setTimeout(() => (fab.show = activated), i * timeout);
        });
    }
    render() {
        const mode = getIonMode(this);
        return (h(Host, { key: '64b33366447f66c7f979cfac56307fbb1a6fac1c', class: {
                [mode]: true,
                'fab-list-active': this.activated,
                [`fab-list-side-${this.side}`]: true,
            } }, h("slot", { key: 'd9f474f7f20fd7e813db358fddc720534ca05bb6' })));
    }
    get el() { return this; }
    static get watchers() { return {
        "activated": ["activatedChanged"]
    }; }
    static get style() { return fabListCss; }
}, [1, "ion-fab-list", {
        "activated": [4],
        "side": [1]
    }, undefined, {
        "activated": ["activatedChanged"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-fab-list"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-fab-list":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, FabList);
            }
            break;
    } });
}

const IonFabList = FabList;
const defineCustomElement = defineCustomElement$1;

export { IonFabList, defineCustomElement };
