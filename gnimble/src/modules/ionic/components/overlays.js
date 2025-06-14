/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { d as doc } from './index9.js';
import { h as focusVisibleElement, c as componentOnReady, a as addEventListener, b as removeEventListener, g as getElementRoot } from './helpers.js';
import { OVERLAY_BACK_BUTTON_PRIORITY, shouldUseCloseWatcher } from './hardware-back-button.js';
import { c as config, a as printIonError, p as printIonWarning } from './index4.js';
import { b as getIonMode, a as isPlatform } from './ionic-global.js';
import { C as CoreDelegate } from './framework-delegate.js';
import { B as BACKDROP_NO_SCROLL } from './gesture-controller.js';

/**
 * This query string selects elements that
 * are eligible to receive focus. We select
 * interactive elements that meet the following
 * criteria:
 * 1. Element does not have a negative tabindex
 * 2. Element does not have `hidden`
 * 3. Element does not have `disabled` for non-Ionic components.
 * 4. Element does not have `disabled` or `disabled="true"` for Ionic components.
 * Note: We need this distinction because `disabled="false"` is
 * valid usage for the disabled property on ion-button.
 */
const focusableQueryString = '[tabindex]:not([tabindex^="-"]):not([hidden]):not([disabled]), input:not([type=hidden]):not([tabindex^="-"]):not([hidden]):not([disabled]), textarea:not([tabindex^="-"]):not([hidden]):not([disabled]), button:not([tabindex^="-"]):not([hidden]):not([disabled]), select:not([tabindex^="-"]):not([hidden]):not([disabled]), ion-checkbox:not([tabindex^="-"]):not([hidden]):not([disabled]), ion-radio:not([tabindex^="-"]):not([hidden]):not([disabled]), .ion-focusable:not([tabindex^="-"]):not([hidden]):not([disabled]), .ion-focusable[disabled="false"]:not([tabindex^="-"]):not([hidden])';
/**
 * Focuses the first descendant in a context
 * that can receive focus. If none exists,
 * a fallback element will be focused.
 * This fallback is typically an ancestor
 * container such as a menu or overlay so focus does not
 * leave the container we are trying to trap focus in.
 *
 * If no fallback is specified then we focus the container itself.
 */
const focusFirstDescendant = (ref, fallbackElement) => {
    const firstInput = ref.querySelector(focusableQueryString);
    focusElementInContext(firstInput, fallbackElement !== null && fallbackElement !== void 0 ? fallbackElement : ref);
};
/**
 * Focuses the last descendant in a context
 * that can receive focus. If none exists,
 * a fallback element will be focused.
 * This fallback is typically an ancestor
 * container such as a menu or overlay so focus does not
 * leave the container we are trying to trap focus in.
 *
 * If no fallback is specified then we focus the container itself.
 */
const focusLastDescendant = (ref, fallbackElement) => {
    const inputs = Array.from(ref.querySelectorAll(focusableQueryString));
    const lastInput = inputs.length > 0 ? inputs[inputs.length - 1] : null;
    focusElementInContext(lastInput, fallbackElement !== null && fallbackElement !== void 0 ? fallbackElement : ref);
};
/**
 * Focuses a particular element in a context. If the element
 * doesn't have anything focusable associated with it then
 * a fallback element will be focused.
 *
 * This fallback is typically an ancestor
 * container such as a menu or overlay so focus does not
 * leave the container we are trying to trap focus in.
 * This should be used instead of the focus() method
 * on most elements because the focusable element
 * may not be the host element.
 *
 * For example, if an ion-button should be focused
 * then we should actually focus the native <button>
 * element inside of ion-button's shadow root, not
 * the host element itself.
 */
const focusElementInContext = (hostToFocus, fallbackElement) => {
    let elementToFocus = hostToFocus;
    const shadowRoot = hostToFocus === null || hostToFocus === void 0 ? void 0 : hostToFocus.shadowRoot;
    if (shadowRoot) {
        // If there are no inner focusable elements, just focus the host element.
        elementToFocus = shadowRoot.querySelector(focusableQueryString) || hostToFocus;
    }
    if (elementToFocus) {
        const radioGroup = elementToFocus.closest('ion-radio-group');
        if (radioGroup) {
            radioGroup.setFocus();
        }
        else {
            focusVisibleElement(elementToFocus);
        }
    }
    else {
        // Focus fallback element instead of letting focus escape
        fallbackElement.focus();
    }
};

