/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, writeTask, readTask, h, Host } from '@stencil/core/internal/client';
import { a as findClosestIonContent, p as printIonContentErrorMsg, g as getScrollElement } from './index8.js';
import { b as getIonMode } from './ionic-global.js';

const infiniteScrollCss = "ion-infinite-scroll{display:none;width:100%}.infinite-scroll-enabled{display:block}";

const InfiniteScroll = /*@__PURE__*/ proxyCustomElement(class InfiniteScroll extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.ionInfinite = createEvent(this, "ionInfinite", 7);
        this.thrPx = 0;
        this.thrPc = 0;
        /**
         * didFire exists so that ionInfinite
         * does not fire multiple times if
         * users continue to scroll after
         * scrolling into the infinite
         * scroll threshold.
         */
        this.didFire = false;
        this.isBusy = false;
        this.isLoading = false;
        /**
         * The threshold distance from the bottom
         * of the content to call the `infinite` output event when scrolled.
         * The threshold value can be either a percent, or
         * in pixels. For example, use the value of `10%` for the `infinite`
         * output event to get called when the user has scrolled 10%
         * from the bottom of the page. Use the value `100px` when the
         * scroll is within 100 pixels from the bottom of the page.
         */
        this.threshold = '15%';
        /**
         * If `true`, the infinite scroll will be hidden and scroll event listeners
         * will be removed.
         *
         * Set this to true to disable the infinite scroll from actively
         * trying to receive new data while scrolling. This is useful
         * when it is known that there is no more data that can be added, and
         * the infinite scroll is no longer needed.
         */
        this.disabled = false;
        /**
         * The position of the infinite scroll element.
         * The value can be either `top` or `bottom`.
         */
        this.position = 'bottom';
        this.onScroll = () => {
            const scrollEl = this.scrollEl;
            if (!scrollEl || !this.canStart()) {
                return 1;
            }
            const infiniteHeight = this.el.offsetHeight;
            if (infiniteHeight === 0) {
                // if there is no height of this element then do nothing
                return 2;
            }
            const scrollTop = scrollEl.scrollTop;
            const scrollHeight = scrollEl.scrollHeight;
            const height = scrollEl.offsetHeight;
            const threshold = this.thrPc !== 0 ? height * this.thrPc : this.thrPx;
            const distanceFromInfinite = this.position === 'bottom'
                ? scrollHeight - infiniteHeight - scrollTop - threshold - height
                : scrollTop - infiniteHeight - threshold;
            if (distanceFromInfinite < 0) {
                if (!this.didFire) {
                    this.isLoading = true;
                    this.didFire = true;
                    this.ionInfinite.emit();
                    return 3;
                }
            }
            return 4;
        };
    }
    thresholdChanged() {
        const val = this.threshold;
        if (val.lastIndexOf('%') > -1) {
            this.thrPx = 0;
            this.thrPc = parseFloat(val) / 100;
        }
        else {
            this.thrPx = parseFloat(val);
            this.thrPc = 0;
        }
    }
    disabledChanged() {
        const disabled = this.disabled;
        if (disabled) {
            this.isLoading = false;
            this.isBusy = false;
        }
        this.enableScrollEvents(!disabled);
    }
    async connectedCallback() {
        const contentEl = findClosestIonContent(this.el);
        if (!contentEl) {
            printIonContentErrorMsg(this.el);
            return;
        }
        this.scrollEl = await getScrollElement(contentEl);
        this.thresholdChanged();
        this.disabledChanged();
        if (this.position === 'top') {
            writeTask(() => {
                if (this.scrollEl) {
                    this.scrollEl.scrollTop = this.scrollEl.scrollHeight - this.scrollEl.clientHeight;
                }
            });
        }
    }
    disconnectedCallback() {
        this.enableScrollEvents(false);
        this.scrollEl = undefined;
    }
    /**
     * Call `complete()` within the `ionInfinite` output event handler when
     * your async operation has completed. For example, the `loading`
     * state is while the app is performing an asynchronous operation,
     * such as receiving more data from an AJAX request to add more items
     * to a data list. Once the data has been received and UI updated, you
     * then call this method to signify that the loading has completed.
     * This method will change the infinite scroll's state from `loading`
     * to `enabled`.
     */
    async complete() {
        const scrollEl = this.scrollEl;
        if (!this.isLoading || !scrollEl) {
            return;
        }
        this.isLoading = false;
        if (this.position === 'top') {
            /**
             * New content is being added at the top, but the scrollTop position stays the same,
             * which causes a scroll jump visually. This algorithm makes sure to prevent this.
             * (Frame 1)
             *    - complete() is called, but the UI hasn't had time to update yet.
             *    - Save the current content dimensions.
             *    - Wait for the next frame using _dom.read, so the UI will be updated.
             * (Frame 2)
             *    - Read the new content dimensions.
             *    - Calculate the height difference and the new scroll position.
             *    - Delay the scroll position change until other possible dom reads are done using _dom.write to be performant.
             * (Still frame 2, if I'm correct)
             *    - Change the scroll position (= visually maintain the scroll position).
             *    - Change the state to re-enable the InfiniteScroll.
             *    - This should be after changing the scroll position, or it could
             *    cause the InfiniteScroll to be triggered again immediately.
             * (Frame 3)
             *    Done.
             */
            this.isBusy = true;
            // ******** DOM READ ****************
            // Save the current content dimensions before the UI updates
            const prev = scrollEl.scrollHeight - scrollEl.scrollTop;
            // ******** DOM READ ****************
            requestAnimationFrame(() => {
                readTask(() => {
                    // UI has updated, save the new content dimensions
                    const scrollHeight = scrollEl.scrollHeight;
                    // New content was added on top, so the scroll position should be changed immediately to prevent it from jumping around
                    const newScrollTop = scrollHeight - prev;
                    // ******** DOM WRITE ****************
                    requestAnimationFrame(() => {
                        writeTask(() => {
                            scrollEl.scrollTop = newScrollTop;
                            this.isBusy = false;
                            this.didFire = false;
                        });
                    });
                });
            });
        }
        else {
            this.didFire = false;
        }
    }
    canStart() {
        return !this.disabled && !this.isBusy && !!this.scrollEl && !this.isLoading;
    }
    enableScrollEvents(shouldListen) {
        if (this.scrollEl) {
            if (shouldListen) {
                this.scrollEl.addEventListener('scroll', this.onScroll);
            }
            else {
                this.scrollEl.removeEventListener('scroll', this.onScroll);
            }
        }
    }
    render() {
        const mode = getIonMode(this);
        const disabled = this.disabled;
        return (h(Host, { key: 'e844956795f69be33396ce4480aa7a54ad01b28c', class: {
                [mode]: true,
                'infinite-scroll-loading': this.isLoading,
                'infinite-scroll-enabled': !disabled,
            } }));
    }
    get el() { return this; }
    static get watchers() { return {
        "threshold": ["thresholdChanged"],
        "disabled": ["disabledChanged"]
    }; }
    static get style() { return infiniteScrollCss; }
}, [0, "ion-infinite-scroll", {
        "threshold": [1],
        "disabled": [4],
        "position": [1],
        "isLoading": [32],
        "complete": [64]
    }, undefined, {
        "threshold": ["thresholdChanged"],
        "disabled": ["disabledChanged"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-infinite-scroll"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-infinite-scroll":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, InfiniteScroll);
            }
            break;
    } });
}

const IonInfiniteScroll = InfiniteScroll;
const defineCustomElement = defineCustomElement$1;

export { IonInfiniteScroll, defineCustomElement };
