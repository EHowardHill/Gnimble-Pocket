/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { c as componentOnReady } from './helpers.js';
import { e as printRequiredElementError } from './index4.js';

const ION_CONTENT_TAG_NAME = 'ION-CONTENT';
const ION_CONTENT_ELEMENT_SELECTOR = 'ion-content';
const ION_CONTENT_CLASS_SELECTOR = '.ion-content-scroll-host';
/**
 * Selector used for implementations reliant on `<ion-content>` for scroll event changes.
 *
 * Developers should use the `.ion-content-scroll-host` selector to target the element emitting
 * scroll events. With virtual scroll implementations this will be the host element for
 * the scroll viewport.
 */
const ION_CONTENT_SELECTOR = `${ION_CONTENT_ELEMENT_SELECTOR}, ${ION_CONTENT_CLASS_SELECTOR}`;
const isIonContent = (el) => el.tagName === ION_CONTENT_TAG_NAME;
/**
 * Waits for the element host fully initialize before
 * returning the inner scroll element.
 *
 * For `ion-content` the scroll target will be the result
 * of the `getScrollElement` function.
 *
 * For custom implementations it will be the element host
 * or a selector within the host, if supplied through `scrollTarget`.
 */
const getScrollElement = async (el) => {
    if (isIonContent(el)) {
        await new Promise((resolve) => componentOnReady(el, resolve));
        return el.getScrollElement();
    }
    return el;
};
/**
 * Queries the element matching the selector for IonContent.
 * See ION_CONTENT_SELECTOR for the selector used.
 */
const findIonContent = (el) => {
    /**
     * First we try to query the custom scroll host selector in cases where
     * the implementation is using an outer `ion-content` with an inner custom
     * scroll container.
     */
    const customContentHost = el.querySelector(ION_CONTENT_CLASS_SELECTOR);
    if (customContentHost) {
        return customContentHost;
    }
    return el.querySelector(ION_CONTENT_SELECTOR);
};
/**
 * Queries the closest element matching the selector for IonContent.
 */
const findClosestIonContent = (el) => {
    return el.closest(ION_CONTENT_SELECTOR);
};
/**
 * Scrolls to the top of the element. If an `ion-content` is found, it will scroll
 * using the public API `scrollToTop` with a duration.
 */
const scrollToTop = (el, durationMs) => {
    if (isIonContent(el)) {
        const content = el;
        return content.scrollToTop(durationMs);
    }
    return Promise.resolve(el.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth' ,
    }));
};
/**
 * Scrolls by a specified X/Y distance in the component. If an `ion-content` is found, it will scroll
 * using the public API `scrollByPoint` with a duration.
 */
const scrollByPoint = (el, x, y, durationMs) => {
    if (isIonContent(el)) {
        const content = el;
        return content.scrollByPoint(x, y, durationMs);
    }
    return Promise.resolve(el.scrollBy({
        top: y,
        left: x,
        behavior: durationMs > 0 ? 'smooth' : 'auto',
    }));
};
/**
 * Prints an error informing developers that an implementation requires an element to be used
 * within either the `ion-content` selector or the `.ion-content-scroll-host` class.
 */
const printIonContentErrorMsg = (el) => {
    return printRequiredElementError(el, ION_CONTENT_ELEMENT_SELECTOR);
};
/**
 * Several components in Ionic need to prevent scrolling
 * during a gesture (card modal, range, item sliding, etc).
 * Use this utility to account for ion-content and custom content hosts.
 */
const disableContentScrollY = (contentEl) => {
    if (isIonContent(contentEl)) {
        const ionContent = contentEl;
        const initialScrollY = ionContent.scrollY;
        ionContent.scrollY = false;
        /**
         * This should be passed into resetContentScrollY
         * so that we can revert ion-content's scrollY to the
         * correct state. For example, if scrollY = false
         * initially, we do not want to enable scrolling
         * when we call resetContentScrollY.
         */
        return initialScrollY;
    }
    else {
        contentEl.style.setProperty('overflow', 'hidden');
        return true;
    }
};
const resetContentScrollY = (contentEl, initialScrollY) => {
    if (isIonContent(contentEl)) {
        contentEl.scrollY = initialScrollY;
    }
    else {
        contentEl.style.removeProperty('overflow');
    }
};

export { ION_CONTENT_CLASS_SELECTOR as I, findClosestIonContent as a, ION_CONTENT_ELEMENT_SELECTOR as b, scrollByPoint as c, disableContentScrollY as d, findIonContent as f, getScrollElement as g, isIonContent as i, printIonContentErrorMsg as p, resetContentScrollY as r, scrollToTop as s };