let lastOverlayIndex = 0;
let lastId = 0;
const activeAnimations = new WeakMap();
const createController = (tagName) => {
    return {
        create(options) {
            return createOverlay(tagName, options);
        },
        dismiss(data, role, id) {
            return dismissOverlay(document, data, role, tagName, id);
        },
        async getTop() {
            return getPresentedOverlay(document, tagName);
        },
    };
};
const alertController = /*@__PURE__*/ createController('ion-alert');
const actionSheetController = /*@__PURE__*/ createController('ion-action-sheet');
const loadingController = /*@__PURE__*/ createController('ion-loading');
const modalController = /*@__PURE__*/ createController('ion-modal');
/**
 * @deprecated Use the inline ion-picker component instead.
 */
const pickerController = /*@__PURE__*/ createController('ion-picker-legacy');
const popoverController = /*@__PURE__*/ createController('ion-popover');
const toastController = /*@__PURE__*/ createController('ion-toast');
/**
 * Prepares the overlay element to be presented.
 */
const prepareOverlay = (el) => {
    if (typeof document !== 'undefined') {
        /**
         * Adds a single instance of event listeners for application behaviors:
         *
         * - Escape Key behavior to dismiss an overlay
         * - Trapping focus within an overlay
         * - Back button behavior to dismiss an overlay
         *
         * This only occurs when the first overlay is created.
         */
        connectListeners(document);
    }
    const overlayIndex = lastOverlayIndex++;
    /**
     * overlayIndex is used in the overlay components to set a zIndex.
     * This ensures that the most recently presented overlay will be
     * on top.
     */
    el.overlayIndex = overlayIndex;
};
/**
 * Assigns an incrementing id to an overlay element, that does not
 * already have an id assigned to it.
 *
 * Used to track unique instances of an overlay element.
 */
const setOverlayId = (el) => {
    if (!el.hasAttribute('id')) {
        el.id = `ion-overlay-${++lastId}`;
    }
    return el.id;
};
const createOverlay = (tagName, opts) => {
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (typeof window !== 'undefined' && typeof window.customElements !== 'undefined') {
        return window.customElements.whenDefined(tagName).then(() => {
            const element = document.createElement(tagName);
            element.classList.add('overlay-hidden');
            /**
             * Convert the passed in overlay options into props
             * that get passed down into the new overlay.
             */
            Object.assign(element, Object.assign(Object.assign({}, opts), { hasController: true }));
            // append the overlay element to the document body
            getAppRoot(document).appendChild(element);
            return new Promise((resolve) => componentOnReady(element, resolve));
        });
    }
    return Promise.resolve();
};
const isOverlayHidden = (overlay) => overlay.classList.contains('overlay-hidden');
/**
 * Focuses a particular element in an overlay. If the element
 * doesn't have anything focusable associated with it then
 * the overlay itself will be focused.
 * This should be used instead of the focus() method
 * on most elements because the focusable element
 * may not be the host element.
 *
 * For example, if an ion-button should be focused
 * then we should actually focus the native <button>
 * element inside of ion-button's shadow root, not
 * the host element itself.
 */
const focusElementInOverlay = (hostToFocus, overlay) => {
    let elementToFocus = hostToFocus;
    const shadowRoot = hostToFocus === null || hostToFocus === void 0 ? void 0 : hostToFocus.shadowRoot;
    if (shadowRoot) {
        // If there are no inner focusable elements, just focus the host element.
        elementToFocus = shadowRoot.querySelector(focusableQueryString) || hostToFocus;
    }
    if (elementToFocus) {
        focusVisibleElement(elementToFocus);
    }
    else {
        // Focus overlay instead of letting focus escape
        overlay.focus();
    }
};
/**
 * Traps keyboard focus inside of overlay components.
 * Based on https://w3c.github.io/aria-practices/examples/dialog-modal/alertdialog.html
 * This includes the following components: Action Sheet, Alert, Loading, Modal,
 * Picker, and Popover.
 * Should NOT include: Toast
 */
