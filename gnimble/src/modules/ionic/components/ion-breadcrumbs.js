/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, h, Host } from '@stencil/core/internal/client';
import { c as createColorClasses, h as hostContext } from './theme.js';
import { b as getIonMode } from './ionic-global.js';

const breadcrumbsIosCss = ":host{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap;-ms-flex-align:center;align-items:center}:host(.in-toolbar-color),:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator ion-icon{color:var(--ion-color-contrast)}:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator{background:rgba(var(--ion-color-contrast-rgb), 0.11)}:host(.in-toolbar){-webkit-padding-start:20px;padding-inline-start:20px;-webkit-padding-end:20px;padding-inline-end:20px;padding-top:0;padding-bottom:0;-ms-flex-pack:center;justify-content:center}";

const breadcrumbsMdCss = ":host{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;display:-ms-flexbox;display:flex;-ms-flex-wrap:wrap;flex-wrap:wrap;-ms-flex-align:center;align-items:center}:host(.in-toolbar-color),:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator ion-icon{color:var(--ion-color-contrast)}:host(.in-toolbar-color) .breadcrumbs-collapsed-indicator{background:rgba(var(--ion-color-contrast-rgb), 0.11)}:host(.in-toolbar){-webkit-padding-start:8px;padding-inline-start:8px;-webkit-padding-end:8px;padding-inline-end:8px;padding-top:0;padding-bottom:0}";

