/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { w as win, d as doc } from './index9.js';
import { g as getScrollElement, c as scrollByPoint, a as findClosestIonContent } from './index8.js';
import { a as addEventListener, b as removeEventListener, r as raf, c as componentOnReady } from './helpers.js';
import { a as KeyboardResize, K as Keyboard } from './keyboard2.js';

const cloneMap = new WeakMap();
const relocateInput = (componentEl, inputEl, shouldRelocate, inputRelativeY = 0, disabledClonedInput = false) => {
    if (cloneMap.has(componentEl) === shouldRelocate) {
        return;
    }
    if (shouldRelocate) {
        addClone(componentEl, inputEl, inputRelativeY, disabledClonedInput);
    }
    else {
        removeClone(componentEl, inputEl);
    }
};
const isFocused = (input) => {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Node/getRootNode
     * Calling getRootNode on an element in standard web page will return HTMLDocument.
     * Calling getRootNode on an element inside of the Shadow DOM will return the associated ShadowRoot.
     * Calling getRootNode on an element that is not attached to a document/shadow tree will return
     * the root of the DOM tree it belongs to.
     * isFocused is used for the hide-caret utility which only considers input/textarea elements
     * that are present in the DOM, so we don't set types for that final case since it does not apply.
     */
    return input === input.getRootNode().activeElement;
};
const addClone = (componentEl, inputEl, inputRelativeY, disabledClonedInput = false) => {
    // this allows for the actual input to receive the focus from
    // the user's touch event, but before it receives focus, it
    // moves the actual input to a location that will not screw
    // up the app's layout, and does not allow the native browser
    // to attempt to scroll the input into place (messing up headers/footers)
    // the cloned input fills the area of where native input should be
    // while the native input fakes out the browser by relocating itself
    // before it receives the actual focus event
    // We hide the focused input (with the visible caret) invisible by making it scale(0),
    const parentEl = inputEl.parentNode;
    // DOM WRITES
    const clonedEl = inputEl.cloneNode(false);
    clonedEl.classList.add('cloned-input');
    clonedEl.tabIndex = -1;
    /**
     * Making the cloned input disabled prevents
     * Chrome for Android from still scrolling
     * the entire page since this cloned input
     * will briefly be hidden by the keyboard
     * even though it is not focused.
     *
     * This is not needed on iOS. While this
     * does not cause functional issues on iOS,
     * the input still appears slightly dimmed even
     * if we set opacity: 1.
     */
    if (disabledClonedInput) {
        clonedEl.disabled = true;
    }
    parentEl.appendChild(clonedEl);
    cloneMap.set(componentEl, clonedEl);
    const doc = componentEl.ownerDocument;
    const tx = doc.dir === 'rtl' ? 9999 : -9999;
    componentEl.style.pointerEvents = 'none';
    inputEl.style.transform = `translate3d(${tx}px,${inputRelativeY}px,0) scale(0)`;
};
const removeClone = (componentEl, inputEl) => {
    const clone = cloneMap.get(componentEl);
    if (clone) {
        cloneMap.delete(componentEl);
        clone.remove();
    }
    componentEl.style.pointerEvents = '';
    inputEl.style.transform = '';
};
/**
 * Factoring in 50px gives us some room
 * in case the keyboard shows password/autofill bars
 * asynchronously.
 */
const SCROLL_AMOUNT_PADDING = 50;

const enableHideCaretOnScroll = (componentEl, inputEl, scrollEl) => {
    if (!scrollEl || !inputEl) {
        return () => {
            return;
        };
    }
    const scrollHideCaret = (shouldHideCaret) => {
        if (isFocused(inputEl)) {
            relocateInput(componentEl, inputEl, shouldHideCaret);
        }
    };
    const onBlur = () => relocateInput(componentEl, inputEl, false);
    const hideCaret = () => scrollHideCaret(true);
    const showCaret = () => scrollHideCaret(false);
    addEventListener(scrollEl, 'ionScrollStart', hideCaret);
    addEventListener(scrollEl, 'ionScrollEnd', showCaret);
    inputEl.addEventListener('blur', onBlur);
    return () => {
        removeEventListener(scrollEl, 'ionScrollStart', hideCaret);
        removeEventListener(scrollEl, 'ionScrollEnd', showCaret);
        inputEl.removeEventListener('blur', onBlur);
    };
};

