/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, h, Host } from '@stencil/core/internal/client';
import { c as createColorClasses } from './theme.js';
import { b as getIonMode } from './ionic-global.js';

const titleIosCss = ":host{--color:initial;display:-ms-flexbox;display:flex;-ms-flex:1;flex:1;-ms-flex-align:center;align-items:center;-webkit-transform:translateZ(0);transform:translateZ(0);color:var(--color)}:host(.ion-color){color:var(--ion-color-base)}.toolbar-title{display:block;width:100%;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;pointer-events:auto}:host(.title-small) .toolbar-title{white-space:normal}:host{top:0;-webkit-padding-start:90px;padding-inline-start:90px;-webkit-padding-end:90px;padding-inline-end:90px;padding-top:var(--padding-top);padding-bottom:var(--padding-bottom);position:absolute;width:100%;height:100%;-webkit-transform:translateZ(0);transform:translateZ(0);font-size:min(1.0625rem, 20.4px);font-weight:600;text-align:center;-webkit-box-sizing:border-box;box-sizing:border-box;pointer-events:none}:host{inset-inline-start:0}:host(.title-small){-webkit-padding-start:9px;padding-inline-start:9px;-webkit-padding-end:9px;padding-inline-end:9px;padding-top:6px;padding-bottom:16px;position:relative;font-size:min(0.8125rem, 23.4px);font-weight:normal}:host(.title-large){-webkit-padding-start:12px;padding-inline-start:12px;-webkit-padding-end:12px;padding-inline-end:12px;padding-top:2px;padding-bottom:4px;-webkit-transform-origin:left center;transform-origin:left center;position:static;-ms-flex-align:end;align-items:flex-end;min-width:100%;font-size:min(2.125rem, 61.2px);font-weight:700;text-align:start}:host(.title-large.title-rtl){-webkit-transform-origin:right center;transform-origin:right center}:host(.title-large.ion-cloned-element){--color:var(--ion-text-color, #000);font-family:var(--ion-font-family)}:host(.title-large) .toolbar-title{-webkit-transform-origin:inherit;transform-origin:inherit;width:auto}:host-context([dir=rtl]):host(.title-large) .toolbar-title,:host-context([dir=rtl]).title-large .toolbar-title{-webkit-transform-origin:calc(100% - inherit);transform-origin:calc(100% - inherit)}@supports selector(:dir(rtl)){:host(.title-large:dir(rtl)) .toolbar-title{-webkit-transform-origin:calc(100% - inherit);transform-origin:calc(100% - inherit)}}";

const titleMdCss = ":host{--color:initial;display:-ms-flexbox;display:flex;-ms-flex:1;flex:1;-ms-flex-align:center;align-items:center;-webkit-transform:translateZ(0);transform:translateZ(0);color:var(--color)}:host(.ion-color){color:var(--ion-color-base)}.toolbar-title{display:block;width:100%;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;pointer-events:auto}:host(.title-small) .toolbar-title{white-space:normal}:host{-webkit-padding-start:20px;padding-inline-start:20px;-webkit-padding-end:20px;padding-inline-end:20px;padding-top:0;padding-bottom:0;font-size:1.25rem;font-weight:500;letter-spacing:0.0125em}:host(.title-small){width:100%;height:100%;font-size:0.9375rem;font-weight:normal}";

const ToolbarTitle = /*@__PURE__*/ proxyCustomElement(class ToolbarTitle extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionStyle = createEvent(this, "ionStyle", 7);
    }
    sizeChanged() {
        this.emitStyle();
    }
    connectedCallback() {
        this.emitStyle();
    }
    emitStyle() {
        const size = this.getSize();
        this.ionStyle.emit({
            [`title-${size}`]: true,
        });
    }
    getSize() {
        return this.size !== undefined ? this.size : 'default';
    }
    render() {
        const mode = getIonMode(this);
        const size = this.getSize();
        return (h(Host, { key: 'e599c0bf1b0817df3fa8360bdcd6d787f751c371', class: createColorClasses(this.color, {
                [mode]: true,
                [`title-${size}`]: true,
                'title-rtl': document.dir === 'rtl',
            }) }, h("div", { key: '6e7eee9047d6759876bb31d7305b76efc7c4338c', class: "toolbar-title" }, h("slot", { key: 'bf790eb4c83dd0af4f2fd1f85ab4af5819f46ff4' }))));
    }
    get el() { return this; }
    static get watchers() { return {
        "size": ["sizeChanged"]
    }; }
    static get style() { return {
        ios: titleIosCss,
        md: titleMdCss
    }; }
}, [33, "ion-title", {
        "color": [513],
        "size": [1]
    }, undefined, {
        "size": ["sizeChanged"]
    }]);
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-title"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-title":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, ToolbarTitle);
            }
            break;
    } });
}

export { ToolbarTitle as T, defineCustomElement as d };
