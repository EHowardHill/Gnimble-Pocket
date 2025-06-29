/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { w as win } from './index9.js';
import { r as raf } from './helpers.js';
import { a as printIonError } from './index4.js';

/**
 * Used to update a scoped component that uses emulated slots. This fires when
 * content is passed into the slot or when the content inside of a slot changes.
 * This is not needed for components using native slots in the Shadow DOM.
 * @internal
 * @param el The host element to observe
 * @param slotName mutationCallback will fire when nodes on these slot(s) change
 * @param mutationCallback The callback to fire whenever the slotted content changes
 */
const createSlotMutationController = (el, slotName, mutationCallback) => {
    let hostMutationObserver;
    let slottedContentMutationObserver;
    if (win !== undefined && 'MutationObserver' in win) {
        const slots = Array.isArray(slotName) ? slotName : [slotName];
        hostMutationObserver = new MutationObserver((entries) => {
            for (const entry of entries) {
                for (const node of entry.addedNodes) {
                    /**
                     * Check to see if the added node
                     *  is our slotted content.
                     */
                    if (node.nodeType === Node.ELEMENT_NODE && slots.includes(node.slot)) {
                        /**
                         * If so, we want to watch the slotted
                         * content itself for changes. This lets us
                         * detect when content inside of the slot changes.
                         */
                        mutationCallback();
                        /**
                         * Adding the listener in an raf
                         * waits until Stencil moves the slotted element
                         * into the correct place in the event that
                         * slotted content is being added.
                         */
                        raf(() => watchForSlotChange(node));
                        return;
                    }
                }
            }
        });
        hostMutationObserver.observe(el, {
            childList: true,
            /**
             * This fixes an issue with the `ion-input` and
             * `ion-textarea` not re-rendering in some cases
             * when using the label slot functionality.
             *
             * HTML element patches in Stencil that are enabled
             * by the `experimentalSlotFixes` flag in Stencil v4
             * result in DOM manipulations that won't trigger
             * the current mutation observer configuration and
             * callback.
             */
            subtree: true,
        });
    }
    /**
     * Listen for changes inside of the slotted content.
     * We can listen for subtree changes here to be
     * informed of text within the slotted content
     * changing. Doing this on the host is possible
     * but it is much more expensive to do because
     * it also listens for changes to the internals
     * of the component.
     */
    const watchForSlotChange = (slottedEl) => {
        var _a;
        if (slottedContentMutationObserver) {
            slottedContentMutationObserver.disconnect();
            slottedContentMutationObserver = undefined;
        }
        slottedContentMutationObserver = new MutationObserver((entries) => {
            mutationCallback();
            for (const entry of entries) {
                for (const node of entry.removedNodes) {
                    /**
                     * If the element was removed then we
                     * need to destroy the MutationObserver
                     * so the element can be garbage collected.
                     */
                    if (node.nodeType === Node.ELEMENT_NODE && node.slot === slotName) {
                        destroySlottedContentObserver();
                    }
                }
            }
        });
        /**
         * Listen for changes inside of the element
         * as well as anything deep in the tree.
         * We listen on the parentElement so that we can
         * detect when slotted element itself is removed.
         */
        slottedContentMutationObserver.observe((_a = slottedEl.parentElement) !== null && _a !== void 0 ? _a : slottedEl, { subtree: true, childList: true });
    };
    const destroy = () => {
        if (hostMutationObserver) {
            hostMutationObserver.disconnect();
            hostMutationObserver = undefined;
        }
        destroySlottedContentObserver();
    };
    const destroySlottedContentObserver = () => {
        if (slottedContentMutationObserver) {
            slottedContentMutationObserver.disconnect();
            slottedContentMutationObserver = undefined;
        }
    };
    return {
        destroy,
    };
};

const getCounterText = (value, maxLength, counterFormatter) => {
    const valueLength = value == null ? 0 : value.toString().length;
    const defaultCounterText = defaultCounterFormatter(valueLength, maxLength);
    /**
     * If developers did not pass a custom formatter,
     * use the default one.
     */
    if (counterFormatter === undefined) {
        return defaultCounterText;
    }
    /**
     * Otherwise, try to use the custom formatter
     * and fallback to the default formatter if
     * there was an error.
     */
    try {
        return counterFormatter(valueLength, maxLength);
    }
    catch (e) {
        printIonError('[ion-input] - Exception in provided `counterFormatter`:', e);
        return defaultCounterText;
    }
};
const defaultCounterFormatter = (length, maxlength) => {
    return `${length} / ${maxlength}`;
};

export { createSlotMutationController as c, getCounterText as g };