const SKIP_SELECTOR = 'input, textarea, [no-blur], [contenteditable]';
const enableInputBlurring = () => {
    let focused = true;
    let didScroll = false;
    const doc = document;
    const onScroll = () => {
        didScroll = true;
    };
    const onFocusin = () => {
        focused = true;
    };
    const onTouchend = (ev) => {
        // if app did scroll return early
        if (didScroll) {
            didScroll = false;
            return;
        }
        const active = doc.activeElement;
        if (!active) {
            return;
        }
        // only blur if the active element is a text-input or a textarea
        if (active.matches(SKIP_SELECTOR)) {
            return;
        }
        // if the selected target is the active element, do not blur
        const tapped = ev.target;
        if (tapped === active) {
            return;
        }
        if (tapped.matches(SKIP_SELECTOR) || tapped.closest(SKIP_SELECTOR)) {
            return;
        }
        focused = false;
        // TODO FW-2796: find a better way, why 50ms?
        setTimeout(() => {
            if (!focused) {
                active.blur();
            }
        }, 50);
    };
    addEventListener(doc, 'ionScrollStart', onScroll);
    doc.addEventListener('focusin', onFocusin, true);
    doc.addEventListener('touchend', onTouchend, false);
    return () => {
        removeEventListener(doc, 'ionScrollStart', onScroll, true);
        doc.removeEventListener('focusin', onFocusin, true);
        doc.removeEventListener('touchend', onTouchend, false);
    };
};

const SCROLL_ASSIST_SPEED = 0.3;
const getScrollData = (componentEl, contentEl, keyboardHeight, platformHeight) => {
    var _a;
    const itemEl = (_a = componentEl.closest('ion-item,[ion-item]')) !== null && _a !== void 0 ? _a : componentEl;
    return calcScrollData(itemEl.getBoundingClientRect(), contentEl.getBoundingClientRect(), keyboardHeight, platformHeight);
};
const calcScrollData = (inputRect, contentRect, keyboardHeight, platformHeight) => {
    // compute input's Y values relative to the body
    const inputTop = inputRect.top;
    const inputBottom = inputRect.bottom;
    // compute visible area
    const visibleAreaTop = contentRect.top;
    const visibleAreaBottom = Math.min(contentRect.bottom, platformHeight - keyboardHeight);
    // compute safe area
    const safeAreaTop = visibleAreaTop + 15;
    const safeAreaBottom = visibleAreaBottom - SCROLL_AMOUNT_PADDING;
    // figure out if each edge of the input is within the safe area
    const distanceToBottom = safeAreaBottom - inputBottom;
    const distanceToTop = safeAreaTop - inputTop;
    // desiredScrollAmount is the negated distance to the safe area according to our calculations.
    const desiredScrollAmount = Math.round(distanceToBottom < 0 ? -distanceToBottom : distanceToTop > 0 ? -distanceToTop : 0);
    // our calculations make some assumptions that aren't always true, like the keyboard being closed when an input
    // gets focus, so make sure we don't scroll the input above the visible area
    const scrollAmount = Math.min(desiredScrollAmount, inputTop - visibleAreaTop);
    const distance = Math.abs(scrollAmount);
    const duration = distance / SCROLL_ASSIST_SPEED;
    const scrollDuration = Math.min(400, Math.max(150, duration));
    return {
        scrollAmount,
        scrollDuration,
        scrollPadding: keyboardHeight,
        inputSafeY: -(inputTop - safeAreaTop) + 4,
    };
};

const PADDING_TIMER_KEY = '$ionPaddingTimer';
/**
 * Scroll padding adds additional padding to the bottom
 * of ion-content so that there is enough scroll space
 * for an input to be scrolled above the keyboard. This
 * is needed in environments where the webview does not
 * resize when the keyboard opens.
 *
 * Example: If an input at the bottom of ion-content is
 * focused, there is no additional scrolling space below
 * it, so the input cannot be scrolled above the keyboard.
 * Scroll padding fixes this by adding padding equal to the
 * height of the keyboard to the bottom of the content.
 *
 * Common environments where this is needed:
 * - Mobile Safari: The keyboard overlays the content
 * - Capacitor/Cordova on iOS: The keyboard overlays the content
 * when the KeyboardResize mode is set to 'none'.
 */
