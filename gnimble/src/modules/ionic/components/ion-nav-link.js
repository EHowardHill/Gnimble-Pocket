/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, h, Host } from '@stencil/core/internal/client';

const navLink = (el, routerDirection, component, componentProps, routerAnimation) => {
    const nav = el.closest('ion-nav');
    if (nav) {
        if (routerDirection === 'forward') {
            if (component !== undefined) {
                return nav.push(component, componentProps, { skipIfBusy: true, animationBuilder: routerAnimation });
            }
        }
        else if (routerDirection === 'root') {
            if (component !== undefined) {
                return nav.setRoot(component, componentProps, { skipIfBusy: true, animationBuilder: routerAnimation });
            }
        }
        else if (routerDirection === 'back') {
            return nav.pop({ skipIfBusy: true, animationBuilder: routerAnimation });
        }
    }
    return Promise.resolve(false);
};

const NavLink = /*@__PURE__*/ proxyCustomElement(class NavLink extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        /**
         * The transition direction when navigating to another page.
         */
        this.routerDirection = 'forward';
        this.onClick = () => {
            return navLink(this.el, this.routerDirection, this.component, this.componentProps, this.routerAnimation);
        };
    }
    render() {
        return h(Host, { key: '6dbb1ad4f351e9215375aac11ab9b53762e07a08', onClick: this.onClick });
    }
    get el() { return this; }
}, [0, "ion-nav-link", {
        "component": [1],
        "componentProps": [16, "component-props"],
        "routerDirection": [1, "router-direction"],
        "routerAnimation": [16, "router-animation"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-nav-link"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-nav-link":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, NavLink);
            }
            break;
    } });
}

const IonNavLink = NavLink;
const defineCustomElement = defineCustomElement$1;

export { IonNavLink, defineCustomElement };