const trapKeyboardFocus = (ev, doc) => {
    const lastOverlay = getPresentedOverlay(doc, 'ion-alert,ion-action-sheet,ion-loading,ion-modal,ion-picker-legacy,ion-popover');
    const target = ev.target;
    /**
     * If no active overlay, ignore this event.
     *
     * If this component uses the shadow dom,
     * this global listener is pointless
     * since it will not catch the focus
     * traps as they are inside the shadow root.
     * We need to add a listener to the shadow root
     * itself to ensure the focus trap works.
     */
    if (!lastOverlay || !target) {
        return;
    }
    /**
     * If the ion-disable-focus-trap class
     * is present on an overlay, then this component
     * instance has opted out of focus trapping.
     * An example of this is when the sheet modal
     * has a backdrop that is disabled. The content
     * behind the sheet should be focusable until
     * the backdrop is enabled.
     */
    if (lastOverlay.classList.contains(FOCUS_TRAP_DISABLE_CLASS)) {
        return;
    }
    const trapScopedFocus = () => {
        /**
         * If we are focusing the overlay, clear
         * the last focused element so that hitting
         * tab activates the first focusable element
         * in the overlay wrapper.
         */
        if (lastOverlay === target) {
            lastOverlay.lastFocus = undefined;
            /**
             * Toasts can be presented from an overlay.
             * However, focus should still be returned to
             * the overlay when clicking a toast. Normally,
             * focus would be returned to the last focusable
             * descendant in the overlay which may not always be
             * the button that the toast was presented from. In this case,
             * the focus may be returned to an unexpected element.
             * To account for this, we make sure to return focus to the
             * last focused element in the overlay if focus is
             * moved to the toast.
             */
        }
        else if (target.tagName === 'ION-TOAST') {
            focusElementInOverlay(lastOverlay.lastFocus, lastOverlay);
            /**
             * Otherwise, we must be focusing an element
             * inside of the overlay. The two possible options
             * here are an input/button/etc or the ion-focus-trap
             * element. The focus trap element is used to prevent
             * the keyboard focus from leaving the overlay when
             * using Tab or screen assistants.
             */
        }
        else {
            /**
             * We do not want to focus the traps, so get the overlay
             * wrapper element as the traps live outside of the wrapper.
             */
            const overlayRoot = getElementRoot(lastOverlay);
            if (!overlayRoot.contains(target)) {
                return;
            }
            const overlayWrapper = overlayRoot.querySelector('.ion-overlay-wrapper');
            if (!overlayWrapper) {
                return;
            }
            /**
             * If the target is inside the wrapper, let the browser
             * focus as normal and keep a log of the last focused element.
             * Additionally, if the backdrop was tapped we should not
             * move focus back inside the wrapper as that could cause
             * an interactive elements focus state to activate.
             */
            if (overlayWrapper.contains(target) || target === overlayRoot.querySelector('ion-backdrop')) {
                lastOverlay.lastFocus = target;
            }
            else {
                /**
                 * Otherwise, we must have focused one of the focus traps.
                 * We need to wrap the focus to either the first element
                 * or the last element.
                 */
                /**
                 * Once we call `focusFirstDescendant` and focus the first
                 * descendant, another focus event will fire which will
                 * cause `lastOverlay.lastFocus` to be updated before
                 * we can run the code after that. We will cache the value
                 * here to avoid that.
                 */
                const lastFocus = lastOverlay.lastFocus;
                // Focus the first element in the overlay wrapper
                focusFirstDescendant(overlayWrapper, lastOverlay);
                /**
                 * If the cached last focused element is the
                 * same as the active element, then we need
                 * to wrap focus to the last descendant. This happens
                 * when the first descendant is focused, and the user
                 * presses Shift + Tab. The previous line will focus
                 * the same descendant again (the first one), causing
                 * last focus to equal the active element.
                 */
                if (lastFocus === doc.activeElement) {
                    focusLastDescendant(overlayWrapper, lastOverlay);
                }
                lastOverlay.lastFocus = doc.activeElement;
            }
        }
    };
    const trapShadowFocus = () => {
        /**
         * If the target is inside the wrapper, let the browser
         * focus as normal and keep a log of the last focused element.
         */
        if (lastOverlay.contains(target)) {
            lastOverlay.lastFocus = target;
            /**
             * Toasts can be presented from an overlay.
             * However, focus should still be returned to
             * the overlay when clicking a toast. Normally,
             * focus would be returned to the last focusable
             * descendant in the overlay which may not always be
             * the button that the toast was presented from. In this case,
             * the focus may be returned to an unexpected element.
             * To account for this, we make sure to return focus to the
             * last focused element in the overlay if focus is
             * moved to the toast.
             */
        }
        else if (target.tagName === 'ION-TOAST') {
            focusElementInOverlay(lastOverlay.lastFocus, lastOverlay);
        }
        else {
            /**
             * Otherwise, we are about to have focus
             * go out of the overlay. We need to wrap
             * the focus to either the first element
             * or the last element.
             */
            /**
             * Once we call `focusFirstDescendant` and focus the first
             * descendant, another focus event will fire which will
             * cause `lastOverlay.lastFocus` to be updated before
             * we can run the code after that. We will cache the value
             * here to avoid that.
             */
            const lastFocus = lastOverlay.lastFocus;
            // Focus the first element in the overlay wrapper
            focusFirstDescendant(lastOverlay);
            /**
             * If the cached last focused element is the
             * same as the active element, then we need
             * to wrap focus to the last descendant. This happens
             * when the first descendant is focused, and the user
             * presses Shift + Tab. The previous line will focus
             * the same descendant again (the first one), causing
             * last focus to equal the active element.
             */
            if (lastFocus === doc.activeElement) {
                focusLastDescendant(lastOverlay);
            }
            lastOverlay.lastFocus = doc.activeElement;
        }
    };
    if (lastOverlay.shadowRoot) {
        trapShadowFocus();
    }
    else {
        trapScopedFocus();
    }
};
const connectListeners = (doc) => {
    if (lastOverlayIndex === 0) {
        lastOverlayIndex = 1;
        doc.addEventListener('focus', (ev) => {
            trapKeyboardFocus(ev, doc);
        }, true);
        // handle back-button click
        doc.addEventListener('ionBackButton', (ev) => {
            const lastOverlay = getPresentedOverlay(doc);
            if (lastOverlay === null || lastOverlay === void 0 ? void 0 : lastOverlay.backdropDismiss) {
                ev.detail.register(OVERLAY_BACK_BUTTON_PRIORITY, () => {
                    /**
                     * Do not return this promise otherwise
                     * the hardware back button utility will
                     * be blocked until the overlay dismisses.
                     * This is important for a modal with canDismiss.
                     * If the application presents a confirmation alert
                     * in the "canDismiss" callback, then it will be impossible
                     * to use the hardware back button to dismiss the alert
                     * dialog because the hardware back button utility
                     * is blocked on waiting for the modal to dismiss.
                     */
                    lastOverlay.dismiss(undefined, BACKDROP);
                });
            }
        });
        /**
         * Handle ESC to close overlay.
         * CloseWatcher also handles pressing the Esc
         * key, so if a browser supports CloseWatcher then
         * this behavior will be handled via the ionBackButton
         * event.
         */
        if (!shouldUseCloseWatcher()) {
            doc.addEventListener('keydown', (ev) => {
                if (ev.key === 'Escape') {
                    const lastOverlay = getPresentedOverlay(doc);
                    if (lastOverlay === null || lastOverlay === void 0 ? void 0 : lastOverlay.backdropDismiss) {
                        lastOverlay.dismiss(undefined, BACKDROP);
                    }
                }
            });
        }
    }
};
const dismissOverlay = (doc, data, role, overlayTag, id) => {
    const overlay = getPresentedOverlay(doc, overlayTag, id);
    if (!overlay) {
        return Promise.reject('overlay does not exist');
    }
    return overlay.dismiss(data, role);
};
/**
 * Returns a list of all overlays in the DOM even if they are not presented.
 */