const setScrollPadding = (contentEl, paddingAmount, clearCallback) => {
    const timer = contentEl[PADDING_TIMER_KEY];
    if (timer) {
        clearTimeout(timer);
    }
    if (paddingAmount > 0) {
        contentEl.style.setProperty('--keyboard-offset', `${paddingAmount}px`);
    }
    else {
        contentEl[PADDING_TIMER_KEY] = setTimeout(() => {
            contentEl.style.setProperty('--keyboard-offset', '0px');
            if (clearCallback) {
                clearCallback();
            }
        }, 120);
    }
};
/**
 * When an input is about to be focused,
 * set a timeout to clear any scroll padding
 * on the content. Note: The clearing
 * is done on a timeout so that if users
 * are moving focus from one input to the next
 * then re-adding scroll padding to the new
 * input with cancel the timeout to clear the
 * scroll padding.
 */
const setClearScrollPaddingListener = (inputEl, contentEl, doneCallback) => {
    const clearScrollPadding = () => {
        if (contentEl) {
            setScrollPadding(contentEl, 0, doneCallback);
        }
    };
    inputEl.addEventListener('focusout', clearScrollPadding, { once: true });
};

let currentPadding = 0;
const SKIP_SCROLL_ASSIST = 'data-ionic-skip-scroll-assist';
const enableScrollAssist = (componentEl, inputEl, contentEl, footerEl, keyboardHeight, enableScrollPadding, keyboardResize, disableClonedInput = false) => {
    /**
     * Scroll padding should only be added if:
     * 1. The global scrollPadding config option
     * is set to true.
     * 2. The native keyboard resize mode is either "none"
     * (keyboard overlays webview) or undefined (resize
     * information unavailable)
     * Resize info is available on Capacitor 4+
     */
    const addScrollPadding = enableScrollPadding && (keyboardResize === undefined || keyboardResize.mode === KeyboardResize.None);
    /**
     * This tracks whether or not the keyboard has been
     * presented for a single focused text field. Note
     * that it does not track if the keyboard is open
     * in general such as if the keyboard is open for
     * a different focused text field.
     */
    let hasKeyboardBeenPresentedForTextField = false;
    /**
     * When adding scroll padding we need to know
     * how much of the viewport the keyboard obscures.
     * We do this by subtracting the keyboard height
     * from the platform height.
     *
     * If we compute this value when switching between
     * inputs then the webview may already be resized.
     * At this point, `win.innerHeight` has already accounted
     * for the keyboard meaning we would then subtract
     * the keyboard height again. This will result in the input
     * being scrolled more than it needs to.
     */
    const platformHeight = win !== undefined ? win.innerHeight : 0;
    /**
     * Scroll assist is run when a text field
     * is focused. However, it may need to
     * re-run when the keyboard size changes
     * such that the text field is now hidden
     * underneath the keyboard.
     * This function re-runs scroll assist
     * when that happens.
     *
     * One limitation of this is on a web browser
     * where native keyboard APIs do not have cross-browser
     * support. `ionKeyboardDidShow` relies on the Visual Viewport API.
     * This means that if the keyboard changes but does not change
     * geometry, then scroll assist will not re-run even if
     * the user has scrolled the text field under the keyboard.
     * This is not a problem when running in Cordova/Capacitor
     * because `ionKeyboardDidShow` uses the native events
     * which fire every time the keyboard changes.
     */
    const keyboardShow = (ev) => {
        /**
         * If the keyboard has not yet been presented
         * for this text field then the text field has just
         * received focus. In that case, the focusin listener
         * will run scroll assist.
         */
        if (hasKeyboardBeenPresentedForTextField === false) {
            hasKeyboardBeenPresentedForTextField = true;
            return;
        }
        /**
         * Otherwise, the keyboard has already been presented
         * for the focused text field.
         * This means that the keyboard likely changed
         * geometry, and we need to re-run scroll assist.
         * This can happen when the user rotates their device
         * or when they switch keyboards.
         *
         * Make sure we pass in the computed keyboard height
         * rather than the estimated keyboard height.
         *
         * Since the keyboard is already open then we do not
         * need to wait for the webview to resize, so we pass
         * "waitForResize: false".
         */
        jsSetFocus(componentEl, inputEl, contentEl, footerEl, ev.detail.keyboardHeight, addScrollPadding, disableClonedInput, platformHeight, false);
    };
    /**
     * Reset the internal state when the text field loses focus.
     */
    const focusOut = () => {
        hasKeyboardBeenPresentedForTextField = false;
        win === null || win === void 0 ? void 0 : win.removeEventListener('ionKeyboardDidShow', keyboardShow);
        componentEl.removeEventListener('focusout', focusOut);
    };
    /**
     * When the input is about to receive
     * focus, we need to move it to prevent
     * mobile Safari from adjusting the viewport.
     */
    const focusIn = async () => {
        /**
         * Scroll assist should not run again
         * on inputs that have been manually
         * focused inside of the scroll assist
         * implementation.
         */
        if (inputEl.hasAttribute(SKIP_SCROLL_ASSIST)) {
            inputEl.removeAttribute(SKIP_SCROLL_ASSIST);
            return;
        }
        jsSetFocus(componentEl, inputEl, contentEl, footerEl, keyboardHeight, addScrollPadding, disableClonedInput, platformHeight);
        win === null || win === void 0 ? void 0 : win.addEventListener('ionKeyboardDidShow', keyboardShow);
        componentEl.addEventListener('focusout', focusOut);
    };
    componentEl.addEventListener('focusin', focusIn);
    return () => {
        componentEl.removeEventListener('focusin', focusIn);
        win === null || win === void 0 ? void 0 : win.removeEventListener('ionKeyboardDidShow', keyboardShow);
        componentEl.removeEventListener('focusout', focusOut);
    };
};
/**
 * Use this function when you want to manually
 * focus an input but not have scroll assist run again.
 */
