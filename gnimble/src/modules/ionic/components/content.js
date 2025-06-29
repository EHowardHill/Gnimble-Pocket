/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, Build, readTask, forceUpdate, h, Host } from '@stencil/core/internal/client';
import { i as inheritAriaAttributes, k as hasLazyBuild, c as componentOnReady } from './helpers.js';
import { b as getIonMode, a as isPlatform } from './ionic-global.js';
import { i as isRTL } from './dir.js';
import { c as createColorClasses, h as hostContext } from './theme.js';

const contentCss = ":host{--background:var(--ion-background-color, #fff);--color:var(--ion-text-color, #000);--padding-top:0px;--padding-bottom:0px;--padding-start:0px;--padding-end:0px;--keyboard-offset:0px;--offset-top:0px;--offset-bottom:0px;--overflow:auto;display:block;position:relative;-ms-flex:1;flex:1;width:100%;height:100%;margin:0 !important;padding:0 !important;font-family:var(--ion-font-family, inherit);contain:size style}:host(.ion-color) .inner-scroll{background:var(--ion-color-base);color:var(--ion-color-contrast)}#background-content{left:0px;right:0px;top:calc(var(--offset-top) * -1);bottom:calc(var(--offset-bottom) * -1);position:absolute;background:var(--background)}.inner-scroll{left:0px;right:0px;top:calc(var(--offset-top) * -1);bottom:calc(var(--offset-bottom) * -1);-webkit-padding-start:var(--padding-start);padding-inline-start:var(--padding-start);-webkit-padding-end:var(--padding-end);padding-inline-end:var(--padding-end);padding-top:calc(var(--padding-top) + var(--offset-top));padding-bottom:calc(var(--padding-bottom) + var(--keyboard-offset) + var(--offset-bottom));position:absolute;color:var(--color);-webkit-box-sizing:border-box;box-sizing:border-box;overflow:hidden;-ms-touch-action:pan-x pan-y pinch-zoom;touch-action:pan-x pan-y pinch-zoom}.scroll-y,.scroll-x{-webkit-overflow-scrolling:touch;z-index:0;will-change:scroll-position}.scroll-y{overflow-y:var(--overflow);overscroll-behavior-y:contain}.scroll-x{overflow-x:var(--overflow);overscroll-behavior-x:contain}.overscroll::before,.overscroll::after{position:absolute;width:1px;height:1px;content:\"\"}.overscroll::before{bottom:-1px}.overscroll::after{top:-1px}:host(.content-sizing){display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;min-height:0;contain:none}:host(.content-sizing) .inner-scroll{position:relative;top:0;bottom:0;margin-top:calc(var(--offset-top) * -1);margin-bottom:calc(var(--offset-bottom) * -1)}.transition-effect{display:none;position:absolute;width:100%;height:100vh;opacity:0;pointer-events:none}:host(.content-ltr) .transition-effect{left:-100%;}:host(.content-rtl) .transition-effect{right:-100%;}.transition-cover{position:absolute;right:0;width:100%;height:100%;background:black;opacity:0.1}.transition-shadow{display:block;position:absolute;width:100%;height:100%;-webkit-box-shadow:inset -9px 0 9px 0 rgba(0, 0, 100, 0.03);box-shadow:inset -9px 0 9px 0 rgba(0, 0, 100, 0.03)}:host(.content-ltr) .transition-shadow{right:0;}:host(.content-rtl) .transition-shadow{left:0;-webkit-transform:scaleX(-1);transform:scaleX(-1)}::slotted([slot=fixed]){position:absolute;-webkit-transform:translateZ(0);transform:translateZ(0)}";