const getOverlays = (doc, selector) => {
    if (selector === undefined) {
        selector = 'ion-alert,ion-action-sheet,ion-loading,ion-modal,ion-picker-legacy,ion-popover,ion-toast';
    }
    return Array.from(doc.querySelectorAll(selector)).filter((c) => c.overlayIndex > 0);
};
/**
 * Returns a list of all presented overlays.
 * Inline overlays can exist in the DOM but not be presented,
 * so there are times when we want to exclude those.
 * @param doc The document to find the element within.
 * @param overlayTag The selector for the overlay, defaults to Ionic overlay components.
 */
const getPresentedOverlays = (doc, overlayTag) => {
    return getOverlays(doc, overlayTag).filter((o) => !isOverlayHidden(o));
};
/**
 * Returns a presented overlay element.
 * @param doc The document to find the element within.
 * @param overlayTag The selector for the overlay, defaults to Ionic overlay components.
 * @param id The unique identifier for the overlay instance.
 * @returns The overlay element or `undefined` if no overlay element is found.
 */
const getPresentedOverlay = (doc, overlayTag, id) => {
    const overlays = getPresentedOverlays(doc, overlayTag);
    return id === undefined ? overlays[overlays.length - 1] : overlays.find((o) => o.id === id);
};
/**
 * When an overlay is presented, the main
 * focus is the overlay not the page content.
 * We need to remove the page content from the
 * accessibility tree otherwise when
 * users use "read screen from top" gestures with
 * TalkBack and VoiceOver, the screen reader will begin
 * to read the content underneath the overlay.
 *
 * We need a container where all page components
 * exist that is separate from where the overlays
 * are added in the DOM. For most apps, this element
 * is the top most ion-router-outlet. In the event
 * that devs are not using a router,
 * they will need to add the "ion-view-container-root"
 * id to the element that contains all of their views.
 *
 * TODO: If Framework supports having multiple top
 * level router outlets we would need to update this.
 * Example: One outlet for side menu and one outlet
 * for main content.
 */
