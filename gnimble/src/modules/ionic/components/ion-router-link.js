/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, h, Host } from '@stencil/core/internal/client';
import { o as openURL, c as createColorClasses } from './theme.js';
import { b as getIonMode } from './ionic-global.js';

const routerLinkCss = ":host{--background:transparent;--color:var(--ion-color-primary, #0054e9);background:var(--background);color:var(--color)}:host(.ion-color){color:var(--ion-color-base)}a{font-family:inherit;font-size:inherit;font-style:inherit;font-weight:inherit;letter-spacing:inherit;text-decoration:inherit;text-indent:inherit;text-overflow:inherit;text-transform:inherit;text-align:inherit;white-space:inherit;color:inherit}";

const RouterLink = /*@__PURE__*/ proxyCustomElement(class RouterLink extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        /**
         * When using a router, it specifies the transition direction when navigating to
         * another page using `href`.
         */
        this.routerDirection = 'forward';
        this.onClick = (ev) => {
            openURL(this.href, ev, this.routerDirection, this.routerAnimation);
        };
    }
    render() {
        const mode = getIonMode(this);
        const attrs = {
            href: this.href,
            rel: this.rel,
            target: this.target,
        };
        return (h(Host, { key: 'd7f2affcde45c5fbb6cb46cd1c30008ee92a68c5', onClick: this.onClick, class: createColorClasses(this.color, {
                [mode]: true,
                'ion-activatable': true,
            }) }, h("a", Object.assign({ key: 'babafae85ca5c6429958d383feff0493ff8cf33e' }, attrs), h("slot", { key: '50314e9555bbf6dffa0c50c3f763009dee59b10b' }))));
    }
    static get style() { return routerLinkCss; }
}, [1, "ion-router-link", {
        "color": [513],
        "href": [1],
        "rel": [1],
        "routerDirection": [1, "router-direction"],
        "routerAnimation": [16, "router-animation"],
        "target": [1]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-router-link"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-router-link":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, RouterLink);
            }
            break;
    } });
}

const IonRouterLink = RouterLink;
const defineCustomElement = defineCustomElement$1;

export { IonRouterLink, defineCustomElement };