const Breadcrumbs = /*@__PURE__*/ proxyCustomElement(class Breadcrumbs extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionCollapsedClick = createEvent(this, "ionCollapsedClick", 7);
        /**
         * The number of breadcrumbs to show before the collapsed indicator.
         * If `itemsBeforeCollapse` + `itemsAfterCollapse` is greater than `maxItems`,
         * the breadcrumbs will not be collapsed.
         */
        this.itemsBeforeCollapse = 1;
        /**
         * The number of breadcrumbs to show after the collapsed indicator.
         * If `itemsBeforeCollapse` + `itemsAfterCollapse` is greater than `maxItems`,
         * the breadcrumbs will not be collapsed.
         */
        this.itemsAfterCollapse = 1;
        this.breadcrumbsInit = () => {
            this.setBreadcrumbSeparator();
            this.setMaxItems();
        };
        this.resetActiveBreadcrumb = () => {
            const breadcrumbs = this.getBreadcrumbs();
            // Only reset the active breadcrumb if we were the ones to change it
            // otherwise use the one set on the component
            const activeBreadcrumb = breadcrumbs.find((breadcrumb) => breadcrumb.active);
            if (activeBreadcrumb && this.activeChanged) {
                activeBreadcrumb.active = false;
            }
        };
        this.setMaxItems = () => {
            const { itemsAfterCollapse, itemsBeforeCollapse, maxItems } = this;
            const breadcrumbs = this.getBreadcrumbs();
            for (const breadcrumb of breadcrumbs) {
                breadcrumb.showCollapsedIndicator = false;
                breadcrumb.collapsed = false;
            }
            // If the number of breadcrumbs exceeds the maximum number of items
            // that should show and the items before / after collapse do not
            // exceed the maximum items then we need to collapse the breadcrumbs
            const shouldCollapse = maxItems !== undefined && breadcrumbs.length > maxItems && itemsBeforeCollapse + itemsAfterCollapse <= maxItems;
            if (shouldCollapse) {
                // Show the collapsed indicator in the first breadcrumb that collapses
                breadcrumbs.forEach((breadcrumb, index) => {
                    if (index === itemsBeforeCollapse) {
                        breadcrumb.showCollapsedIndicator = true;
                    }
                    // Collapse all breadcrumbs that have an index greater than or equal to
                    // the number before collapse and an index less than the total number
                    // of breadcrumbs minus the items that should show after the collapse
                    if (index >= itemsBeforeCollapse && index < breadcrumbs.length - itemsAfterCollapse) {
                        breadcrumb.collapsed = true;
                    }
                });
            }
        };
        this.setBreadcrumbSeparator = () => {
            const { itemsAfterCollapse, itemsBeforeCollapse, maxItems } = this;
            const breadcrumbs = this.getBreadcrumbs();
            // Check if an active breadcrumb exists already
            const active = breadcrumbs.find((breadcrumb) => breadcrumb.active);
            // Set the separator on all but the last breadcrumb
            for (const breadcrumb of breadcrumbs) {
                // The only time the last breadcrumb changes is when
                // itemsAfterCollapse is set to 0, in this case the
                // last breadcrumb will be the collapsed indicator
                const last = maxItems !== undefined && itemsAfterCollapse === 0
                    ? breadcrumb === breadcrumbs[itemsBeforeCollapse]
                    : breadcrumb === breadcrumbs[breadcrumbs.length - 1];
                breadcrumb.last = last;
                // If the breadcrumb has defined whether or not to show the
                // separator then use that value, otherwise check if it's the
                // last breadcrumb
                const separator = breadcrumb.separator !== undefined ? breadcrumb.separator : last ? undefined : true;
                breadcrumb.separator = separator;
                // If there is not an active breadcrumb already
                // set the last one to active
                if (!active && last) {
                    breadcrumb.active = true;
                    this.activeChanged = true;
                }
            }
        };
        this.getBreadcrumbs = () => {
            return Array.from(this.el.querySelectorAll('ion-breadcrumb'));
        };
        this.slotChanged = () => {
            this.resetActiveBreadcrumb();
            this.breadcrumbsInit();
        };
    }
    onCollapsedClick(ev) {
        const breadcrumbs = this.getBreadcrumbs();
        const collapsedBreadcrumbs = breadcrumbs.filter((breadcrumb) => breadcrumb.collapsed);
        this.ionCollapsedClick.emit(Object.assign(Object.assign({}, ev.detail), { collapsedBreadcrumbs }));
    }
    maxItemsChanged() {
        this.resetActiveBreadcrumb();
        this.breadcrumbsInit();
    }
    componentWillLoad() {
        this.breadcrumbsInit();
    }
    render() {
        const { color, collapsed } = this;
        const mode = getIonMode(this);
        return (h(Host, { key: 'fe64e9cdf597ede2db140bf5fa05a0359d82db57', class: createColorClasses(color, {
                [mode]: true,
                'in-toolbar': hostContext('ion-toolbar', this.el),
                'in-toolbar-color': hostContext('ion-toolbar[color]', this.el),
                'breadcrumbs-collapsed': collapsed,
            }) }, h("slot", { key: 'a2c99b579e339055c50a613d5c6b61032f5ddffe', onSlotchange: this.slotChanged })));
    }
    get el() { return this; }
    static get watchers() { return {
        "maxItems": ["maxItemsChanged"],
        "itemsBeforeCollapse": ["maxItemsChanged"],
        "itemsAfterCollapse": ["maxItemsChanged"]
    }; }
    static get style() { return {
        ios: breadcrumbsIosCss,
        md: breadcrumbsMdCss
    }; }
}, [33, "ion-breadcrumbs", {
        "color": [513],
        "maxItems": [2, "max-items"],
        "itemsBeforeCollapse": [2, "items-before-collapse"],
        "itemsAfterCollapse": [2, "items-after-collapse"],
        "collapsed": [32],
        "activeChanged": [32]
    }, [[0, "collapsedClick", "onCollapsedClick"]], {
        "maxItems": ["maxItemsChanged"],
        "itemsBeforeCollapse": ["maxItemsChanged"],
        "itemsAfterCollapse": ["maxItemsChanged"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-breadcrumbs"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-breadcrumbs":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Breadcrumbs);
            }
            break;
    } });
}

const IonBreadcrumbs = Breadcrumbs;
const defineCustomElement = defineCustomElement$1;

export { IonBreadcrumbs, defineCustomElement };