const setRootAriaHidden = (hidden = false) => {
    const root = getAppRoot(document);
    const viewContainer = root.querySelector('ion-router-outlet, ion-nav, #ion-view-container-root');
    if (!viewContainer) {
        return;
    }
    if (hidden) {
        viewContainer.setAttribute('aria-hidden', 'true');
    }
    else {
        viewContainer.removeAttribute('aria-hidden');
    }
};
const present = async (overlay, name, iosEnterAnimation, mdEnterAnimation, opts) => {
    var _a, _b;
    if (overlay.presented) {
        return;
    }
    /**
     * Due to accessibility guidelines, toasts do not have
     * focus traps.
     *
     * All other overlays should have focus traps to prevent
     * the keyboard focus from leaving the overlay.
     */
    if (overlay.el.tagName !== 'ION-TOAST') {
        setRootAriaHidden(true);
        document.body.classList.add(BACKDROP_NO_SCROLL);
    }
    hideUnderlyingOverlaysFromScreenReaders(overlay.el);
    hideAnimatingOverlayFromScreenReaders(overlay.el);
    overlay.presented = true;
    overlay.willPresent.emit();
    (_a = overlay.willPresentShorthand) === null || _a === void 0 ? void 0 : _a.emit();
    const mode = getIonMode(overlay);
    // get the user's animation fn if one was provided
    const animationBuilder = overlay.enterAnimation
        ? overlay.enterAnimation
        : config.get(name, mode === 'ios' ? iosEnterAnimation : mdEnterAnimation);
    const completed = await overlayAnimation(overlay, animationBuilder, overlay.el, opts);
    if (completed) {
        overlay.didPresent.emit();
        (_b = overlay.didPresentShorthand) === null || _b === void 0 ? void 0 : _b.emit();
    }
    /**
     * When an overlay that steals focus
     * is dismissed, focus should be returned
     * to the element that was focused
     * prior to the overlay opening. Toast
     * does not steal focus and is excluded
     * from returning focus as a result.
     */
    if (overlay.el.tagName !== 'ION-TOAST') {
        restoreElementFocus(overlay.el);
    }
    /**
     * If the focused element is already
     * inside the overlay component then
     * focus should not be moved from that
     * to the overlay container.
     */
    if (overlay.keyboardClose && (document.activeElement === null || !overlay.el.contains(document.activeElement))) {
        overlay.el.focus();
    }
    /**
     * If this overlay was previously dismissed without being
     * the topmost one (such as by manually calling dismiss()),
     * it would still have aria-hidden on being presented again.
     * Removing it here ensures the overlay is visible to screen
     * readers.
     *
     * If this overlay was being presented, then it was hidden
     * from screen readers during the animation. Now that the
     * animation is complete, we can reveal the overlay to
     * screen readers.
     */
    overlay.el.removeAttribute('aria-hidden');
};
/**
 * When an overlay component is dismissed,
 * focus should be returned to the element
 * that presented the overlay. Otherwise
 * focus will be set on the body which
 * means that people using screen readers
 * or tabbing will need to re-navigate
 * to where they were before they
 * opened the overlay.
 */
