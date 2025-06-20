/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, forceUpdate, h, Host } from '@stencil/core/internal/client';
import { b as getIonMode } from './ionic-global.js';

const SIZE_TO_MEDIA = {
    xs: '(min-width: 0px)',
    sm: '(min-width: 576px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 992px)',
    xl: '(min-width: 1200px)',
};
// Check if the window matches the media query
// at the breakpoint passed
// e.g. matchBreakpoint('sm') => true if screen width exceeds 576px
const matchBreakpoint = (breakpoint) => {
    if (breakpoint === undefined || breakpoint === '') {
        return true;
    }
    if (window.matchMedia) {
        const mediaQuery = SIZE_TO_MEDIA[breakpoint];
        return window.matchMedia(mediaQuery).matches;
    }
    return false;
};

const colCss = ":host{-webkit-padding-start:var(--ion-grid-column-padding-xs, var(--ion-grid-column-padding, 5px));padding-inline-start:var(--ion-grid-column-padding-xs, var(--ion-grid-column-padding, 5px));-webkit-padding-end:var(--ion-grid-column-padding-xs, var(--ion-grid-column-padding, 5px));padding-inline-end:var(--ion-grid-column-padding-xs, var(--ion-grid-column-padding, 5px));padding-top:var(--ion-grid-column-padding-xs, var(--ion-grid-column-padding, 5px));padding-bottom:var(--ion-grid-column-padding-xs, var(--ion-grid-column-padding, 5px));margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;-webkit-box-sizing:border-box;box-sizing:border-box;position:relative;-ms-flex-preferred-size:0;flex-basis:0;-ms-flex-positive:1;flex-grow:1;width:100%;max-width:100%;min-height:1px}@media (min-width: 576px){:host{-webkit-padding-start:var(--ion-grid-column-padding-sm, var(--ion-grid-column-padding, 5px));padding-inline-start:var(--ion-grid-column-padding-sm, var(--ion-grid-column-padding, 5px));-webkit-padding-end:var(--ion-grid-column-padding-sm, var(--ion-grid-column-padding, 5px));padding-inline-end:var(--ion-grid-column-padding-sm, var(--ion-grid-column-padding, 5px));padding-top:var(--ion-grid-column-padding-sm, var(--ion-grid-column-padding, 5px));padding-bottom:var(--ion-grid-column-padding-sm, var(--ion-grid-column-padding, 5px))}}@media (min-width: 768px){:host{-webkit-padding-start:var(--ion-grid-column-padding-md, var(--ion-grid-column-padding, 5px));padding-inline-start:var(--ion-grid-column-padding-md, var(--ion-grid-column-padding, 5px));-webkit-padding-end:var(--ion-grid-column-padding-md, var(--ion-grid-column-padding, 5px));padding-inline-end:var(--ion-grid-column-padding-md, var(--ion-grid-column-padding, 5px));padding-top:var(--ion-grid-column-padding-md, var(--ion-grid-column-padding, 5px));padding-bottom:var(--ion-grid-column-padding-md, var(--ion-grid-column-padding, 5px))}}@media (min-width: 992px){:host{-webkit-padding-start:var(--ion-grid-column-padding-lg, var(--ion-grid-column-padding, 5px));padding-inline-start:var(--ion-grid-column-padding-lg, var(--ion-grid-column-padding, 5px));-webkit-padding-end:var(--ion-grid-column-padding-lg, var(--ion-grid-column-padding, 5px));padding-inline-end:var(--ion-grid-column-padding-lg, var(--ion-grid-column-padding, 5px));padding-top:var(--ion-grid-column-padding-lg, var(--ion-grid-column-padding, 5px));padding-bottom:var(--ion-grid-column-padding-lg, var(--ion-grid-column-padding, 5px))}}@media (min-width: 1200px){:host{-webkit-padding-start:var(--ion-grid-column-padding-xl, var(--ion-grid-column-padding, 5px));padding-inline-start:var(--ion-grid-column-padding-xl, var(--ion-grid-column-padding, 5px));-webkit-padding-end:var(--ion-grid-column-padding-xl, var(--ion-grid-column-padding, 5px));padding-inline-end:var(--ion-grid-column-padding-xl, var(--ion-grid-column-padding, 5px));padding-top:var(--ion-grid-column-padding-xl, var(--ion-grid-column-padding, 5px));padding-bottom:var(--ion-grid-column-padding-xl, var(--ion-grid-column-padding, 5px))}}";