const Content = /*@__PURE__*/ proxyCustomElement(class Content extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionScrollStart = createEvent(this, "ionScrollStart", 7);
        this.ionScroll = createEvent(this, "ionScroll", 7);
        this.ionScrollEnd = createEvent(this, "ionScrollEnd", 7);
        this.watchDog = null;
        this.isScrolling = false;
        this.lastScroll = 0;
        this.queued = false;
        this.cTop = -1;
        this.cBottom = -1;
        this.isMainContent = true;
        this.resizeTimeout = null;
        this.inheritedAttributes = {};
        this.tabsElement = null;
        // Detail is used in a hot loop in the scroll event, by allocating it here
        // V8 will be able to inline any read/write to it since it's a monomorphic class.
        // https://mrale.ph/blog/2015/01/11/whats-up-with-monomorphism.html
        this.detail = {
            scrollTop: 0,
            scrollLeft: 0,
            type: 'scroll',
            event: undefined,
            startX: 0,
            startY: 0,
            startTime: 0,
            currentX: 0,
            currentY: 0,
            velocityX: 0,
            velocityY: 0,
            deltaX: 0,
            deltaY: 0,
            currentTime: 0,
            data: undefined,
            isScrolling: true,
        };
        /**
         * If `true`, the content will scroll behind the headers
         * and footers. This effect can easily be seen by setting the toolbar
         * to transparent.
         */
        this.fullscreen = false;
        /**
         * Controls where the fixed content is placed relative to the main content
         * in the DOM. This can be used to control the order in which fixed elements
         * receive keyboard focus.
         * For example, if a FAB in the fixed slot should receive keyboard focus before
         * the main page content, set this property to `'before'`.
         */
        this.fixedSlotPlacement = 'after';
        /**
         * If you want to enable the content scrolling in the X axis, set this property to `true`.
         */
        this.scrollX = false;
        /**
         * If you want to disable the content scrolling in the Y axis, set this property to `false`.
         */
        this.scrollY = true;
        /**
         * Because of performance reasons, ionScroll events are disabled by default, in order to enable them
         * and start listening from (ionScroll), set this property to `true`.
         */
        this.scrollEvents = false;
    }
    componentWillLoad() {
        this.inheritedAttributes = inheritAriaAttributes(this.el);
    }
    connectedCallback() {
        this.isMainContent = this.el.closest('ion-menu, ion-popover, ion-modal') === null;
        /**
         * The fullscreen content offsets need to be
         * computed after the tab bar has loaded. Since
         * lazy evaluation means components are not hydrated
         * at the same time, we need to wait for the ionTabBarLoaded
         * event to fire. This does not impact dist-custom-elements
         * because there is no hydration there.
         */
        if (hasLazyBuild(this.el)) {
            /**
             * We need to cache the reference to the tabs.
             * If just the content is unmounted then we won't
             * be able to query for the closest tabs on disconnectedCallback
             * since the content has been removed from the DOM tree.
             */
            const closestTabs = (this.tabsElement = this.el.closest('ion-tabs'));
            if (closestTabs !== null) {
                /**
                 * When adding and removing the event listener
                 * we need to make sure we pass the same function reference
                 * otherwise the event listener will not be removed properly.
                 * We can't only pass `this.resize` because "this" in the function
                 * context becomes a reference to IonTabs instead of IonContent.
                 *
                 * Additionally, we listen for ionTabBarLoaded on the IonTabs
                 * instance rather than the IonTabBar instance. It's possible for
                 * a tab bar to be conditionally rendered/mounted. Since ionTabBarLoaded
                 * bubbles, we can catch any instances of child tab bars loading by listening
                 * on IonTabs.
                 */
                this.tabsLoadCallback = () => this.resize();
                closestTabs.addEventListener('ionTabBarLoaded', this.tabsLoadCallback);
            }
        }
    }
    disconnectedCallback() {
        this.onScrollEnd();
        if (hasLazyBuild(this.el)) {
            /**
             * The event listener and tabs caches need to
             * be cleared otherwise this will create a memory
             * leak where the IonTabs instance can never be
             * garbage collected.
             */
            const { tabsElement, tabsLoadCallback } = this;
            if (tabsElement !== null && tabsLoadCallback !== undefined) {
                tabsElement.removeEventListener('ionTabBarLoaded', tabsLoadCallback);
            }
            this.tabsElement = null;
            this.tabsLoadCallback = undefined;
        }
    }
    /**
     * Rotating certain devices can update
     * the safe area insets. As a result,
     * the fullscreen feature on ion-content
     * needs to be recalculated.
     *
     * We listen for "resize" because we
     * do not care what the orientation of
     * the device is. Other APIs
     * such as ScreenOrientation or
     * the deviceorientation event must have
     * permission from the user first whereas
     * the "resize" event does not.
     *
     * We also throttle the callback to minimize
     * thrashing when quickly resizing a window.
     */
    onResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        this.resizeTimeout = setTimeout(() => {
            /**
             * Resize should only happen
             * if the content is visible.
             * When the content is hidden
             * then offsetParent will be null.
             */
            if (this.el.offsetParent === null) {
                return;
            }
            this.resize();
        }, 100);
    }
    shouldForceOverscroll() {
        const { forceOverscroll } = this;
        const mode = getIonMode(this);
        return forceOverscroll === undefined ? mode === 'ios' && isPlatform('ios') : forceOverscroll;
    }
    resize() {
        /**
         * Only force update if the component is rendered in a browser context.
         * Using `forceUpdate` in a server context with pre-rendering can lead to an infinite loop.
         * The `hydrateDocument` function in `@stencil/core` will render the `ion-content`, but
         * `forceUpdate` will trigger another render, locking up the server.
         *
         * TODO: Remove if STENCIL-834 determines Stencil will account for this.
         */
        if (Build.isBrowser) {
            if (this.fullscreen) {
                readTask(() => this.readDimensions());
            }
            else if (this.cTop !== 0 || this.cBottom !== 0) {
                this.cTop = this.cBottom = 0;
                forceUpdate(this);
            }
        }
    }
    readDimensions() {
        const page = getPageElement(this.el);
        const top = Math.max(this.el.offsetTop, 0);
        const bottom = Math.max(page.offsetHeight - top - this.el.offsetHeight, 0);
        const dirty = top !== this.cTop || bottom !== this.cBottom;
        if (dirty) {
            this.cTop = top;
            this.cBottom = bottom;
            forceUpdate(this);
        }
    }
    onScroll(ev) {
        const timeStamp = Date.now();
        const shouldStart = !this.isScrolling;
        this.lastScroll = timeStamp;
        if (shouldStart) {
            this.onScrollStart();
        }
        if (!this.queued && this.scrollEvents) {
            this.queued = true;
            readTask((ts) => {
                this.queued = false;
                this.detail.event = ev;
                updateScrollDetail(this.detail, this.scrollEl, ts, shouldStart);
                this.ionScroll.emit(this.detail);
            });
        }
    }
    /**
     * Get the element where the actual scrolling takes place.
     * This element can be used to subscribe to `scroll` events or manually modify
     * `scrollTop`. However, it's recommended to use the API provided by `ion-content`:
     *
     * i.e. Using `ionScroll`, `ionScrollStart`, `ionScrollEnd` for scrolling events
     * and `scrollToPoint()` to scroll the content into a certain point.
     */
    async getScrollElement() {
        /**
         * If this gets called in certain early lifecycle hooks (ex: Vue onMounted),
         * scrollEl won't be defined yet with the custom elements build, so wait for it to load in.
         */
        if (!this.scrollEl) {
            await new Promise((resolve) => componentOnReady(this.el, resolve));
        }
        return Promise.resolve(this.scrollEl);
    }
    /**
     * Returns the background content element.
     * @internal
     */
    async getBackgroundElement() {
        if (!this.backgroundContentEl) {
            await new Promise((resolve) => componentOnReady(this.el, resolve));
        }
        return Promise.resolve(this.backgroundContentEl);
    }
    /**
     * Scroll to the top of the component.
     *
     * @param duration The amount of time to take scrolling to the top. Defaults to `0`.
     */
    scrollToTop(duration = 0) {
        return this.scrollToPoint(undefined, 0, duration);
    }
    /**
     * Scroll to the bottom of the component.
     *
     * @param duration The amount of time to take scrolling to the bottom. Defaults to `0`.
     */
    async scrollToBottom(duration = 0) {
        const scrollEl = await this.getScrollElement();
        const y = scrollEl.scrollHeight - scrollEl.clientHeight;
        return this.scrollToPoint(undefined, y, duration);
    }
    /**
     * Scroll by a specified X/Y distance in the component.
     *
     * @param x The amount to scroll by on the horizontal axis.
     * @param y The amount to scroll by on the vertical axis.
     * @param duration The amount of time to take scrolling by that amount.
     */
    async scrollByPoint(x, y, duration) {
        const scrollEl = await this.getScrollElement();
        return this.scrollToPoint(x + scrollEl.scrollLeft, y + scrollEl.scrollTop, duration);
    }
    /**
     * Scroll to a specified X/Y location in the component.
     *
     * @param x The point to scroll to on the horizontal axis.
     * @param y The point to scroll to on the vertical axis.
     * @param duration The amount of time to take scrolling to that point. Defaults to `0`.
     */
    async scrollToPoint(x, y, duration = 0) {
        const el = await this.getScrollElement();
        if (duration < 32) {
            if (y != null) {
                el.scrollTop = y;
            }
            if (x != null) {
                el.scrollLeft = x;
            }
            return;
        }
        let resolve;
        let startTime = 0;
        const promise = new Promise((r) => (resolve = r));
        const fromY = el.scrollTop;
        const fromX = el.scrollLeft;
        const deltaY = y != null ? y - fromY : 0;
        const deltaX = x != null ? x - fromX : 0;
        // scroll loop
        const step = (timeStamp) => {
            const linearTime = Math.min(1, (timeStamp - startTime) / duration) - 1;
            const easedT = Math.pow(linearTime, 3) + 1;
            if (deltaY !== 0) {
                el.scrollTop = Math.floor(easedT * deltaY + fromY);
            }
            if (deltaX !== 0) {
                el.scrollLeft = Math.floor(easedT * deltaX + fromX);
            }
            if (easedT < 1) {
                // do not use DomController here
                // must use nativeRaf in order to fire in the next frame
                requestAnimationFrame(step);
            }
            else {
                resolve();
            }
        };
        // chill out for a frame first
        requestAnimationFrame((ts) => {
            startTime = ts;
            step(ts);
        });
        return promise;
    }
    onScrollStart() {
        this.isScrolling = true;
        this.ionScrollStart.emit({
            isScrolling: true,
        });
        if (this.watchDog) {
            clearInterval(this.watchDog);
        }
        // watchdog
        this.watchDog = setInterval(() => {
            if (this.lastScroll < Date.now() - 120) {
                this.onScrollEnd();
            }
        }, 100);
    }
    onScrollEnd() {
        if (this.watchDog)
            clearInterval(this.watchDog);
        this.watchDog = null;
        if (this.isScrolling) {
            this.isScrolling = false;
            this.ionScrollEnd.emit({
                isScrolling: false,
            });
        }
    }
    render() {
        const { fixedSlotPlacement, inheritedAttributes, isMainContent, scrollX, scrollY, el } = this;
        const rtl = isRTL(el) ? 'rtl' : 'ltr';
        const mode = getIonMode(this);
        const forceOverscroll = this.shouldForceOverscroll();
        const transitionShadow = mode === 'ios';
        this.resize();
        return (h(Host, Object.assign({ key: 'f2a24aa66dbf5c76f9d4b06f708eb73cadc239df', role: isMainContent ? 'main' : undefined, class: createColorClasses(this.color, {
                [mode]: true,
                'content-sizing': hostContext('ion-popover', this.el),
                overscroll: forceOverscroll,
                [`content-${rtl}`]: true,
            }), style: {
                '--offset-top': `${this.cTop}px`,
                '--offset-bottom': `${this.cBottom}px`,
            } }, inheritedAttributes), h("div", { key: '6480ca7648b278abb36477b3838bccbcd4995e2a', ref: (el) => (this.backgroundContentEl = el), id: "background-content", part: "background" }), fixedSlotPlacement === 'before' ? h("slot", { name: "fixed" }) : null, h("div", { key: '29a23b663f5f0215bb000820c01e1814c0d55985', class: {
                'inner-scroll': true,
                'scroll-x': scrollX,
                'scroll-y': scrollY,
                overscroll: (scrollX || scrollY) && forceOverscroll,
            }, ref: (scrollEl) => (this.scrollEl = scrollEl), onScroll: this.scrollEvents ? (ev) => this.onScroll(ev) : undefined, part: "scroll" }, h("slot", { key: '0fe1bd05609a4b88ae2ce9addf5d5dc5dc1806f0' })), transitionShadow ? (h("div", { class: "transition-effect" }, h("div", { class: "transition-cover" }), h("div", { class: "transition-shadow" }))) : null, fixedSlotPlacement === 'after' ? h("slot", { name: "fixed" }) : null));
    }
    get el() { return this; }
    static get style() { return contentCss; }
}, [1, "ion-content", {
        "color": [513],
        "fullscreen": [4],
        "fixedSlotPlacement": [1, "fixed-slot-placement"],
        "forceOverscroll": [1028, "force-overscroll"],
        "scrollX": [4, "scroll-x"],
        "scrollY": [4, "scroll-y"],
        "scrollEvents": [4, "scroll-events"],
        "getScrollElement": [64],
        "getBackgroundElement": [64],
        "scrollToTop": [64],
        "scrollToBottom": [64],
        "scrollByPoint": [64],
        "scrollToPoint": [64]
    }, [[9, "resize", "onResize"]]]);