const restoreElementFocus = async (overlayEl) => {
    let previousElement = document.activeElement;
    if (!previousElement) {
        return;
    }
    const shadowRoot = previousElement === null || previousElement === void 0 ? void 0 : previousElement.shadowRoot;
    if (shadowRoot) {
        // If there are no inner focusable elements, just focus the host element.
        previousElement = shadowRoot.querySelector(focusableQueryString) || previousElement;
    }
    await overlayEl.onDidDismiss();
    /**
     * After onDidDismiss, the overlay loses focus
     * because it is removed from the document
     *
     * > An element will also lose focus [...]
     * > if the element is removed from the document)
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event
     *
     * Additionally, `document.activeElement` returns:
     *
     * > The Element which currently has focus,
     * > `<body>` or null if there is
     * > no focused element.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement#value
     *
     * However, if the user has already focused
     * an element sometime between onWillDismiss
     * and onDidDismiss (for example, focusing a
     * text box after tapping a button in an
     * action sheet) then don't restore focus to
     * previous element
     */
    if (document.activeElement === null || document.activeElement === document.body) {
        previousElement.focus();
    }
};
const dismiss = async (overlay, data, role, name, iosLeaveAnimation, mdLeaveAnimation, opts) => {
    var _a, _b;
    if (!overlay.presented) {
        return false;
    }
    const presentedOverlays = doc !== undefined ? getPresentedOverlays(doc) : [];
    /**
     * For accessibility, toasts lack focus traps and don't receive
     * `aria-hidden` on the root element when presented.
     *
     * All other overlays use focus traps to keep keyboard focus
     * within the overlay, setting `aria-hidden` on the root element
     * to enhance accessibility.
     *
     * Therefore, we must remove `aria-hidden` from the root element
     * when the last non-toast overlay is dismissed.
     */
    const overlaysNotToast = presentedOverlays.filter((o) => o.tagName !== 'ION-TOAST');
    const lastOverlayNotToast = overlaysNotToast.length === 1 && overlaysNotToast[0].id === overlay.el.id;
    /**
     * If this is the last visible overlay that is not a toast
     * then we want to re-add the root to the accessibility tree.
     */
    if (lastOverlayNotToast) {
        setRootAriaHidden(false);
        document.body.classList.remove(BACKDROP_NO_SCROLL);
    }
    overlay.presented = false;
    try {
        /**
         * There is no need to show the overlay to screen readers during
         * the dismiss animation. This is because the overlay will be removed
         * from the DOM after the animation is complete.
         */
        hideAnimatingOverlayFromScreenReaders(overlay.el);
        // Overlay contents should not be clickable during dismiss
        overlay.el.style.setProperty('pointer-events', 'none');
        overlay.willDismiss.emit({ data, role });
        (_a = overlay.willDismissShorthand) === null || _a === void 0 ? void 0 : _a.emit({ data, role });
        const mode = getIonMode(overlay);
        const animationBuilder = overlay.leaveAnimation
            ? overlay.leaveAnimation
            : config.get(name, mode === 'ios' ? iosLeaveAnimation : mdLeaveAnimation);
        // If dismissed via gesture, no need to play leaving animation again
        if (role !== GESTURE) {
            await overlayAnimation(overlay, animationBuilder, overlay.el, opts);
        }
        overlay.didDismiss.emit({ data, role });
        (_b = overlay.didDismissShorthand) === null || _b === void 0 ? void 0 : _b.emit({ data, role });
        // Get a reference to all animations currently assigned to this overlay
        // Then tear them down to return the overlay to its initial visual state
        const animations = activeAnimations.get(overlay) || [];
        animations.forEach((ani) => ani.destroy());
        activeAnimations.delete(overlay);
        /**
         * Make overlay hidden again in case it is being reused.
         * We can safely remove pointer-events: none as
         * overlay-hidden will set display: none.
         */
        overlay.el.classList.add('overlay-hidden');
        overlay.el.style.removeProperty('pointer-events');
        /**
         * Clear any focus trapping references
         * when the overlay is dismissed.
         */
        if (overlay.el.lastFocus !== undefined) {
            overlay.el.lastFocus = undefined;
        }
    }
    catch (err) {
        printIonError(`[${overlay.el.tagName.toLowerCase()}] - `, err);
    }
    overlay.el.remove();
    revealOverlaysToScreenReaders();
    return true;
};
const getAppRoot = (doc) => {
    return doc.querySelector('ion-app') || doc.body;
};
const overlayAnimation = async (overlay, animationBuilder, baseEl, opts) => {
    // Make overlay visible in case it's hidden
    baseEl.classList.remove('overlay-hidden');
    const aniRoot = overlay.el;
    const animation = animationBuilder(aniRoot, opts);
    if (!overlay.animated || !config.getBoolean('animated', true)) {
        animation.duration(0);
    }
    if (overlay.keyboardClose) {
        animation.beforeAddWrite(() => {
            const activeElement = baseEl.ownerDocument.activeElement;
            if (activeElement === null || activeElement === void 0 ? void 0 : activeElement.matches('input,ion-input, ion-textarea')) {
                activeElement.blur();
            }
        });
    }
    const activeAni = activeAnimations.get(overlay) || [];
    activeAnimations.set(overlay, [...activeAni, animation]);
    await animation.play();
    return true;
};
const eventMethod = (element, eventName) => {
    let resolve;
    const promise = new Promise((r) => (resolve = r));
    onceEvent(element, eventName, (event) => {
        resolve(event.detail);
    });
    return promise;
};
const onceEvent = (element, eventName, callback) => {
    const handler = (ev) => {
        removeEventListener(element, eventName, handler);
        callback(ev);
    };
    addEventListener(element, eventName, handler);
};
const isCancel = (role) => {
    return role === 'cancel' || role === BACKDROP;
};
const defaultGate = (h) => h();
/**
 * Calls a developer provided method while avoiding
 * Angular Zones. Since the handler is provided by
 * the developer, we should throw any errors
 * received so that developer-provided bug
 * tracking software can log it.
 */