const win = typeof window !== 'undefined' ? window : undefined;
// eslint-disable-next-line @typescript-eslint/prefer-optional-chain
const SUPPORTS_VARS = win && !!(win.CSS && win.CSS.supports && win.CSS.supports('--a: 0'));
const BREAKPOINTS = ['', 'xs', 'sm', 'md', 'lg', 'xl'];
const Col = /*@__PURE__*/ proxyCustomElement(class Col extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
    }
    onResize() {
        forceUpdate(this);
    }
    // Loop through all of the breakpoints to see if the media query
    // matches and grab the column value from the relevant prop if so
    getColumns(property) {
        let matched;
        for (const breakpoint of BREAKPOINTS) {
            const matches = matchBreakpoint(breakpoint);
            // Grab the value of the property, if it exists and our
            // media query matches we return the value
            const columns = this[property + breakpoint.charAt(0).toUpperCase() + breakpoint.slice(1)];
            if (matches && columns !== undefined) {
                matched = columns;
            }
        }
        // Return the last matched columns since the breakpoints
        // increase in size and we want to return the largest match
        return matched;
    }
    calculateSize() {
        const columns = this.getColumns('size');
        // If size wasn't set for any breakpoint
        // or if the user set the size without a value
        // it means we need to stick with the default and return
        // e.g. <ion-col size-md>
        if (!columns || columns === '') {
            return;
        }
        // If the size is set to auto then don't calculate a size
        const colSize = columns === 'auto'
            ? 'auto'
            : // If CSS supports variables we should use the grid columns var
                SUPPORTS_VARS
                    ? `calc(calc(${columns} / var(--ion-grid-columns, 12)) * 100%)`
                    : // Convert the columns to a percentage by dividing by the total number
                        // of columns (12) and then multiplying by 100
                        (columns / 12) * 100 + '%';
        return {
            flex: `0 0 ${colSize}`,
            width: `${colSize}`,
            'max-width': `${colSize}`,
        };
    }
    // Called by push, pull, and offset since they use the same calculations
    calculatePosition(property, modifier) {
        const columns = this.getColumns(property);
        if (!columns) {
            return;
        }
        // If the number of columns passed are greater than 0 and less than
        // 12 we can position the column, else default to auto
        const amount = SUPPORTS_VARS
            ? // If CSS supports variables we should use the grid columns var
                `calc(calc(${columns} / var(--ion-grid-columns, 12)) * 100%)`
            : // Convert the columns to a percentage by dividing by the total number
                // of columns (12) and then multiplying by 100
                columns > 0 && columns < 12
                    ? (columns / 12) * 100 + '%'
                    : 'auto';
        return {
            [modifier]: amount,
        };
    }
    calculateOffset(isRTL) {
        return this.calculatePosition('offset', isRTL ? 'margin-right' : 'margin-left');
    }
    calculatePull(isRTL) {
        return this.calculatePosition('pull', isRTL ? 'left' : 'right');
    }
    calculatePush(isRTL) {
        return this.calculatePosition('push', isRTL ? 'right' : 'left');
    }
    render() {
        const isRTL = document.dir === 'rtl';
        const mode = getIonMode(this);
        return (h(Host, { key: '32ed75d81dd09d9bc8999f6d42e5b3cb99c84d91', class: {
                [mode]: true,
            }, style: Object.assign(Object.assign(Object.assign(Object.assign({}, this.calculateOffset(isRTL)), this.calculatePull(isRTL)), this.calculatePush(isRTL)), this.calculateSize()) }, h("slot", { key: '38f8d0440c20cc6d1b1d6a654d07f16de61d8134' })));
    }
    static get style() { return colCss; }
}, [1, "ion-col", {
        "offset": [1],
        "offsetXs": [1, "offset-xs"],
        "offsetSm": [1, "offset-sm"],
        "offsetMd": [1, "offset-md"],
        "offsetLg": [1, "offset-lg"],
        "offsetXl": [1, "offset-xl"],
        "pull": [1],
        "pullXs": [1, "pull-xs"],
        "pullSm": [1, "pull-sm"],
        "pullMd": [1, "pull-md"],
        "pullLg": [1, "pull-lg"],
        "pullXl": [1, "pull-xl"],
        "push": [1],
        "pushXs": [1, "push-xs"],
        "pushSm": [1, "push-sm"],
        "pushMd": [1, "push-md"],
        "pushLg": [1, "push-lg"],
        "pushXl": [1, "push-xl"],
        "size": [1],
        "sizeXs": [1, "size-xs"],
        "sizeSm": [1, "size-sm"],
        "sizeMd": [1, "size-md"],
        "sizeLg": [1, "size-lg"],
        "sizeXl": [1, "size-xl"]
    }, [[9, "resize", "onResize"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-col"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-col":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Col);
            }
            break;
    } });
}

const IonCol = Col;
const defineCustomElement = defineCustomElement$1;

export { IonCol, defineCustomElement };