const setManualFocus = (el) => {
    var _a;
    /**
     * If element is already focused then
     * a new focusin event will not be dispatched
     * to remove the SKIL_SCROLL_ASSIST attribute.
     */
    if (document.activeElement === el) {
        return;
    }
    /**
     * Optimization for scenarios where the currently focused element is a sibling
     * of the target element. In such cases, we avoid setting `SKIP_SCROLL_ASSIST`.
     *
     * This is crucial for accessibility: input elements can now contain focusable
     * siblings (e.g., clear buttons, slotted elements). If we didn't skip setting
     * the attribute here, screen readers would be unable to navigate to and interact
     * with these sibling elements.
     *
     * Without this check, we would need to call `ev.stopPropagation()` on the
     * 'focusin' event of each focusable sibling to prevent the scroll assist
     * listener from incorrectly moving focus back to the input. That approach
     * would be less maintainable and more error-prone.
     */
    const inputId = el.getAttribute('id');
    const label = el.closest(`label[for="${inputId}"]`);
    const activeElLabel = (_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.closest(`label[for="${inputId}"]`);
    if (label !== null && label === activeElLabel) {
        // If the label is the same as the active element label, then
        // we don't need to set the `SKIP_SCROLL_ASSIST` and reset focus.
        return;
    }
    el.setAttribute(SKIP_SCROLL_ASSIST, 'true');
    el.focus();
};
const jsSetFocus = async (componentEl, inputEl, contentEl, footerEl, keyboardHeight, enableScrollPadding, disableClonedInput = false, platformHeight = 0, waitForResize = true) => {
    if (!contentEl && !footerEl) {
        return;
    }
    const scrollData = getScrollData(componentEl, (contentEl || footerEl), keyboardHeight, platformHeight);
    if (contentEl && Math.abs(scrollData.scrollAmount) < 4) {
        // the text input is in a safe position that doesn't
        // require it to be scrolled into view, just set focus now
        setManualFocus(inputEl);
        /**
         * Even though the input does not need
         * scroll assist, we should preserve the
         * the scroll padding as users could be moving
         * focus from an input that needs scroll padding
         * to an input that does not need scroll padding.
         * If we remove the scroll padding now, users will
         * see the page jump.
         */
        if (enableScrollPadding && contentEl !== null) {
            setScrollPadding(contentEl, currentPadding);
            setClearScrollPaddingListener(inputEl, contentEl, () => (currentPadding = 0));
        }
        return;
    }
    // temporarily move the focus to the focus holder so the browser
    // doesn't freak out while it's trying to get the input in place
    // at this point the native text input still does not have focus
    relocateInput(componentEl, inputEl, true, scrollData.inputSafeY, disableClonedInput);
    setManualFocus(inputEl);
    /**
     * Relocating/Focusing input causes the
     * click event to be cancelled, so
     * manually fire one here.
     */
    raf(() => componentEl.click());
    /**
     * If enabled, we can add scroll padding to
     * the bottom of the content so that scroll assist
     * has enough room to scroll the input above
     * the keyboard.
     */
    if (enableScrollPadding && contentEl) {
        currentPadding = scrollData.scrollPadding;
        setScrollPadding(contentEl, currentPadding);
    }
    if (typeof window !== 'undefined') {
        let scrollContentTimeout;
        const scrollContent = async () => {
            // clean up listeners and timeouts
            if (scrollContentTimeout !== undefined) {
                clearTimeout(scrollContentTimeout);
            }
            window.removeEventListener('ionKeyboardDidShow', doubleKeyboardEventListener);
            window.removeEventListener('ionKeyboardDidShow', scrollContent);
            // scroll the input into place
            if (contentEl) {
                await scrollByPoint(contentEl, 0, scrollData.scrollAmount, scrollData.scrollDuration);
            }
            // the scroll view is in the correct position now
            // give the native text input focus
            relocateInput(componentEl, inputEl, false, scrollData.inputSafeY);
            // ensure this is the focused input
            setManualFocus(inputEl);
            /**
             * When the input is about to be blurred
             * we should set a timeout to remove
             * any scroll padding.
             */
            if (enableScrollPadding) {
                setClearScrollPaddingListener(inputEl, contentEl, () => (currentPadding = 0));
            }
        };
        const doubleKeyboardEventListener = () => {
            window.removeEventListener('ionKeyboardDidShow', doubleKeyboardEventListener);
            window.addEventListener('ionKeyboardDidShow', scrollContent);
        };
        if (contentEl) {
            const scrollEl = await getScrollElement(contentEl);
            /**
             * scrollData will only consider the amount we need
             * to scroll in order to properly bring the input
             * into view. It will not consider the amount
             * we can scroll in the content element.
             * As a result, scrollData may request a greater
             * scroll position than is currently available
             * in the DOM. If this is the case, we need to
             * wait for the webview to resize/the keyboard
             * to show in order for additional scroll
             * bandwidth to become available.
             */
            const totalScrollAmount = scrollEl.scrollHeight - scrollEl.clientHeight;
            if (waitForResize && scrollData.scrollAmount > totalScrollAmount - scrollEl.scrollTop) {
                /**
                 * On iOS devices, the system will show a "Passwords" bar above the keyboard
                 * after the initial keyboard is shown. This prevents the webview from resizing
                 * until the "Passwords" bar is shown, so we need to wait for that to happen first.
                 */
                if (inputEl.type === 'password') {
                    // Add 50px to account for the "Passwords" bar
                    scrollData.scrollAmount += SCROLL_AMOUNT_PADDING;
                    window.addEventListener('ionKeyboardDidShow', doubleKeyboardEventListener);
                }
                else {
                    window.addEventListener('ionKeyboardDidShow', scrollContent);
                }
                /**
                 * This should only fire in 2 instances:
                 * 1. The app is very slow.
                 * 2. The app is running in a browser on an old OS
                 * that does not support Ionic Keyboard Events
                 */
                scrollContentTimeout = setTimeout(scrollContent, 1000);
                return;
            }
        }
        scrollContent();
    }
};

const INPUT_BLURRING = true;
const startInputShims = async (config, platform) => {
    /**
     * If doc is undefined then we are in an SSR environment
     * where input shims do not apply.
     */
    if (doc === undefined) {
        return;
    }
    const isIOS = platform === 'ios';
    const isAndroid = platform === 'android';
    /**
     * Hide Caret and Input Blurring are needed on iOS.
     * Scroll Assist and Scroll Padding are needed on iOS and Android
     * with Chrome web browser (not Chrome webview).
     */
    const keyboardHeight = config.getNumber('keyboardHeight', 290);
    const scrollAssist = config.getBoolean('scrollAssist', true);
    const hideCaret = config.getBoolean('hideCaretOnScroll', isIOS);
    /**
     * The team is evaluating if inputBlurring is still needed. As a result
     * this feature is disabled by default as of Ionic 8.0. Developers are
     * able to re-enable it temporarily. The team may remove this utility
     * if it is determined that doing so would not bring any adverse side effects.
     * TODO FW-6014 remove input blurring utility (including implementation)
     */
    const inputBlurring = config.getBoolean('inputBlurring', false);
    const scrollPadding = config.getBoolean('scrollPadding', true);
    const inputs = Array.from(doc.querySelectorAll('ion-input, ion-textarea'));
    const hideCaretMap = new WeakMap();
    const scrollAssistMap = new WeakMap();
    /**
     * Grab the native keyboard resize configuration
     * and pass it to scroll assist. Scroll assist requires
     * that we adjust the input right before the input
     * is about to be focused. If we called `Keyboard.getResizeMode`
     * on focusin in scroll assist, we could potentially adjust the
     * input too late since this call is async.
     */
    const keyboardResizeMode = await Keyboard.getResizeMode();
    const registerInput = async (componentEl) => {
        await new Promise((resolve) => componentOnReady(componentEl, resolve));
        const inputRoot = componentEl.shadowRoot || componentEl;
        const inputEl = inputRoot.querySelector('input') || inputRoot.querySelector('textarea');
        const scrollEl = findClosestIonContent(componentEl);
        const footerEl = !scrollEl ? componentEl.closest('ion-footer') : null;
        if (!inputEl) {
            return;
        }
        if (!!scrollEl && hideCaret && !hideCaretMap.has(componentEl)) {
            const rmFn = enableHideCaretOnScroll(componentEl, inputEl, scrollEl);
            hideCaretMap.set(componentEl, rmFn);
        }
        /**
         * date/datetime-locale inputs on mobile devices show date picker
         * overlays instead of keyboards. As a result, scroll assist is
         * not needed. This also works around a bug in iOS <16 where
         * scroll assist causes the browser to lock up. See FW-1997.
         */
        const isDateInput = inputEl.type === 'date' || inputEl.type === 'datetime-local';
        if (!isDateInput &&
            (!!scrollEl || !!footerEl) &&
            scrollAssist &&
            !scrollAssistMap.has(componentEl)) {
            const rmFn = enableScrollAssist(componentEl, inputEl, scrollEl, footerEl, keyboardHeight, scrollPadding, keyboardResizeMode, isAndroid);
            scrollAssistMap.set(componentEl, rmFn);
        }
    };
    const unregisterInput = (componentEl) => {
        if (hideCaret) {
            const fn = hideCaretMap.get(componentEl);
            if (fn) {
                fn();
            }
            hideCaretMap.delete(componentEl);
        }
        if (scrollAssist) {
            const fn = scrollAssistMap.get(componentEl);
            if (fn) {
                fn();
            }
            scrollAssistMap.delete(componentEl);
        }
    };
    if (inputBlurring && INPUT_BLURRING) {
        enableInputBlurring();
    }
    // Input might be already loaded in the DOM before ion-device-hacks did.
    // At this point we need to look for all of the inputs not registered yet
    // and register them.
    for (const input of inputs) {
        registerInput(input);
    }
    doc.addEventListener('ionInputDidLoad', (ev) => {
        registerInput(ev.detail);
    });
    doc.addEventListener('ionInputDidUnload', (ev) => {
        unregisterInput(ev.detail);
    });
};

export { startInputShims };