const safeCall = (handler, arg) => {
    if (typeof handler === 'function') {
        const jmp = config.get('_zoneGate', defaultGate);
        return jmp(() => {
            try {
                return handler(arg);
            }
            catch (e) {
                throw e;
            }
        });
    }
    return undefined;
};
const BACKDROP = 'backdrop';
const GESTURE = 'gesture';
const OVERLAY_GESTURE_PRIORITY = 39;
/**
 * Creates a delegate controller.
 *
 * Requires that the component has the following properties:
 * - `el: HTMLElement`
 * - `hasController: boolean`
 * - `delegate?: FrameworkDelegate`
 *
 * @param ref The component class instance.
 */
const createDelegateController = (ref) => {
    let inline = false;
    let workingDelegate;
    const coreDelegate = CoreDelegate();
    /**
     * Determines whether or not an overlay is being used
     * inline or via a controller/JS and returns the correct delegate.
     * By default, subsequent calls to getDelegate will use
     * a cached version of the delegate.
     * This is useful for calling dismiss after present,
     * so that the correct delegate is given.
     * @param force `true` to force the non-cached version of the delegate.
     * @returns The delegate to use and whether or not the overlay is inline.
     */
    const getDelegate = (force = false) => {
        if (workingDelegate && !force) {
            return {
                delegate: workingDelegate,
                inline,
            };
        }
        const { el, hasController, delegate } = ref;
        /**
         * If using overlay inline
         * we potentially need to use the coreDelegate
         * so that this works in vanilla JS apps.
         * If a developer has presented this component
         * via a controller, then we can assume
         * the component is already in the
         * correct place.
         */
        const parentEl = el.parentNode;
        inline = parentEl !== null && !hasController;
        workingDelegate = inline ? delegate || coreDelegate : delegate;
        return { inline, delegate: workingDelegate };
    };
    /**
     * Attaches a component in the DOM. Teleports the component
     * to the root of the app.
     * @param component The component to optionally construct and append to the element.
     */
    const attachViewToDom = async (component) => {
        const { delegate } = getDelegate(true);
        if (delegate) {
            return await delegate.attachViewToDom(ref.el, component);
        }
        const { hasController } = ref;
        if (hasController && component !== undefined) {
            throw new Error('framework delegate is missing');
        }
        return null;
    };
    /**
     * Moves a component back to its original location in the DOM.
     */
    const removeViewFromDom = () => {
        const { delegate } = getDelegate();
        if (delegate && ref.el !== undefined) {
            delegate.removeViewFromDom(ref.el.parentElement, ref.el);
        }
    };
    return {
        attachViewToDom,
        removeViewFromDom,
    };
};
/**
 * Constructs a trigger interaction for an overlay.
 * Presents an overlay when the trigger is clicked.
 *
 * Usage:
 * ```ts
 * triggerController = createTriggerController();
 * triggerController.addClickListener(el, trigger);
 * ```
 */
const createTriggerController = () => {
    let destroyTriggerInteraction;
    /**
     * Removes the click listener from the trigger element.
     */
    const removeClickListener = () => {
        if (destroyTriggerInteraction) {
            destroyTriggerInteraction();
            destroyTriggerInteraction = undefined;
        }
    };
    /**
     * Adds a click listener to the trigger element.
     * Presents the overlay when the trigger is clicked.
     * @param el The overlay element.
     * @param trigger The ID of the element to add a click listener to.
     */
    const addClickListener = (el, trigger) => {
        removeClickListener();
        const triggerEl = trigger !== undefined ? document.getElementById(trigger) : null;
        if (!triggerEl) {
            printIonWarning(`[${el.tagName.toLowerCase()}] - A trigger element with the ID "${trigger}" was not found in the DOM. The trigger element must be in the DOM when the "trigger" property is set on an overlay component.`, el);
            return;
        }
        const configureTriggerInteraction = (targetEl, overlayEl) => {
            const openOverlay = () => {
                overlayEl.present();
            };
            targetEl.addEventListener('click', openOverlay);
            return () => {
                targetEl.removeEventListener('click', openOverlay);
            };
        };
        destroyTriggerInteraction = configureTriggerInteraction(triggerEl, el);
    };
    return {
        addClickListener,
        removeClickListener,
    };
};
/**
 * The overlay that is being animated also needs to hide from screen
 * readers during its animation. This ensures that assistive technologies
 * like TalkBack do not announce or interact with the content until the
 * animation is complete, avoiding confusion for users.
 *
 * When the overlay is presented on an Android device, TalkBack's focus rings
 * may appear in the wrong position due to the transition (specifically
 * `transform` styles). This occurs because the focus rings are initially
 * displayed at the starting position of the elements before the transition
 * begins. This workaround ensures the focus rings do not appear in the
 * incorrect location.
 *
 * If this solution is applied to iOS devices, then it leads to a bug where
 * the overlays cannot be accessed by screen readers. This is due to
 * VoiceOver not being able to update the accessibility tree when the
 * `aria-hidden` is removed.
 *
 * @param overlay - The overlay that is being animated.
 */