const getParentElement = (el) => {
    var _a;
    if (el.parentElement) {
        // normal element with a parent element
        return el.parentElement;
    }
    if ((_a = el.parentNode) === null || _a === void 0 ? void 0 : _a.host) {
        // shadow dom's document fragment
        return el.parentNode.host;
    }
    return null;
};
const getPageElement = (el) => {
    const tabs = el.closest('ion-tabs');
    if (tabs) {
        return tabs;
    }
    /**
     * If we're in a popover, we need to use its wrapper so we can account for space
     * between the popover and the edges of the screen. But if the popover contains
     * its own page element, we should use that instead.
     */
    const page = el.closest('ion-app, ion-page, .ion-page, page-inner, .popover-content');
    if (page) {
        return page;
    }
    return getParentElement(el);
};
// ******** DOM READ ****************
const updateScrollDetail = (detail, el, timestamp, shouldStart) => {
    const prevX = detail.currentX;
    const prevY = detail.currentY;
    const prevT = detail.currentTime;
    const currentX = el.scrollLeft;
    const currentY = el.scrollTop;
    const timeDelta = timestamp - prevT;
    if (shouldStart) {
        // remember the start positions
        detail.startTime = timestamp;
        detail.startX = currentX;
        detail.startY = currentY;
        detail.velocityX = detail.velocityY = 0;
    }
    detail.currentTime = timestamp;
    detail.currentX = detail.scrollLeft = currentX;
    detail.currentY = detail.scrollTop = currentY;
    detail.deltaX = currentX - detail.startX;
    detail.deltaY = currentY - detail.startY;
    if (timeDelta > 0 && timeDelta < 100) {
        const velocityX = (currentX - prevX) / timeDelta;
        const velocityY = (currentY - prevY) / timeDelta;
        detail.velocityX = velocityX * 0.7 + detail.velocityX * 0.3;
        detail.velocityY = velocityY * 0.7 + detail.velocityY * 0.3;
    }
};
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-content"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-content":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Content);
            }
            break;
    } });
}

export { Content as C, defineCustomElement as d };