const hideAnimatingOverlayFromScreenReaders = (overlay) => {
    if (doc === undefined)
        return;
    if (isPlatform('android')) {
        /**
         * Once the animation is complete, this attribute will be removed.
         * This is done at the end of the `present` method.
         */
        overlay.setAttribute('aria-hidden', 'true');
    }
};
/**
 * Ensure that underlying overlays have aria-hidden if necessary so that screen readers
 * cannot move focus to these elements. Note that we cannot rely on focus/focusin/focusout
 * events here because those events do not fire when the screen readers moves to a non-focusable
 * element such as text.
 * Without this logic screen readers would be able to move focus outside of the top focus-trapped overlay.
 *
 * @param newTopMostOverlay - The overlay that is being presented. Since the overlay has not been
 * fully presented yet at the time this function is called it will not be included in the getPresentedOverlays result.
 */
const hideUnderlyingOverlaysFromScreenReaders = (newTopMostOverlay) => {
    var _a;
    if (doc === undefined)
        return;
    const overlays = getPresentedOverlays(doc);
    for (let i = overlays.length - 1; i >= 0; i--) {
        const presentedOverlay = overlays[i];
        const nextPresentedOverlay = (_a = overlays[i + 1]) !== null && _a !== void 0 ? _a : newTopMostOverlay;
        /**
         * If next overlay has aria-hidden then all remaining overlays will have it too.
         * Or, if the next overlay is a Toast that does not have aria-hidden then current overlay
         * should not have aria-hidden either so focus can remain in the current overlay.
         */
        if (nextPresentedOverlay.hasAttribute('aria-hidden') || nextPresentedOverlay.tagName !== 'ION-TOAST') {
            presentedOverlay.setAttribute('aria-hidden', 'true');
        }
    }
};
/**
 * When dismissing an overlay we need to reveal the new top-most overlay to screen readers.
 * If the top-most overlay is a Toast we potentially need to reveal more overlays since
 * focus is never automatically moved to the Toast.
 */
const revealOverlaysToScreenReaders = () => {
    if (doc === undefined)
        return;
    const overlays = getPresentedOverlays(doc);
    for (let i = overlays.length - 1; i >= 0; i--) {
        const currentOverlay = overlays[i];
        /**
         * If the current we are looking at is a Toast then we can remove aria-hidden.
         * However, we potentially need to keep looking at the overlay stack because there
         * could be more Toasts underneath. Additionally, we need to unhide the closest non-Toast
         * overlay too so focus can move there since focus is never automatically moved to the Toast.
         */
        currentOverlay.removeAttribute('aria-hidden');
        /**
         * If we found a non-Toast element then we can just remove aria-hidden and stop searching entirely
         * since this overlay should always receive focus. As a result, all underlying overlays should still
         * be hidden from screen readers.
         */
        if (currentOverlay.tagName !== 'ION-TOAST') {
            break;
        }
    }
};
const FOCUS_TRAP_DISABLE_CLASS = 'ion-disable-focus-trap';

export { BACKDROP as B, FOCUS_TRAP_DISABLE_CLASS as F, GESTURE as G, OVERLAY_GESTURE_PRIORITY as O, alertController as a, actionSheetController as b, popoverController as c, createDelegateController as d, createTriggerController as e, present as f, dismiss as g, eventMethod as h, isCancel as i, prepareOverlay as j, setOverlayId as k, loadingController as l, modalController as m, focusFirstDescendant as n, getPresentedOverlay as o, pickerController as p, focusLastDescendant as q, safeCall as s, toastController as t };
