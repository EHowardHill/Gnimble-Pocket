/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, writeTask, h, Host } from '@stencil/core/internal/client';
import { a as findClosestIonContent, i as isIonContent, d as disableContentScrollY, r as resetContentScrollY, f as findIonContent, p as printIonContentErrorMsg } from './index8.js';
import { C as CoreDelegate, a as attachComponent, d as detachComponent } from './framework-delegate.js';
import { f as clamp, g as getElementRoot, r as raf, d as inheritAttributes, k as hasLazyBuild } from './helpers.js';
import { c as createLockController } from './lock-controller.js';
import { p as printIonWarning, c as config } from './index4.js';
import { g as getCapacitor } from './capacitor.js';
import { G as GESTURE, O as OVERLAY_GESTURE_PRIORITY, F as FOCUS_TRAP_DISABLE_CLASS, e as createTriggerController, B as BACKDROP, j as prepareOverlay, k as setOverlayId, f as present, g as dismiss, h as eventMethod } from './overlays.js';
import { g as getClassMap } from './theme.js';
import { e as deepReady, w as waitForMount } from './index2.js';
import { b as getIonMode } from './ionic-global.js';
import { KEYBOARD_DID_OPEN } from './keyboard.js';
import { c as createAnimation } from './animation.js';
import { g as getTimeGivenProgression } from './cubic-bezier.js';
import { createGesture } from './index3.js';
import { w as win } from './index9.js';
import { d as defineCustomElement$1 } from './backdrop.js';

var Style;
(function (Style) {
    Style["Dark"] = "DARK";
    Style["Light"] = "LIGHT";
    Style["Default"] = "DEFAULT";
})(Style || (Style = {}));
const StatusBar = {
    getEngine() {
        const capacitor = getCapacitor();
        if (capacitor === null || capacitor === void 0 ? void 0 : capacitor.isPluginAvailable('StatusBar')) {
            return capacitor.Plugins.StatusBar;
        }
        return undefined;
    },
    setStyle(options) {
        const engine = this.getEngine();
        if (!engine) {
            return;
        }
        engine.setStyle(options);
    },
    getStyle: async function () {
        const engine = this.getEngine();
        if (!engine) {
            return Style.Default;
        }
        const { style } = await engine.getInfo();
        return style;
    },
};

/**
 * Use y = mx + b to
 * figure out the backdrop value
 * at a particular x coordinate. This
 * is useful when the backdrop does
 * not begin to fade in until after
 * the 0 breakpoint.
 */
const getBackdropValueForSheet = (x, backdropBreakpoint) => {
    /**
     * We will use these points:
     * (backdropBreakpoint, 0)
     * (maxBreakpoint, 1)
     * We know that at the beginning breakpoint,
     * the backdrop will be hidden. We also
     * know that at the maxBreakpoint, the backdrop
     * must be fully visible. maxBreakpoint should
     * always be 1 even if the maximum value
     * of the breakpoints array is not 1 since
     * the animation runs from a progress of 0
     * to a progress of 1.
     * m = (y2 - y1) / (x2 - x1)
     *
     * This is simplified from:
     * m = (1 - 0) / (maxBreakpoint - backdropBreakpoint)
     *
     * If the backdropBreakpoint is 1, we return 0 as the
     * backdrop is completely hidden.
     *
     */
    if (backdropBreakpoint === 1) {
        return 0;
    }
    const slope = 1 / (1 - backdropBreakpoint);
    /**
     * From here, compute b which is
     * the backdrop opacity if the offset
     * is 0. If the backdrop does not
     * begin to fade in until after the
     * 0 breakpoint, this b value will be
     * negative. This is fine as we never pass
     * b directly into the animation keyframes.
     * b = y - mx
     * Use a known point: (backdropBreakpoint, 0)
     * This is simplified from:
     * b = 0 - (backdropBreakpoint * slope)
     */
    const b = -(backdropBreakpoint * slope);
    /**
     * Finally, we can now determine the
     * backdrop offset given an arbitrary
     * gesture offset.
     */
    return x * slope + b;
};
/**
 * The tablet/desktop card modal activates
 * when the window width is >= 768.
 * At that point, the presenting element
 * is not transformed, so we do not need to
 * adjust the status bar color.
 *
 */
const setCardStatusBarDark = () => {
    if (!win || win.innerWidth >= 768) {
        return;
    }
    StatusBar.setStyle({ style: Style.Dark });
};
const setCardStatusBarDefault = (defaultStyle = Style.Default) => {
    if (!win || win.innerWidth >= 768) {
        return;
    }
    StatusBar.setStyle({ style: defaultStyle });
};

const handleCanDismiss = async (el, animation) => {
    /**
     * If canDismiss is not a function
     * then we can return early. If canDismiss is `true`,
     * then canDismissBlocksGesture is `false` as canDismiss
     * will never interrupt the gesture. As a result,
     * this code block is never reached. If canDismiss is `false`,
     * then we never dismiss.
     */
    if (typeof el.canDismiss !== 'function') {
        return;
    }
    /**
     * Run the canDismiss callback.
     * If the function returns `true`,
     * then we can proceed with dismiss.
     */
    const shouldDismiss = await el.canDismiss(undefined, GESTURE);
    if (!shouldDismiss) {
        return;
    }
    /**
     * If canDismiss resolved after the snap
     * back animation finished, we can
     * dismiss immediately.
     *
     * If canDismiss resolved before the snap
     * back animation finished, we need to
     * wait until the snap back animation is
     * done before dismissing.
     */
    if (animation.isRunning()) {
        animation.onFinish(() => {
            el.dismiss(undefined, 'handler');
        }, { oneTimeCallback: true });
    }
    else {
        el.dismiss(undefined, 'handler');
    }
};
/**
 * This function lets us simulate a realistic spring-like animation
 * when swiping down on the modal.
 * There are two forces that we need to use to compute the spring physics:
 *
 * 1. Stiffness, k: This is a measure of resistance applied a spring.
 * 2. Dampening, c: This value has the effect of reducing or preventing oscillation.
 *
 * Using these two values, we can calculate the Spring Force and the Dampening Force
 * to compute the total force applied to a spring.
 *
 * Spring Force: This force pulls a spring back into its equilibrium position.
 * Hooke's Law tells us that that spring force (FS) = kX.
 * k is the stiffness of a spring, and X is the displacement of the spring from its
 * equilibrium position. In this case, it is the amount by which the free end
 * of a spring was displaced (stretched/pushed) from its "relaxed" position.
 *
 * Dampening Force: This force slows down motion. Without it, a spring would oscillate forever.
 * The dampening force, FD, can be found via this formula: FD = -cv
 * where c the dampening value and v is velocity.
 *
 * Therefore, the resulting force that is exerted on the block is:
 * F = FS + FD = -kX - cv
 *
 * Newton's 2nd Law tells us that F = ma:
 * ma = -kX - cv.
 *
 * For Ionic's purposes, we can assume that m = 1:
 * a = -kX - cv
 *
 * Imagine a block attached to the end of a spring. At equilibrium
 * the block is at position x = 1.
 * Pressing on the block moves it to position x = 0;
 * So, to calculate the displacement, we need to take the
 * current position and subtract the previous position from it.
 * X = x - x0 = 0 - 1 = -1.
 *
 * For Ionic's purposes, we are only pushing on the spring modal
 * so we have a max position of 1.
 * As a result, we can expand displacement to this formula:
 * X = x - 1
 *
 * a = -k(x - 1) - cv
 *
 * We can represent the motion of something as a function of time: f(t) = x.
 * The derivative of position gives us the velocity: f'(t)
 * The derivative of the velocity gives us the acceleration: f''(t)
 *
 * We can substitute the formula above with these values:
 *
 * f"(t) = -k * (f(t) - 1) - c * f'(t)
 *
 * This is called a differential equation.
 *
 * We know that at t = 0, we are at x = 0 because the modal does not move: f(0) = 0
 * This means our velocity is also zero: f'(0) = 0.
 *
 * We can cheat a bit and plug the formula into Wolfram Alpha.
 * However, we need to pick stiffness and dampening values:
 * k = 0.57
 * c = 15
 *
 * I picked these as they are fairly close to native iOS's spring effect
 * with the modal.
 *
 * What we plug in is this: f(0) = 0; f'(0) = 0; f''(t) = -0.57(f(t) - 1) - 15f'(t)
 *
 * The result is a formula that lets us calculate the acceleration
 * for a given time t.
 * Note: This is the approximate form of the solution. Wolfram Alpha will
 * give you a complex differential equation too.
 */
const calculateSpringStep = (t) => {
    return 0.00255275 * 2.71828 ** (-14.9619 * t) - 1.00255 * 2.71828 ** (-0.0380968 * t) + 1;
};

// Defaults for the card swipe animation
const SwipeToCloseDefaults = {
    MIN_PRESENTING_SCALE: 0.915,
};
const createSwipeToCloseGesture = (el, animation, statusBarStyle, onDismiss) => {
    /**
     * The step value at which a card modal
     * is eligible for dismissing via gesture.
     */
    const DISMISS_THRESHOLD = 0.5;
    const height = el.offsetHeight;
    let isOpen = false;
    let canDismissBlocksGesture = false;
    let contentEl = null;
    let scrollEl = null;
    const canDismissMaxStep = 0.2;
    let initialScrollY = true;
    let lastStep = 0;
    const getScrollY = () => {
        if (contentEl && isIonContent(contentEl)) {
            return contentEl.scrollY;
            /**
             * Custom scroll containers are intended to be
             * used with virtual scrolling, so we assume
             * there is scrolling in this case.
             */
        }
        else {
            return true;
        }
    };
    const canStart = (detail) => {
        const target = detail.event.target;
        if (target === null || !target.closest) {
            return true;
        }
        /**
         * If we are swiping on the content,
         * swiping should only be possible if
         * the content is scrolled all the way
         * to the top so that we do not interfere
         * with scrolling.
         *
         * We cannot assume that the `ion-content`
         * target will remain consistent between
         * swipes. For example, when using
         * ion-nav within a card modal it is
         * possible to swipe, push a view, and then
         * swipe again. The target content will not
         * be the same between swipes.
         */
        contentEl = findClosestIonContent(target);
        if (contentEl) {
            /**
             * The card should never swipe to close
             * on the content with a refresher.
             * Note: We cannot solve this by making the
             * swipeToClose gesture have a higher priority
             * than the refresher gesture as the iOS native
             * refresh gesture uses a scroll listener in
             * addition to a gesture.
             *
             * Note: Do not use getScrollElement here
             * because we need this to be a synchronous
             * operation, and getScrollElement is
             * asynchronous.
             */
            if (isIonContent(contentEl)) {
                const root = getElementRoot(contentEl);
                scrollEl = root.querySelector('.inner-scroll');
            }
            else {
                scrollEl = contentEl;
            }
            const hasRefresherInContent = !!contentEl.querySelector('ion-refresher');
            return !hasRefresherInContent && scrollEl.scrollTop === 0;
        }
        /**
         * Card should be swipeable on all
         * parts of the modal except for the footer.
         */
        const footer = target.closest('ion-footer');
        if (footer === null) {
            return true;
        }
        return false;
    };
    const onStart = (detail) => {
        const { deltaY } = detail;
        /**
         * Get the initial scrollY value so
         * that we can correctly reset the scrollY
         * prop when the gesture ends.
         */
        initialScrollY = getScrollY();
        /**
         * If canDismiss is anything other than `true`
         * then users should be able to swipe down
         * until a threshold is hit. At that point,
         * the card modal should not proceed any further.
         * TODO (FW-937)
         * Remove undefined check
         */
        canDismissBlocksGesture = el.canDismiss !== undefined && el.canDismiss !== true;
        /**
         * If we are pulling down, then
         * it is possible we are pulling on the
         * content. We do not want scrolling to
         * happen at the same time as the gesture.
         */
        if (deltaY > 0 && contentEl) {
            disableContentScrollY(contentEl);
        }
        animation.progressStart(true, isOpen ? 1 : 0);
    };
    const onMove = (detail) => {
        const { deltaY } = detail;
        /**
         * If we are pulling down, then
         * it is possible we are pulling on the
         * content. We do not want scrolling to
         * happen at the same time as the gesture.
         */
        if (deltaY > 0 && contentEl) {
            disableContentScrollY(contentEl);
        }
        /**
         * If we are swiping on the content
         * then the swipe gesture should only
         * happen if we are pulling down.
         *
         * However, if we pull up and
         * then down such that the scroll position
         * returns to 0, we should be able to swipe
         * the card.
         */
        const step = detail.deltaY / height;
        /**
         * Check if user is swiping down and
         * if we have a canDismiss value that
         * should block the gesture from
         * proceeding,
         */
        const isAttemptingDismissWithCanDismiss = step >= 0 && canDismissBlocksGesture;
        /**
         * If we are blocking the gesture from dismissing,
         * set the max step value so that the sheet cannot be
         * completely hidden.
         */
        const maxStep = isAttemptingDismissWithCanDismiss ? canDismissMaxStep : 0.9999;
        /**
         * If we are blocking the gesture from
         * dismissing, calculate the spring modifier value
         * this will be added to the starting breakpoint
         * value to give the gesture a spring-like feeling.
         * Note that the starting breakpoint is always 0,
         * so we omit adding 0 to the result.
         */
        const processedStep = isAttemptingDismissWithCanDismiss ? calculateSpringStep(step / maxStep) : step;
        const clampedStep = clamp(0.0001, processedStep, maxStep);
        animation.progressStep(clampedStep);
        /**
         * When swiping down half way, the status bar style
         * should be reset to its default value.
         *
         * We track lastStep so that we do not fire these
         * functions on every onMove, only when the user has
         * crossed a certain threshold.
         */
        if (clampedStep >= DISMISS_THRESHOLD && lastStep < DISMISS_THRESHOLD) {
            setCardStatusBarDefault(statusBarStyle);
            /**
             * However, if we swipe back up, then the
             * status bar style should be set to have light
             * text on a dark background.
             */
        }
        else if (clampedStep < DISMISS_THRESHOLD && lastStep >= DISMISS_THRESHOLD) {
            setCardStatusBarDark();
        }
        lastStep = clampedStep;
    };
    const onEnd = (detail) => {
        const velocity = detail.velocityY;
        const step = detail.deltaY / height;
        const isAttemptingDismissWithCanDismiss = step >= 0 && canDismissBlocksGesture;
        const maxStep = isAttemptingDismissWithCanDismiss ? canDismissMaxStep : 0.9999;
        const processedStep = isAttemptingDismissWithCanDismiss ? calculateSpringStep(step / maxStep) : step;
        const clampedStep = clamp(0.0001, processedStep, maxStep);
        const threshold = (detail.deltaY + velocity * 1000) / height;
        /**
         * If canDismiss blocks
         * the swipe gesture, then the
         * animation can never complete until
         * canDismiss is checked.
         */
        const shouldComplete = !isAttemptingDismissWithCanDismiss && threshold >= DISMISS_THRESHOLD;
        let newStepValue = shouldComplete ? -1e-3 : 0.001;
        if (!shouldComplete) {
            animation.easing('cubic-bezier(1, 0, 0.68, 0.28)');
            newStepValue += getTimeGivenProgression([0, 0], [1, 0], [0.68, 0.28], [1, 1], clampedStep)[0];
        }
        else {
            animation.easing('cubic-bezier(0.32, 0.72, 0, 1)');
            newStepValue += getTimeGivenProgression([0, 0], [0.32, 0.72], [0, 1], [1, 1], clampedStep)[0];
        }
        const duration = shouldComplete
            ? computeDuration(step * height, velocity)
            : computeDuration((1 - clampedStep) * height, velocity);
        isOpen = shouldComplete;
        gesture.enable(false);
        if (contentEl) {
            resetContentScrollY(contentEl, initialScrollY);
        }
        animation
            .onFinish(() => {
            if (!shouldComplete) {
                gesture.enable(true);
            }
        })
            .progressEnd(shouldComplete ? 1 : 0, newStepValue, duration);
        /**
         * If the canDismiss value blocked the gesture
         * from proceeding, then we should ignore whatever
         * shouldComplete is. Whether or not the modal
         * animation should complete is now determined by
         * canDismiss.
         *
         * If the user swiped >25% of the way
         * to the max step, then we should
         * check canDismiss. 25% was chosen
         * to avoid accidental swipes.
         */
        if (isAttemptingDismissWithCanDismiss && clampedStep > maxStep / 4) {
            handleCanDismiss(el, animation);
        }
        else if (shouldComplete) {
            onDismiss();
        }
    };
    const gesture = createGesture({
        el,
        gestureName: 'modalSwipeToClose',
        gesturePriority: OVERLAY_GESTURE_PRIORITY,
        direction: 'y',
        threshold: 10,
        canStart,
        onStart,
        onMove,
        onEnd,
    });
    return gesture;
};
const computeDuration = (remaining, velocity) => {
    return clamp(400, remaining / Math.abs(velocity * 1.1), 500);
};

const createSheetEnterAnimation = (opts) => {
    const { currentBreakpoint, backdropBreakpoint, expandToScroll } = opts;
    /**
     * If the backdropBreakpoint is undefined, then the backdrop
     * should always fade in. If the backdropBreakpoint came before the
     * current breakpoint, then the backdrop should be fading in.
     */
    const shouldShowBackdrop = backdropBreakpoint === undefined || backdropBreakpoint < currentBreakpoint;
    const initialBackdrop = shouldShowBackdrop ? `calc(var(--backdrop-opacity) * ${currentBreakpoint})` : '0';
    const backdropAnimation = createAnimation('backdropAnimation').fromTo('opacity', 0, initialBackdrop);
    if (shouldShowBackdrop) {
        backdropAnimation
            .beforeStyles({
            'pointer-events': 'none',
        })
            .afterClearStyles(['pointer-events']);
    }
    const wrapperAnimation = createAnimation('wrapperAnimation').keyframes([
        { offset: 0, opacity: 1, transform: 'translateY(100%)' },
        { offset: 1, opacity: 1, transform: `translateY(${100 - currentBreakpoint * 100}%)` },
    ]);
    /**
     * This allows the content to be scrollable at any breakpoint.
     */
    const contentAnimation = !expandToScroll
        ? createAnimation('contentAnimation').keyframes([
            { offset: 0, opacity: 1, maxHeight: `${(1 - currentBreakpoint) * 100}%` },
            { offset: 1, opacity: 1, maxHeight: `${currentBreakpoint * 100}%` },
        ])
        : undefined;
    return { wrapperAnimation, backdropAnimation, contentAnimation };
};
const createSheetLeaveAnimation = (opts) => {
    const { currentBreakpoint, backdropBreakpoint } = opts;
    /**
     * Backdrop does not always fade in from 0 to 1 if backdropBreakpoint
     * is defined, so we need to account for that offset by figuring out
     * what the current backdrop value should be.
     */
    const backdropValue = `calc(var(--backdrop-opacity) * ${getBackdropValueForSheet(currentBreakpoint, backdropBreakpoint)})`;
    const defaultBackdrop = [
        { offset: 0, opacity: backdropValue },
        { offset: 1, opacity: 0 },
    ];
    const customBackdrop = [
        { offset: 0, opacity: backdropValue },
        { offset: backdropBreakpoint, opacity: 0 },
        { offset: 1, opacity: 0 },
    ];
    const backdropAnimation = createAnimation('backdropAnimation').keyframes(backdropBreakpoint !== 0 ? customBackdrop : defaultBackdrop);
    const wrapperAnimation = createAnimation('wrapperAnimation').keyframes([
        { offset: 0, opacity: 1, transform: `translateY(${100 - currentBreakpoint * 100}%)` },
        { offset: 1, opacity: 1, transform: `translateY(100%)` },
    ]);
    return { wrapperAnimation, backdropAnimation };
};

const createEnterAnimation$1 = () => {
    const backdropAnimation = createAnimation()
        .fromTo('opacity', 0.01, 'var(--backdrop-opacity)')
        .beforeStyles({
        'pointer-events': 'none',
    })
        .afterClearStyles(['pointer-events']);
    const wrapperAnimation = createAnimation().fromTo('transform', 'translateY(100vh)', 'translateY(0vh)');
    return { backdropAnimation, wrapperAnimation, contentAnimation: undefined };
};
/**
 * iOS Modal Enter Animation for the Card presentation style
 */
const iosEnterAnimation = (baseEl, opts) => {
    const { presentingEl, currentBreakpoint, expandToScroll } = opts;
    const root = getElementRoot(baseEl);
    const { wrapperAnimation, backdropAnimation, contentAnimation } = currentBreakpoint !== undefined ? createSheetEnterAnimation(opts) : createEnterAnimation$1();
    backdropAnimation.addElement(root.querySelector('ion-backdrop'));
    wrapperAnimation.addElement(root.querySelectorAll('.modal-wrapper, .modal-shadow')).beforeStyles({ opacity: 1 });
    // The content animation is only added if scrolling is enabled for
    // all the breakpoints.
    !expandToScroll && (contentAnimation === null || contentAnimation === void 0 ? void 0 : contentAnimation.addElement(baseEl.querySelector('.ion-page')));
    const baseAnimation = createAnimation('entering-base')
        .addElement(baseEl)
        .easing('cubic-bezier(0.32,0.72,0,1)')
        .duration(500)
        .addAnimation([wrapperAnimation]);
    if (contentAnimation) {
        baseAnimation.addAnimation(contentAnimation);
    }
    if (presentingEl) {
        const isMobile = window.innerWidth < 768;
        const hasCardModal = presentingEl.tagName === 'ION-MODAL' && presentingEl.presentingElement !== undefined;
        const presentingElRoot = getElementRoot(presentingEl);
        const presentingAnimation = createAnimation().beforeStyles({
            transform: 'translateY(0)',
            'transform-origin': 'top center',
            overflow: 'hidden',
        });
        const bodyEl = document.body;
        if (isMobile) {
            /**
             * Fallback for browsers that does not support `max()` (ex: Firefox)
             * No need to worry about statusbar padding since engines like Gecko
             * are not used as the engine for standalone Cordova/Capacitor apps
             */
            const transformOffset = !CSS.supports('width', 'max(0px, 1px)') ? '30px' : 'max(30px, var(--ion-safe-area-top))';
            const modalTransform = hasCardModal ? '-10px' : transformOffset;
            const toPresentingScale = SwipeToCloseDefaults.MIN_PRESENTING_SCALE;
            const finalTransform = `translateY(${modalTransform}) scale(${toPresentingScale})`;
            presentingAnimation
                .afterStyles({
                transform: finalTransform,
            })
                .beforeAddWrite(() => bodyEl.style.setProperty('background-color', 'black'))
                .addElement(presentingEl)
                .keyframes([
                { offset: 0, filter: 'contrast(1)', transform: 'translateY(0px) scale(1)', borderRadius: '0px' },
                { offset: 1, filter: 'contrast(0.85)', transform: finalTransform, borderRadius: '10px 10px 0 0' },
            ]);
            baseAnimation.addAnimation(presentingAnimation);
        }
        else {
            baseAnimation.addAnimation(backdropAnimation);
            if (!hasCardModal) {
                wrapperAnimation.fromTo('opacity', '0', '1');
            }
            else {
                const toPresentingScale = hasCardModal ? SwipeToCloseDefaults.MIN_PRESENTING_SCALE : 1;
                const finalTransform = `translateY(-10px) scale(${toPresentingScale})`;
                presentingAnimation
                    .afterStyles({
                    transform: finalTransform,
                })
                    .addElement(presentingElRoot.querySelector('.modal-wrapper'))
                    .keyframes([
                    { offset: 0, filter: 'contrast(1)', transform: 'translateY(0) scale(1)' },
                    { offset: 1, filter: 'contrast(0.85)', transform: finalTransform },
                ]);
                const shadowAnimation = createAnimation()
                    .afterStyles({
                    transform: finalTransform,
                })
                    .addElement(presentingElRoot.querySelector('.modal-shadow'))
                    .keyframes([
                    { offset: 0, opacity: '1', transform: 'translateY(0) scale(1)' },
                    { offset: 1, opacity: '0', transform: finalTransform },
                ]);
                baseAnimation.addAnimation([presentingAnimation, shadowAnimation]);
            }
        }
    }
    else {
        baseAnimation.addAnimation(backdropAnimation);
    }
    return baseAnimation;
};

const createLeaveAnimation$1 = () => {
    const backdropAnimation = createAnimation().fromTo('opacity', 'var(--backdrop-opacity)', 0);
    const wrapperAnimation = createAnimation().fromTo('transform', 'translateY(0vh)', 'translateY(100vh)');
    return { backdropAnimation, wrapperAnimation };
};
/**
 * iOS Modal Leave Animation
 */
const iosLeaveAnimation = (baseEl, opts, duration = 500) => {
    const { presentingEl, currentBreakpoint } = opts;
    const root = getElementRoot(baseEl);
    const { wrapperAnimation, backdropAnimation } = currentBreakpoint !== undefined ? createSheetLeaveAnimation(opts) : createLeaveAnimation$1();
    backdropAnimation.addElement(root.querySelector('ion-backdrop'));
    wrapperAnimation.addElement(root.querySelectorAll('.modal-wrapper, .modal-shadow')).beforeStyles({ opacity: 1 });
    const baseAnimation = createAnimation('leaving-base')
        .addElement(baseEl)
        .easing('cubic-bezier(0.32,0.72,0,1)')
        .duration(duration)
        .addAnimation(wrapperAnimation);
    if (presentingEl) {
        const isMobile = window.innerWidth < 768;
        const hasCardModal = presentingEl.tagName === 'ION-MODAL' && presentingEl.presentingElement !== undefined;
        const presentingElRoot = getElementRoot(presentingEl);
        const presentingAnimation = createAnimation()
            .beforeClearStyles(['transform'])
            .afterClearStyles(['transform'])
            .onFinish((currentStep) => {
            // only reset background color if this is the last card-style modal
            if (currentStep !== 1) {
                return;
            }
            presentingEl.style.setProperty('overflow', '');
            const numModals = Array.from(bodyEl.querySelectorAll('ion-modal:not(.overlay-hidden)')).filter((m) => m.presentingElement !== undefined).length;
            if (numModals <= 1) {
                bodyEl.style.setProperty('background-color', '');
            }
        });
        const bodyEl = document.body;
        if (isMobile) {
            const transformOffset = !CSS.supports('width', 'max(0px, 1px)') ? '30px' : 'max(30px, var(--ion-safe-area-top))';
            const modalTransform = hasCardModal ? '-10px' : transformOffset;
            const toPresentingScale = SwipeToCloseDefaults.MIN_PRESENTING_SCALE;
            const finalTransform = `translateY(${modalTransform}) scale(${toPresentingScale})`;
            presentingAnimation.addElement(presentingEl).keyframes([
                { offset: 0, filter: 'contrast(0.85)', transform: finalTransform, borderRadius: '10px 10px 0 0' },
                { offset: 1, filter: 'contrast(1)', transform: 'translateY(0px) scale(1)', borderRadius: '0px' },
            ]);
            baseAnimation.addAnimation(presentingAnimation);
        }
        else {
            baseAnimation.addAnimation(backdropAnimation);
            if (!hasCardModal) {
                wrapperAnimation.fromTo('opacity', '1', '0');
            }
            else {
                const toPresentingScale = hasCardModal ? SwipeToCloseDefaults.MIN_PRESENTING_SCALE : 1;
                const finalTransform = `translateY(-10px) scale(${toPresentingScale})`;
                presentingAnimation
                    .addElement(presentingElRoot.querySelector('.modal-wrapper'))
                    .afterStyles({
                    transform: 'translate3d(0, 0, 0)',
                })
                    .keyframes([
                    { offset: 0, filter: 'contrast(0.85)', transform: finalTransform },
                    { offset: 1, filter: 'contrast(1)', transform: 'translateY(0) scale(1)' },
                ]);
                const shadowAnimation = createAnimation()
                    .addElement(presentingElRoot.querySelector('.modal-shadow'))
                    .afterStyles({
                    transform: 'translateY(0) scale(1)',
                })
                    .keyframes([
                    { offset: 0, opacity: '0', transform: finalTransform },
                    { offset: 1, opacity: '1', transform: 'translateY(0) scale(1)' },
                ]);
                baseAnimation.addAnimation([presentingAnimation, shadowAnimation]);
            }
        }
    }
    else {
        baseAnimation.addAnimation(backdropAnimation);
    }
    return baseAnimation;
};

const createEnterAnimation = () => {
    const backdropAnimation = createAnimation()
        .fromTo('opacity', 0.01, 'var(--backdrop-opacity)')
        .beforeStyles({
        'pointer-events': 'none',
    })
        .afterClearStyles(['pointer-events']);
    const wrapperAnimation = createAnimation().keyframes([
        { offset: 0, opacity: 0.01, transform: 'translateY(40px)' },
        { offset: 1, opacity: 1, transform: `translateY(0px)` },
    ]);
    return { backdropAnimation, wrapperAnimation, contentAnimation: undefined };
};
/**
 * Md Modal Enter Animation
 */
const mdEnterAnimation = (baseEl, opts) => {
    const { currentBreakpoint, expandToScroll } = opts;
    const root = getElementRoot(baseEl);
    const { wrapperAnimation, backdropAnimation, contentAnimation } = currentBreakpoint !== undefined ? createSheetEnterAnimation(opts) : createEnterAnimation();
    backdropAnimation.addElement(root.querySelector('ion-backdrop'));
    wrapperAnimation.addElement(root.querySelector('.modal-wrapper'));
    // The content animation is only added if scrolling is enabled for
    // all the breakpoints.
    !expandToScroll && (contentAnimation === null || contentAnimation === void 0 ? void 0 : contentAnimation.addElement(baseEl.querySelector('.ion-page')));
    const baseAnimation = createAnimation()
        .addElement(baseEl)
        .easing('cubic-bezier(0.36,0.66,0.04,1)')
        .duration(280)
        .addAnimation([backdropAnimation, wrapperAnimation]);
    if (contentAnimation) {
        baseAnimation.addAnimation(contentAnimation);
    }
    return baseAnimation;
};

const createLeaveAnimation = () => {
    const backdropAnimation = createAnimation().fromTo('opacity', 'var(--backdrop-opacity)', 0);
    const wrapperAnimation = createAnimation().keyframes([
        { offset: 0, opacity: 0.99, transform: `translateY(0px)` },
        { offset: 1, opacity: 0, transform: 'translateY(40px)' },
    ]);
    return { backdropAnimation, wrapperAnimation };
};
/**
 * Md Modal Leave Animation
 */
const mdLeaveAnimation = (baseEl, opts) => {
    const { currentBreakpoint } = opts;
    const root = getElementRoot(baseEl);
    const { wrapperAnimation, backdropAnimation } = currentBreakpoint !== undefined ? createSheetLeaveAnimation(opts) : createLeaveAnimation();
    backdropAnimation.addElement(root.querySelector('ion-backdrop'));
    wrapperAnimation.addElement(root.querySelector('.modal-wrapper'));
    const baseAnimation = createAnimation()
        .easing('cubic-bezier(0.47,0,0.745,0.715)')
        .duration(200)
        .addAnimation([backdropAnimation, wrapperAnimation]);
    return baseAnimation;
};

const createSheetGesture = (baseEl, backdropEl, wrapperEl, initialBreakpoint, backdropBreakpoint, animation, breakpoints = [], expandToScroll, getCurrentBreakpoint, onDismiss, onBreakpointChange) => {
    // Defaults for the sheet swipe animation
    const defaultBackdrop = [
        { offset: 0, opacity: 'var(--backdrop-opacity)' },
        { offset: 1, opacity: 0.01 },
    ];
    const customBackdrop = [
        { offset: 0, opacity: 'var(--backdrop-opacity)' },
        { offset: 1 - backdropBreakpoint, opacity: 0 },
        { offset: 1, opacity: 0 },
    ];
    const SheetDefaults = {
        WRAPPER_KEYFRAMES: [
            { offset: 0, transform: 'translateY(0%)' },
            { offset: 1, transform: 'translateY(100%)' },
        ],
        BACKDROP_KEYFRAMES: backdropBreakpoint !== 0 ? customBackdrop : defaultBackdrop,
        CONTENT_KEYFRAMES: [
            { offset: 0, maxHeight: '100%' },
            { offset: 1, maxHeight: '0%' },
        ],
    };
    const contentEl = baseEl.querySelector('ion-content');
    const height = wrapperEl.clientHeight;
    let currentBreakpoint = initialBreakpoint;
    let offset = 0;
    let canDismissBlocksGesture = false;
    let cachedScrollEl = null;
    let cachedFooterEl = null;
    let cachedFooterYPosition = null;
    let currentFooterState = null;
    const canDismissMaxStep = 0.95;
    const maxBreakpoint = breakpoints[breakpoints.length - 1];
    const minBreakpoint = breakpoints[0];
    const wrapperAnimation = animation.childAnimations.find((ani) => ani.id === 'wrapperAnimation');
    const backdropAnimation = animation.childAnimations.find((ani) => ani.id === 'backdropAnimation');
    const contentAnimation = animation.childAnimations.find((ani) => ani.id === 'contentAnimation');
    const enableBackdrop = () => {
        baseEl.style.setProperty('pointer-events', 'auto');
        backdropEl.style.setProperty('pointer-events', 'auto');
        /**
         * When the backdrop is enabled, elements such
         * as inputs should not be focusable outside
         * the sheet.
         */
        baseEl.classList.remove(FOCUS_TRAP_DISABLE_CLASS);
    };
    const disableBackdrop = () => {
        baseEl.style.setProperty('pointer-events', 'none');
        backdropEl.style.setProperty('pointer-events', 'none');
        /**
         * When the backdrop is enabled, elements such
         * as inputs should not be focusable outside
         * the sheet.
         * Adding this class disables focus trapping
         * for the sheet temporarily.
         */
        baseEl.classList.add(FOCUS_TRAP_DISABLE_CLASS);
    };
    /**
     * Toggles the footer to an absolute position while moving to prevent
     * it from shaking while the sheet is being dragged.
     * @param newPosition Whether the footer is in a moving or stationary position.
     */
    const swapFooterPosition = (newPosition) => {
        if (!cachedFooterEl) {
            cachedFooterEl = baseEl.querySelector('ion-footer');
            if (!cachedFooterEl) {
                return;
            }
        }
        const page = baseEl.querySelector('.ion-page');
        currentFooterState = newPosition;
        if (newPosition === 'stationary') {
            // Reset positioning styles to allow normal document flow
            cachedFooterEl.classList.remove('modal-footer-moving');
            cachedFooterEl.style.removeProperty('position');
            cachedFooterEl.style.removeProperty('width');
            cachedFooterEl.style.removeProperty('height');
            cachedFooterEl.style.removeProperty('top');
            cachedFooterEl.style.removeProperty('left');
            page === null || page === void 0 ? void 0 : page.style.removeProperty('padding-bottom');
            // Move to page
            page === null || page === void 0 ? void 0 : page.appendChild(cachedFooterEl);
        }
        else {
            // Get both the footer and document body positions
            const cachedFooterElRect = cachedFooterEl.getBoundingClientRect();
            const bodyRect = document.body.getBoundingClientRect();
            // Add padding to the parent element to prevent content from being hidden
            // when the footer is positioned absolutely. This has to be done before we
            // make the footer absolutely positioned or we may accidentally cause the
            // sheet to scroll.
            const footerHeight = cachedFooterEl.clientHeight;
            page === null || page === void 0 ? void 0 : page.style.setProperty('padding-bottom', `${footerHeight}px`);
            // Apply positioning styles to keep footer at bottom
            cachedFooterEl.classList.add('modal-footer-moving');
            // Calculate absolute position relative to body
            // We need to subtract the body's offsetTop to get true position within document.body
            const absoluteTop = cachedFooterElRect.top - bodyRect.top;
            const absoluteLeft = cachedFooterElRect.left - bodyRect.left;
            // Capture the footer's current dimensions and hard code them during the drag
            cachedFooterEl.style.setProperty('position', 'absolute');
            cachedFooterEl.style.setProperty('width', `${cachedFooterEl.clientWidth}px`);
            cachedFooterEl.style.setProperty('height', `${cachedFooterEl.clientHeight}px`);
            cachedFooterEl.style.setProperty('top', `${absoluteTop}px`);
            cachedFooterEl.style.setProperty('left', `${absoluteLeft}px`);
            // Also cache the footer Y position, which we use to determine if the
            // sheet has been moved below the footer. When that happens, we need to swap
            // the position back so it will collapse correctly.
            cachedFooterYPosition = absoluteTop;
            // If there's a toolbar, we need to combine the toolbar height with the footer position
            // because the toolbar moves with the drag handle, so when it starts overlapping the footer,
            // we need to account for that.
            const toolbar = baseEl.querySelector('ion-toolbar');
            if (toolbar) {
                cachedFooterYPosition -= toolbar.clientHeight;
            }
            document.body.appendChild(cachedFooterEl);
        }
    };
    /**
     * After the entering animation completes,
     * we need to set the animation to go from
     * offset 0 to offset 1 so that users can
     * swipe in any direction. We then set the
     * animation offset to the current breakpoint
     * so there is no flickering.
     */
    if (wrapperAnimation && backdropAnimation) {
        wrapperAnimation.keyframes([...SheetDefaults.WRAPPER_KEYFRAMES]);
        backdropAnimation.keyframes([...SheetDefaults.BACKDROP_KEYFRAMES]);
        contentAnimation === null || contentAnimation === void 0 ? void 0 : contentAnimation.keyframes([...SheetDefaults.CONTENT_KEYFRAMES]);
        animation.progressStart(true, 1 - currentBreakpoint);
        /**
         * If backdrop is not enabled, then content
         * behind modal should be clickable. To do this, we need
         * to remove pointer-events from ion-modal as a whole.
         * ion-backdrop and .modal-wrapper always have pointer-events: auto
         * applied, so the modal content can still be interacted with.
         */
        const shouldEnableBackdrop = currentBreakpoint > backdropBreakpoint;
        if (shouldEnableBackdrop) {
            enableBackdrop();
        }
        else {
            disableBackdrop();
        }
    }
    if (contentEl && currentBreakpoint !== maxBreakpoint && expandToScroll) {
        contentEl.scrollY = false;
    }
    const canStart = (detail) => {
        /**
         * If we are swiping on the content, swiping should only be possible if the content
         * is scrolled all the way to the top so that we do not interfere with scrolling.
         *
         * We cannot assume that the `ion-content` target will remain consistent between swipes.
         * For example, when using ion-nav within a modal it is possible to swipe, push a view,
         * and then swipe again. The target content will not be the same between swipes.
         */
        const contentEl = findClosestIonContent(detail.event.target);
        currentBreakpoint = getCurrentBreakpoint();
        /**
         * If `expandToScroll` is disabled, we should not allow the swipe gesture
         * to start if the content is not scrolled to the top.
         */
        if (!expandToScroll && contentEl) {
            const scrollEl = isIonContent(contentEl) ? getElementRoot(contentEl).querySelector('.inner-scroll') : contentEl;
            return scrollEl.scrollTop === 0;
        }
        if (currentBreakpoint === 1 && contentEl) {
            /**
             * The modal should never swipe to close on the content with a refresher.
             * Note 1: We cannot solve this by making this gesture have a higher priority than
             * the refresher gesture as the iOS native refresh gesture uses a scroll listener in
             * addition to a gesture.
             *
             * Note 2: Do not use getScrollElement here because we need this to be a synchronous
             * operation, and getScrollElement is asynchronous.
             */
            const scrollEl = isIonContent(contentEl) ? getElementRoot(contentEl).querySelector('.inner-scroll') : contentEl;
            const hasRefresherInContent = !!contentEl.querySelector('ion-refresher');
            return !hasRefresherInContent && scrollEl.scrollTop === 0;
        }
        return true;
    };
    const onStart = (detail) => {
        /**
         * If canDismiss is anything other than `true`
         * then users should be able to swipe down
         * until a threshold is hit. At that point,
         * the card modal should not proceed any further.
         *
         * canDismiss is never fired via gesture if there is
         * no 0 breakpoint. However, it can be fired if the user
         * presses Esc or the hardware back button.
         * TODO (FW-937)
         * Remove undefined check
         */
        canDismissBlocksGesture = baseEl.canDismiss !== undefined && baseEl.canDismiss !== true && minBreakpoint === 0;
        /**
         * Cache the scroll element reference when the gesture starts,
         * this allows us to avoid querying the DOM for the target in onMove,
         * which would impact performance significantly.
         */
        if (!expandToScroll) {
            const targetEl = findClosestIonContent(detail.event.target);
            cachedScrollEl =
                targetEl && isIonContent(targetEl) ? getElementRoot(targetEl).querySelector('.inner-scroll') : targetEl;
        }
        /**
         * If expandToScroll is disabled, we need to swap
         * the footer position to moving so that it doesn't shake
         * while the sheet is being dragged.
         */
        if (!expandToScroll) {
            swapFooterPosition('moving');
        }
        /**
         * If we are pulling down, then it is possible we are pulling on the content.
         * We do not want scrolling to happen at the same time as the gesture.
         */
        if (detail.deltaY > 0 && contentEl) {
            contentEl.scrollY = false;
        }
        raf(() => {
            /**
             * Dismisses the open keyboard when the sheet drag gesture is started.
             * Sets the focus onto the modal element.
             */
            baseEl.focus();
        });
        animation.progressStart(true, 1 - currentBreakpoint);
    };
    const onMove = (detail) => {
        /**
         * If `expandToScroll` is disabled, we need to see if we're currently below
         * the footer element and the footer is in a stationary position. If so,
         * we need to make the stationary the original position so that the footer
         * collapses with the sheet.
         */
        if (!expandToScroll && cachedFooterYPosition !== null && currentFooterState !== null) {
            // Check if we need to swap the footer position
            if (detail.currentY >= cachedFooterYPosition && currentFooterState === 'moving') {
                swapFooterPosition('stationary');
            }
            else if (detail.currentY < cachedFooterYPosition && currentFooterState === 'stationary') {
                swapFooterPosition('moving');
            }
        }
        /**
         * If `expandToScroll` is disabled, and an upwards swipe gesture is done within
         * the scrollable content, we should not allow the swipe gesture to continue.
         */
        if (!expandToScroll && detail.deltaY <= 0 && cachedScrollEl) {
            return;
        }
        /**
         * If we are pulling down, then it is possible we are pulling on the content.
         * We do not want scrolling to happen at the same time as the gesture.
         * This accounts for when the user scrolls down, scrolls all the way up, and then
         * pulls down again such that the modal should start to move.
         */
        if (detail.deltaY > 0 && contentEl) {
            contentEl.scrollY = false;
        }
        /**
         * Given the change in gesture position on the Y axis,
         * compute where the offset of the animation should be
         * relative to where the user dragged.
         */
        const initialStep = 1 - currentBreakpoint;
        const secondToLastBreakpoint = breakpoints.length > 1 ? 1 - breakpoints[1] : undefined;
        const step = initialStep + detail.deltaY / height;
        const isAttemptingDismissWithCanDismiss = secondToLastBreakpoint !== undefined && step >= secondToLastBreakpoint && canDismissBlocksGesture;
        /**
         * If we are blocking the gesture from dismissing,
         * set the max step value so that the sheet cannot be
         * completely hidden.
         */
        const maxStep = isAttemptingDismissWithCanDismiss ? canDismissMaxStep : 0.9999;
        /**
         * If we are blocking the gesture from
         * dismissing, calculate the spring modifier value
         * this will be added to the starting breakpoint
         * value to give the gesture a spring-like feeling.
         * Note that when isAttemptingDismissWithCanDismiss is true,
         * the modifier is always added to the breakpoint that
         * appears right after the 0 breakpoint.
         *
         * Note that this modifier is essentially the progression
         * between secondToLastBreakpoint and maxStep which is
         * why we subtract secondToLastBreakpoint. This lets us get
         * the result as a value from 0 to 1.
         */
        const processedStep = isAttemptingDismissWithCanDismiss && secondToLastBreakpoint !== undefined
            ? secondToLastBreakpoint +
                calculateSpringStep((step - secondToLastBreakpoint) / (maxStep - secondToLastBreakpoint))
            : step;
        offset = clamp(0.0001, processedStep, maxStep);
        animation.progressStep(offset);
    };
    const onEnd = (detail) => {
        /**
         * If expandToScroll is disabled, we should not allow the moveSheetToBreakpoint
         * function to be called if the user is trying to swipe content upwards and the content
         * is not scrolled to the top.
         */
        if (!expandToScroll && detail.deltaY <= 0 && cachedScrollEl && cachedScrollEl.scrollTop > 0) {
            return;
        }
        /**
         * When the gesture releases, we need to determine
         * the closest breakpoint to snap to.
         */
        const velocity = detail.velocityY;
        const threshold = (detail.deltaY + velocity * 350) / height;
        const diff = currentBreakpoint - threshold;
        const closest = breakpoints.reduce((a, b) => {
            return Math.abs(b - diff) < Math.abs(a - diff) ? b : a;
        });
        moveSheetToBreakpoint({
            breakpoint: closest,
            breakpointOffset: offset,
            canDismiss: canDismissBlocksGesture,
            /**
             * The swipe is user-driven, so we should
             * always animate when the gesture ends.
             */
            animated: true,
        });
    };
    const moveSheetToBreakpoint = (options) => {
        const { breakpoint, canDismiss, breakpointOffset, animated } = options;
        /**
         * canDismiss should only prevent snapping
         * when users are trying to dismiss. If canDismiss
         * is present but the user is trying to swipe upwards,
         * we should allow that to happen,
         */
        const shouldPreventDismiss = canDismiss && breakpoint === 0;
        const snapToBreakpoint = shouldPreventDismiss ? currentBreakpoint : breakpoint;
        const shouldRemainOpen = snapToBreakpoint !== 0;
        currentBreakpoint = 0;
        /**
         * Update the animation so that it plays from
         * the last offset to the closest snap point.
         */
        if (wrapperAnimation && backdropAnimation) {
            wrapperAnimation.keyframes([
                { offset: 0, transform: `translateY(${breakpointOffset * 100}%)` },
                { offset: 1, transform: `translateY(${(1 - snapToBreakpoint) * 100}%)` },
            ]);
            backdropAnimation.keyframes([
                {
                    offset: 0,
                    opacity: `calc(var(--backdrop-opacity) * ${getBackdropValueForSheet(1 - breakpointOffset, backdropBreakpoint)})`,
                },
                {
                    offset: 1,
                    opacity: `calc(var(--backdrop-opacity) * ${getBackdropValueForSheet(snapToBreakpoint, backdropBreakpoint)})`,
                },
            ]);
            if (contentAnimation) {
                /**
                 * The modal content should scroll at any breakpoint when expandToScroll
                 * is disabled. In order to do this, the content needs to be completely
                 * viewable so scrolling can access everything. Otherwise, the default
                 * behavior would show the content off the screen and only allow
                 * scrolling when the sheet is fully expanded.
                 */
                contentAnimation.keyframes([
                    { offset: 0, maxHeight: `${(1 - breakpointOffset) * 100}%` },
                    { offset: 1, maxHeight: `${snapToBreakpoint * 100}%` },
                ]);
            }
            animation.progressStep(0);
        }
        /**
         * Gesture should remain disabled until the
         * snapping animation completes.
         */
        gesture.enable(false);
        if (shouldPreventDismiss) {
            handleCanDismiss(baseEl, animation);
        }
        else if (!shouldRemainOpen) {
            onDismiss();
        }
        /**
         * Enables scrolling immediately if the sheet is about to fully expand
         * or if it allows scrolling at any breakpoint. Without this, there would
         * be a ~500ms delay while the modal animation completes, causing a
         * noticeable lag. Native iOS allows scrolling as soon as the gesture is
         * released, so we align with that behavior.
         */
        if (contentEl && (snapToBreakpoint === breakpoints[breakpoints.length - 1] || !expandToScroll)) {
            contentEl.scrollY = true;
        }
        /**
         * If expandToScroll is disabled and we're animating
         * to close the sheet, we need to swap
         * the footer position to stationary so that it
         * will collapse correctly. We cannot just always swap
         * here or it'll be jittery while animating movement.
         */
        if (!expandToScroll && snapToBreakpoint === 0) {
            swapFooterPosition('stationary');
        }
        return new Promise((resolve) => {
            animation
                .onFinish(() => {
                if (shouldRemainOpen) {
                    /**
                     * If expandToScroll is disabled, we need to swap
                     * the footer position to stationary so that it
                     * will act as it would by default.
                     */
                    if (!expandToScroll) {
                        swapFooterPosition('stationary');
                    }
                    /**
                     * Once the snapping animation completes,
                     * we need to reset the animation to go
                     * from 0 to 1 so users can swipe in any direction.
                     * We then set the animation offset to the current
                     * breakpoint so that it starts at the snapped position.
                     */
                    if (wrapperAnimation && backdropAnimation) {
                        raf(() => {
                            wrapperAnimation.keyframes([...SheetDefaults.WRAPPER_KEYFRAMES]);
                            backdropAnimation.keyframes([...SheetDefaults.BACKDROP_KEYFRAMES]);
                            contentAnimation === null || contentAnimation === void 0 ? void 0 : contentAnimation.keyframes([...SheetDefaults.CONTENT_KEYFRAMES]);
                            animation.progressStart(true, 1 - snapToBreakpoint);
                            currentBreakpoint = snapToBreakpoint;
                            onBreakpointChange(currentBreakpoint);
                            /**
                             * Backdrop should become enabled
                             * after the backdropBreakpoint value
                             */
                            const shouldEnableBackdrop = currentBreakpoint > backdropBreakpoint;
                            if (shouldEnableBackdrop) {
                                enableBackdrop();
                            }
                            else {
                                disableBackdrop();
                            }
                            gesture.enable(true);
                            resolve();
                        });
                    }
                    else {
                        gesture.enable(true);
                        resolve();
                    }
                }
                else {
                    resolve();
                }
                /**
                 * This must be a one time callback
                 * otherwise a new callback will
                 * be added every time onEnd runs.
                 */
            }, { oneTimeCallback: true })
                .progressEnd(1, 0, animated ? 500 : 0);
        });
    };
    const gesture = createGesture({
        el: wrapperEl,
        gestureName: 'modalSheet',
        gesturePriority: 40,
        direction: 'y',
        threshold: 10,
        canStart,
        onStart,
        onMove,
        onEnd,
    });
    return {
        gesture,
        moveSheetToBreakpoint,
    };
};

const modalIosCss = ":host{--width:100%;--min-width:auto;--max-width:auto;--height:100%;--min-height:auto;--max-height:auto;--overflow:hidden;--border-radius:0;--border-width:0;--border-style:none;--border-color:transparent;--background:var(--ion-background-color, #fff);--box-shadow:none;--backdrop-opacity:0;left:0;right:0;top:0;bottom:0;display:-ms-flexbox;display:flex;position:absolute;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;outline:none;color:var(--ion-text-color, #000);contain:strict}.modal-wrapper,ion-backdrop{pointer-events:auto}:host(.overlay-hidden){display:none}.modal-wrapper,.modal-shadow{border-radius:var(--border-radius);width:var(--width);min-width:var(--min-width);max-width:var(--max-width);height:var(--height);min-height:var(--min-height);max-height:var(--max-height);border-width:var(--border-width);border-style:var(--border-style);border-color:var(--border-color);background:var(--background);-webkit-box-shadow:var(--box-shadow);box-shadow:var(--box-shadow);overflow:var(--overflow);z-index:10}.modal-shadow{position:absolute;background:transparent}@media only screen and (min-width: 768px) and (min-height: 600px){:host{--width:600px;--height:500px;--ion-safe-area-top:0px;--ion-safe-area-bottom:0px;--ion-safe-area-right:0px;--ion-safe-area-left:0px}}@media only screen and (min-width: 768px) and (min-height: 768px){:host{--width:600px;--height:600px}}.modal-handle{left:0px;right:0px;top:5px;border-radius:8px;-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;position:absolute;width:36px;height:5px;-webkit-transform:translateZ(0);transform:translateZ(0);border:0;background:var(--ion-color-step-350, var(--ion-background-color-step-350, #c0c0be));cursor:pointer;z-index:11}.modal-handle::before{-webkit-padding-start:4px;padding-inline-start:4px;-webkit-padding-end:4px;padding-inline-end:4px;padding-top:4px;padding-bottom:4px;position:absolute;width:36px;height:5px;-webkit-transform:translate(-50%, -50%);transform:translate(-50%, -50%);content:\"\"}:host(.modal-sheet){--height:calc(100% - (var(--ion-safe-area-top) + 10px))}:host(.modal-sheet) .modal-wrapper,:host(.modal-sheet) .modal-shadow{position:absolute;bottom:0}:host(.modal-sheet.modal-no-expand-scroll) ion-footer{position:absolute;bottom:0;width:var(--width)}:host{--backdrop-opacity:var(--ion-backdrop-opacity, 0.4)}:host(.modal-card),:host(.modal-sheet){--border-radius:10px}@media only screen and (min-width: 768px) and (min-height: 600px){:host{--border-radius:10px}}.modal-wrapper{-webkit-transform:translate3d(0,  100%,  0);transform:translate3d(0,  100%,  0)}@media screen and (max-width: 767px){@supports (width: max(0px, 1px)){:host(.modal-card){--height:calc(100% - max(30px, var(--ion-safe-area-top)) - 10px)}}@supports not (width: max(0px, 1px)){:host(.modal-card){--height:calc(100% - 40px)}}:host(.modal-card) .modal-wrapper{border-start-start-radius:var(--border-radius);border-start-end-radius:var(--border-radius);border-end-end-radius:0;border-end-start-radius:0}:host(.modal-card){--backdrop-opacity:0;--width:100%;-ms-flex-align:end;align-items:flex-end}:host(.modal-card) .modal-shadow{display:none}:host(.modal-card) ion-backdrop{pointer-events:none}}@media screen and (min-width: 768px){:host(.modal-card){--width:calc(100% - 120px);--height:calc(100% - (120px + var(--ion-safe-area-top) + var(--ion-safe-area-bottom)));--max-width:720px;--max-height:1000px;--backdrop-opacity:0;--box-shadow:0px 0px 30px 10px rgba(0, 0, 0, 0.1);-webkit-transition:all 0.5s ease-in-out;transition:all 0.5s ease-in-out}:host(.modal-card) .modal-wrapper{-webkit-box-shadow:none;box-shadow:none}:host(.modal-card) .modal-shadow{-webkit-box-shadow:var(--box-shadow);box-shadow:var(--box-shadow)}}:host(.modal-sheet) .modal-wrapper{border-start-start-radius:var(--border-radius);border-start-end-radius:var(--border-radius);border-end-end-radius:0;border-end-start-radius:0}";

const modalMdCss = ":host{--width:100%;--min-width:auto;--max-width:auto;--height:100%;--min-height:auto;--max-height:auto;--overflow:hidden;--border-radius:0;--border-width:0;--border-style:none;--border-color:transparent;--background:var(--ion-background-color, #fff);--box-shadow:none;--backdrop-opacity:0;left:0;right:0;top:0;bottom:0;display:-ms-flexbox;display:flex;position:absolute;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;outline:none;color:var(--ion-text-color, #000);contain:strict}.modal-wrapper,ion-backdrop{pointer-events:auto}:host(.overlay-hidden){display:none}.modal-wrapper,.modal-shadow{border-radius:var(--border-radius);width:var(--width);min-width:var(--min-width);max-width:var(--max-width);height:var(--height);min-height:var(--min-height);max-height:var(--max-height);border-width:var(--border-width);border-style:var(--border-style);border-color:var(--border-color);background:var(--background);-webkit-box-shadow:var(--box-shadow);box-shadow:var(--box-shadow);overflow:var(--overflow);z-index:10}.modal-shadow{position:absolute;background:transparent}@media only screen and (min-width: 768px) and (min-height: 600px){:host{--width:600px;--height:500px;--ion-safe-area-top:0px;--ion-safe-area-bottom:0px;--ion-safe-area-right:0px;--ion-safe-area-left:0px}}@media only screen and (min-width: 768px) and (min-height: 768px){:host{--width:600px;--height:600px}}.modal-handle{left:0px;right:0px;top:5px;border-radius:8px;-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;position:absolute;width:36px;height:5px;-webkit-transform:translateZ(0);transform:translateZ(0);border:0;background:var(--ion-color-step-350, var(--ion-background-color-step-350, #c0c0be));cursor:pointer;z-index:11}.modal-handle::before{-webkit-padding-start:4px;padding-inline-start:4px;-webkit-padding-end:4px;padding-inline-end:4px;padding-top:4px;padding-bottom:4px;position:absolute;width:36px;height:5px;-webkit-transform:translate(-50%, -50%);transform:translate(-50%, -50%);content:\"\"}:host(.modal-sheet){--height:calc(100% - (var(--ion-safe-area-top) + 10px))}:host(.modal-sheet) .modal-wrapper,:host(.modal-sheet) .modal-shadow{position:absolute;bottom:0}:host(.modal-sheet.modal-no-expand-scroll) ion-footer{position:absolute;bottom:0;width:var(--width)}:host{--backdrop-opacity:var(--ion-backdrop-opacity, 0.32)}@media only screen and (min-width: 768px) and (min-height: 600px){:host{--border-radius:2px;--box-shadow:0 28px 48px rgba(0, 0, 0, 0.4)}}.modal-wrapper{-webkit-transform:translate3d(0,  40px,  0);transform:translate3d(0,  40px,  0);opacity:0.01}";

const Modal = /*@__PURE__*/ proxyCustomElement(class Modal extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.didPresent = createEvent(this, "ionModalDidPresent", 7);
        this.willPresent = createEvent(this, "ionModalWillPresent", 7);
        this.willDismiss = createEvent(this, "ionModalWillDismiss", 7);
        this.didDismiss = createEvent(this, "ionModalDidDismiss", 7);
        this.ionBreakpointDidChange = createEvent(this, "ionBreakpointDidChange", 7);
        this.didPresentShorthand = createEvent(this, "didPresent", 7);
        this.willPresentShorthand = createEvent(this, "willPresent", 7);
        this.willDismissShorthand = createEvent(this, "willDismiss", 7);
        this.didDismissShorthand = createEvent(this, "didDismiss", 7);
        this.ionMount = createEvent(this, "ionMount", 7);
        this.lockController = createLockController();
        this.triggerController = createTriggerController();
        this.coreDelegate = CoreDelegate();
        this.isSheetModal = false;
        this.inheritedAttributes = {};
        this.inline = false;
        // Whether or not modal is being dismissed via gesture
        this.gestureAnimationDismissing = false;
        this.presented = false;
        /** @internal */
        this.hasController = false;
        /**
         * If `true`, the keyboard will be automatically dismissed when the overlay is presented.
         */
        this.keyboardClose = true;
        /**
         * Controls whether scrolling or dragging within the sheet modal expands
         * it to a larger breakpoint. This only takes effect when `breakpoints`
         * and `initialBreakpoint` are set.
         *
         * If `true`, scrolling or dragging anywhere in the modal will first expand
         * it to the next breakpoint. Once fully expanded, scrolling will affect the
         * content.
         * If `false`, scrolling will always affect the content. The modal will
         * only expand when dragging the header or handle. The modal will close when
         * dragging the header or handle. It can also be closed when dragging the
         * content, but only if the content is scrolled to the top.
         */
        this.expandToScroll = true;
        /**
         * A decimal value between 0 and 1 that indicates the
         * point after which the backdrop will begin to fade in
         * when using a sheet modal. Prior to this point, the
         * backdrop will be hidden and the content underneath
         * the sheet can be interacted with. This value is exclusive
         * meaning the backdrop will become active after the value
         * specified.
         */
        this.backdropBreakpoint = 0;
        /**
         * The interaction behavior for the sheet modal when the handle is pressed.
         *
         * Defaults to `"none"`, which  means the modal will not change size or position when the handle is pressed.
         * Set to `"cycle"` to let the modal cycle between available breakpoints when pressed.
         *
         * Handle behavior is unavailable when the `handle` property is set to `false` or
         * when the `breakpoints` property is not set (using a fullscreen or card modal).
         */
        this.handleBehavior = 'none';
        /**
         * If `true`, the modal will be dismissed when the backdrop is clicked.
         */
        this.backdropDismiss = true;
        /**
         * If `true`, a backdrop will be displayed behind the modal.
         * This property controls whether or not the backdrop
         * darkens the screen when the modal is presented.
         * It does not control whether or not the backdrop
         * is active or present in the DOM.
         */
        this.showBackdrop = true;
        /**
         * If `true`, the modal will animate.
         */
        this.animated = true;
        /**
         * If `true`, the modal will open. If `false`, the modal will close.
         * Use this if you need finer grained control over presentation, otherwise
         * just use the modalController or the `trigger` property.
         * Note: `isOpen` will not automatically be set back to `false` when
         * the modal dismisses. You will need to do that in your code.
         */
        this.isOpen = false;
        /**
         * If `true`, the component passed into `ion-modal` will
         * automatically be mounted when the modal is created. The
         * component will remain mounted even when the modal is dismissed.
         * However, the component will be destroyed when the modal is
         * destroyed. This property is not reactive and should only be
         * used when initially creating a modal.
         *
         * Note: This feature only applies to inline modals in JavaScript
         * frameworks such as Angular, React, and Vue.
         */
        this.keepContentsMounted = false;
        /**
         * If `true`, focus will not be allowed to move outside of this overlay.
         * If `false`, focus will be allowed to move outside of the overlay.
         *
         * In most scenarios this property should remain set to `true`. Setting
         * this property to `false` can cause severe accessibility issues as users
         * relying on assistive technologies may be able to move focus into
         * a confusing state. We recommend only setting this to `false` when
         * absolutely necessary.
         *
         * Developers may want to consider disabling focus trapping if this
         * overlay presents a non-Ionic overlay from a 3rd party library.
         * Developers would disable focus trapping on the Ionic overlay
         * when presenting the 3rd party overlay and then re-enable
         * focus trapping when dismissing the 3rd party overlay and moving
         * focus back to the Ionic overlay.
         */
        this.focusTrap = true;
        /**
         * Determines whether or not a modal can dismiss
         * when calling the `dismiss` method.
         *
         * If the value is `true` or the value's function returns `true`, the modal will close when trying to dismiss.
         * If the value is `false` or the value's function returns `false`, the modal will not close when trying to dismiss.
         *
         * See https://ionicframework.com/docs/troubleshooting/runtime#accessing-this
         * if you need to access `this` from within the callback.
         */
        this.canDismiss = true;
        this.onHandleClick = () => {
            const { sheetTransition, handleBehavior } = this;
            if (handleBehavior !== 'cycle' || sheetTransition !== undefined) {
                /**
                 * The sheet modal should not advance to the next breakpoint
                 * if the handle behavior is not `cycle` or if the handle
                 * is clicked while the sheet is moving to a breakpoint.
                 */
                return;
            }
            this.moveToNextBreakpoint();
        };
        this.onBackdropTap = () => {
            const { sheetTransition } = this;
            if (sheetTransition !== undefined) {
                /**
                 * When the handle is double clicked at the largest breakpoint,
                 * it will start to move to the first breakpoint. While transitioning,
                 * the backdrop will often receive the second click. We prevent the
                 * backdrop from dismissing the modal while moving between breakpoints.
                 */
                return;
            }
            this.dismiss(undefined, BACKDROP);
        };
        this.onLifecycle = (modalEvent) => {
            const el = this.usersElement;
            const name = LIFECYCLE_MAP[modalEvent.type];
            if (el && name) {
                const ev = new CustomEvent(name, {
                    bubbles: false,
                    cancelable: false,
                    detail: modalEvent.detail,
                });
                el.dispatchEvent(ev);
            }
        };
    }
    onIsOpenChange(newValue, oldValue) {
        if (newValue === true && oldValue === false) {
            this.present();
        }
        else if (newValue === false && oldValue === true) {
            this.dismiss();
        }
    }
    triggerChanged() {
        const { trigger, el, triggerController } = this;
        if (trigger) {
            triggerController.addClickListener(el, trigger);
        }
    }
    breakpointsChanged(breakpoints) {
        if (breakpoints !== undefined) {
            this.sortedBreakpoints = breakpoints.sort((a, b) => a - b);
        }
    }
    connectedCallback() {
        const { el } = this;
        prepareOverlay(el);
        this.triggerChanged();
    }
    disconnectedCallback() {
        this.triggerController.removeClickListener();
    }
    componentWillLoad() {
        var _a;
        const { breakpoints, initialBreakpoint, el, htmlAttributes } = this;
        const isSheetModal = (this.isSheetModal = breakpoints !== undefined && initialBreakpoint !== undefined);
        const attributesToInherit = ['aria-label', 'role'];
        this.inheritedAttributes = inheritAttributes(el, attributesToInherit);
        /**
         * When using a controller modal you can set attributes
         * using the htmlAttributes property. Since the above attributes
         * need to be inherited inside of the modal, we need to look
         * and see if these attributes are being set via htmlAttributes.
         *
         * We could alternatively move this to componentDidLoad to simplify the work
         * here, but we'd then need to make inheritedAttributes a State variable,
         * thus causing another render to always happen after the first render.
         */
        if (htmlAttributes !== undefined) {
            attributesToInherit.forEach((attribute) => {
                const attributeValue = htmlAttributes[attribute];
                if (attributeValue) {
                    /**
                     * If an attribute we need to inherit was
                     * set using htmlAttributes then add it to
                     * inheritedAttributes and remove it from htmlAttributes.
                     * This ensures the attribute is inherited and not
                     * set on the host.
                     *
                     * In this case, if an inherited attribute is set
                     * on the host element and using htmlAttributes then
                     * htmlAttributes wins, but that's not a pattern that we recommend.
                     * The only time you'd need htmlAttributes is when using modalController.
                     */
                    this.inheritedAttributes = Object.assign(Object.assign({}, this.inheritedAttributes), { [attribute]: htmlAttributes[attribute] });
                    delete htmlAttributes[attribute];
                }
            });
        }
        if (isSheetModal) {
            this.currentBreakpoint = this.initialBreakpoint;
        }
        if (breakpoints !== undefined && initialBreakpoint !== undefined && !breakpoints.includes(initialBreakpoint)) {
            printIonWarning('[ion-modal] - Your breakpoints array must include the initialBreakpoint value.');
        }
        if (!((_a = this.htmlAttributes) === null || _a === void 0 ? void 0 : _a.id)) {
            setOverlayId(this.el);
        }
    }
    componentDidLoad() {
        /**
         * If modal was rendered with isOpen="true"
         * then we should open modal immediately.
         */
        if (this.isOpen === true) {
            raf(() => this.present());
        }
        this.breakpointsChanged(this.breakpoints);
        /**
         * When binding values in frameworks such as Angular
         * it is possible for the value to be set after the Web Component
         * initializes but before the value watcher is set up in Stencil.
         * As a result, the watcher callback may not be fired.
         * We work around this by manually calling the watcher
         * callback when the component has loaded and the watcher
         * is configured.
         */
        this.triggerChanged();
    }
    /**
     * Determines whether or not an overlay
     * is being used inline or via a controller/JS
     * and returns the correct delegate.
     * By default, subsequent calls to getDelegate
     * will use a cached version of the delegate.
     * This is useful for calling dismiss after
     * present so that the correct delegate is given.
     */
    getDelegate(force = false) {
        if (this.workingDelegate && !force) {
            return {
                delegate: this.workingDelegate,
                inline: this.inline,
            };
        }
        /**
         * If using overlay inline
         * we potentially need to use the coreDelegate
         * so that this works in vanilla JS apps.
         * If a developer has presented this component
         * via a controller, then we can assume
         * the component is already in the
         * correct place.
         */
        const parentEl = this.el.parentNode;
        const inline = (this.inline = parentEl !== null && !this.hasController);
        const delegate = (this.workingDelegate = inline ? this.delegate || this.coreDelegate : this.delegate);
        return { inline, delegate };
    }
    /**
     * Determines whether or not the
     * modal is allowed to dismiss based
     * on the state of the canDismiss prop.
     */
    async checkCanDismiss(data, role) {
        const { canDismiss } = this;
        if (typeof canDismiss === 'function') {
            return canDismiss(data, role);
        }
        return canDismiss;
    }
    /**
     * Present the modal overlay after it has been created.
     */
    async present() {
        const unlock = await this.lockController.lock();
        if (this.presented) {
            unlock();
            return;
        }
        const { presentingElement, el } = this;
        /**
         * If the modal is presented multiple times (inline modals), we
         * need to reset the current breakpoint to the initial breakpoint.
         */
        this.currentBreakpoint = this.initialBreakpoint;
        const { inline, delegate } = this.getDelegate(true);
        /**
         * Emit ionMount so JS Frameworks have an opportunity
         * to add the child component to the DOM. The child
         * component will be assigned to this.usersElement below.
         */
        this.ionMount.emit();
        this.usersElement = await attachComponent(delegate, el, this.component, ['ion-page'], this.componentProps, inline);
        /**
         * When using the lazy loaded build of Stencil, we need to wait
         * for every Stencil component instance to be ready before presenting
         * otherwise there can be a flash of unstyled content. With the
         * custom elements bundle we need to wait for the JS framework
         * mount the inner contents of the overlay otherwise WebKit may
         * get the transition incorrect.
         */
        if (hasLazyBuild(el)) {
            await deepReady(this.usersElement);
            /**
             * If keepContentsMounted="true" then the
             * JS Framework has already mounted the inner
             * contents so there is no need to wait.
             * Otherwise, we need to wait for the JS
             * Framework to mount the inner contents
             * of this component.
             */
        }
        else if (!this.keepContentsMounted) {
            await waitForMount();
        }
        writeTask(() => this.el.classList.add('show-modal'));
        const hasCardModal = presentingElement !== undefined;
        /**
         * We need to change the status bar at the
         * start of the animation so that it completes
         * by the time the card animation is done.
         */
        if (hasCardModal && getIonMode(this) === 'ios') {
            // Cache the original status bar color before the modal is presented
            this.statusBarStyle = await StatusBar.getStyle();
            setCardStatusBarDark();
        }
        await present(this, 'modalEnter', iosEnterAnimation, mdEnterAnimation, {
            presentingEl: presentingElement,
            currentBreakpoint: this.initialBreakpoint,
            backdropBreakpoint: this.backdropBreakpoint,
            expandToScroll: this.expandToScroll,
        });
        /* tslint:disable-next-line */
        if (typeof window !== 'undefined') {
            /**
             * This needs to be setup before any
             * non-transition async work so it can be dereferenced
             * in the dismiss method. The dismiss method
             * only waits for the entering transition
             * to finish. It does not wait for all of the `present`
             * method to resolve.
             */
            this.keyboardOpenCallback = () => {
                if (this.gesture) {
                    /**
                     * When the native keyboard is opened and the webview
                     * is resized, the gesture implementation will become unresponsive
                     * and enter a free-scroll mode.
                     *
                     * When the keyboard is opened, we disable the gesture for
                     * a single frame and re-enable once the contents have repositioned
                     * from the keyboard placement.
                     */
                    this.gesture.enable(false);
                    raf(() => {
                        if (this.gesture) {
                            this.gesture.enable(true);
                        }
                    });
                }
            };
            window.addEventListener(KEYBOARD_DID_OPEN, this.keyboardOpenCallback);
        }
        if (this.isSheetModal) {
            this.initSheetGesture();
        }
        else if (hasCardModal) {
            this.initSwipeToClose();
        }
        unlock();
    }
    initSwipeToClose() {
        var _a;
        if (getIonMode(this) !== 'ios') {
            return;
        }
        const { el } = this;
        // All of the elements needed for the swipe gesture
        // should be in the DOM and referenced by now, except
        // for the presenting el
        const animationBuilder = this.leaveAnimation || config.get('modalLeave', iosLeaveAnimation);
        const ani = (this.animation = animationBuilder(el, {
            presentingEl: this.presentingElement,
            expandToScroll: this.expandToScroll,
        }));
        const contentEl = findIonContent(el);
        if (!contentEl) {
            printIonContentErrorMsg(el);
            return;
        }
        const statusBarStyle = (_a = this.statusBarStyle) !== null && _a !== void 0 ? _a : Style.Default;
        this.gesture = createSwipeToCloseGesture(el, ani, statusBarStyle, () => {
            /**
             * While the gesture animation is finishing
             * it is possible for a user to tap the backdrop.
             * This would result in the dismiss animation
             * being played again. Typically this is avoided
             * by setting `presented = false` on the overlay
             * component; however, we cannot do that here as
             * that would prevent the element from being
             * removed from the DOM.
             */
            this.gestureAnimationDismissing = true;
            /**
             * Reset the status bar style as the dismiss animation
             * starts otherwise the status bar will be the wrong
             * color for the duration of the dismiss animation.
             * The dismiss method does this as well, but
             * in this case it's only called once the animation
             * has finished.
             */
            setCardStatusBarDefault(this.statusBarStyle);
            this.animation.onFinish(async () => {
                await this.dismiss(undefined, GESTURE);
                this.gestureAnimationDismissing = false;
            });
        });
        this.gesture.enable(true);
    }
    initSheetGesture() {
        const { wrapperEl, initialBreakpoint, backdropBreakpoint } = this;
        if (!wrapperEl || initialBreakpoint === undefined) {
            return;
        }
        const animationBuilder = this.enterAnimation || config.get('modalEnter', iosEnterAnimation);
        const ani = (this.animation = animationBuilder(this.el, {
            presentingEl: this.presentingElement,
            currentBreakpoint: initialBreakpoint,
            backdropBreakpoint,
            expandToScroll: this.expandToScroll,
        }));
        ani.progressStart(true, 1);
        const { gesture, moveSheetToBreakpoint } = createSheetGesture(this.el, this.backdropEl, wrapperEl, initialBreakpoint, backdropBreakpoint, ani, this.sortedBreakpoints, this.expandToScroll, () => { var _a; return (_a = this.currentBreakpoint) !== null && _a !== void 0 ? _a : 0; }, () => this.sheetOnDismiss(), (breakpoint) => {
            if (this.currentBreakpoint !== breakpoint) {
                this.currentBreakpoint = breakpoint;
                this.ionBreakpointDidChange.emit({ breakpoint });
            }
        });
        this.gesture = gesture;
        this.moveSheetToBreakpoint = moveSheetToBreakpoint;
        this.gesture.enable(true);
    }
    sheetOnDismiss() {
        /**
         * While the gesture animation is finishing
         * it is possible for a user to tap the backdrop.
         * This would result in the dismiss animation
         * being played again. Typically this is avoided
         * by setting `presented = false` on the overlay
         * component; however, we cannot do that here as
         * that would prevent the element from being
         * removed from the DOM.
         */
        this.gestureAnimationDismissing = true;
        this.animation.onFinish(async () => {
            this.currentBreakpoint = 0;
            this.ionBreakpointDidChange.emit({ breakpoint: this.currentBreakpoint });
            await this.dismiss(undefined, GESTURE);
            this.gestureAnimationDismissing = false;
        });
    }
    /**
     * Dismiss the modal overlay after it has been presented.
     *
     * @param data Any data to emit in the dismiss events.
     * @param role The role of the element that is dismissing the modal. For example, 'cancel' or 'backdrop'.
     *
     * This is a no-op if the overlay has not been presented yet. If you want
     * to remove an overlay from the DOM that was never presented, use the
     * [remove](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove) method.
     */
    async dismiss(data, role) {
        var _a;
        if (this.gestureAnimationDismissing && role !== GESTURE) {
            return false;
        }
        /**
         * Because the canDismiss check below is async,
         * we need to claim a lock before the check happens,
         * in case the dismiss transition does run.
         */
        const unlock = await this.lockController.lock();
        /**
         * If a canDismiss handler is responsible
         * for calling the dismiss method, we should
         * not run the canDismiss check again.
         */
        if (role !== 'handler' && !(await this.checkCanDismiss(data, role))) {
            unlock();
            return false;
        }
        const { presentingElement } = this;
        /**
         * We need to start the status bar change
         * before the animation so that the change
         * finishes when the dismiss animation does.
         */
        const hasCardModal = presentingElement !== undefined;
        if (hasCardModal && getIonMode(this) === 'ios') {
            setCardStatusBarDefault(this.statusBarStyle);
        }
        /* tslint:disable-next-line */
        if (typeof window !== 'undefined' && this.keyboardOpenCallback) {
            window.removeEventListener(KEYBOARD_DID_OPEN, this.keyboardOpenCallback);
            this.keyboardOpenCallback = undefined;
        }
        const dismissed = await dismiss(this, data, role, 'modalLeave', iosLeaveAnimation, mdLeaveAnimation, {
            presentingEl: presentingElement,
            currentBreakpoint: (_a = this.currentBreakpoint) !== null && _a !== void 0 ? _a : this.initialBreakpoint,
            backdropBreakpoint: this.backdropBreakpoint,
            expandToScroll: this.expandToScroll,
        });
        if (dismissed) {
            const { delegate } = this.getDelegate();
            await detachComponent(delegate, this.usersElement);
            writeTask(() => this.el.classList.remove('show-modal'));
            if (this.animation) {
                this.animation.destroy();
            }
            if (this.gesture) {
                this.gesture.destroy();
            }
        }
        this.currentBreakpoint = undefined;
        this.animation = undefined;
        unlock();
        return dismissed;
    }
    /**
     * Returns a promise that resolves when the modal did dismiss.
     */
    onDidDismiss() {
        return eventMethod(this.el, 'ionModalDidDismiss');
    }
    /**
     * Returns a promise that resolves when the modal will dismiss.
     */
    onWillDismiss() {
        return eventMethod(this.el, 'ionModalWillDismiss');
    }
    /**
     * Move a sheet style modal to a specific breakpoint. The breakpoint value must
     * be a value defined in your `breakpoints` array.
     */
    async setCurrentBreakpoint(breakpoint) {
        if (!this.isSheetModal) {
            printIonWarning('[ion-modal] - setCurrentBreakpoint is only supported on sheet modals.');
            return;
        }
        if (!this.breakpoints.includes(breakpoint)) {
            printIonWarning(`[ion-modal] - Attempted to set invalid breakpoint value ${breakpoint}. Please double check that the breakpoint value is part of your defined breakpoints.`);
            return;
        }
        const { currentBreakpoint, moveSheetToBreakpoint, canDismiss, breakpoints, animated } = this;
        if (currentBreakpoint === breakpoint) {
            return;
        }
        if (moveSheetToBreakpoint) {
            this.sheetTransition = moveSheetToBreakpoint({
                breakpoint,
                breakpointOffset: 1 - currentBreakpoint,
                canDismiss: canDismiss !== undefined && canDismiss !== true && breakpoints[0] === 0,
                animated,
            });
            await this.sheetTransition;
            this.sheetTransition = undefined;
        }
    }
    /**
     * Returns the current breakpoint of a sheet style modal
     */
    async getCurrentBreakpoint() {
        return this.currentBreakpoint;
    }
    async moveToNextBreakpoint() {
        const { breakpoints, currentBreakpoint } = this;
        if (!breakpoints || currentBreakpoint == null) {
            /**
             * If the modal does not have breakpoints and/or the current
             * breakpoint is not set, we can't move to the next breakpoint.
             */
            return false;
        }
        const allowedBreakpoints = breakpoints.filter((b) => b !== 0);
        const currentBreakpointIndex = allowedBreakpoints.indexOf(currentBreakpoint);
        const nextBreakpointIndex = (currentBreakpointIndex + 1) % allowedBreakpoints.length;
        const nextBreakpoint = allowedBreakpoints[nextBreakpointIndex];
        /**
         * Sets the current breakpoint to the next available breakpoint.
         * If the current breakpoint is the last breakpoint, we set the current
         * breakpoint to the first non-zero breakpoint to avoid dismissing the sheet.
         */
        await this.setCurrentBreakpoint(nextBreakpoint);
        return true;
    }
    render() {
        const { handle, isSheetModal, presentingElement, htmlAttributes, handleBehavior, inheritedAttributes, focusTrap, expandToScroll, } = this;
        const showHandle = handle !== false && isSheetModal;
        const mode = getIonMode(this);
        const isCardModal = presentingElement !== undefined && mode === 'ios';
        const isHandleCycle = handleBehavior === 'cycle';
        return (h(Host, Object.assign({ key: '0bcbdcfcd7d890eb599da3f97f21c317d34f8e0e', "no-router": true, tabindex: "-1" }, htmlAttributes, { style: {
                zIndex: `${20000 + this.overlayIndex}`,
            }, class: Object.assign({ [mode]: true, ['modal-default']: !isCardModal && !isSheetModal, [`modal-card`]: isCardModal, [`modal-sheet`]: isSheetModal, [`modal-no-expand-scroll`]: isSheetModal && !expandToScroll, 'overlay-hidden': true, [FOCUS_TRAP_DISABLE_CLASS]: focusTrap === false }, getClassMap(this.cssClass)), onIonBackdropTap: this.onBackdropTap, onIonModalDidPresent: this.onLifecycle, onIonModalWillPresent: this.onLifecycle, onIonModalWillDismiss: this.onLifecycle, onIonModalDidDismiss: this.onLifecycle }), h("ion-backdrop", { key: 'd72159e73daa5af7349aa9e8f695aa435eb43069', ref: (el) => (this.backdropEl = el), visible: this.showBackdrop, tappable: this.backdropDismiss, part: "backdrop" }), mode === 'ios' && h("div", { key: 'fd2d9b13676ae72473881649a397b6eacde03a03', class: "modal-shadow" }), h("div", Object.assign({ key: '908eccb1ad982dcde2dbcff0cbb18b6e60f8ba74',
            /*
              role and aria-modal must be used on the
              same element. They must also be set inside the
              shadow DOM otherwise ion-button will not be highlighted
              when using VoiceOver: https://bugs.webkit.org/show_bug.cgi?id=247134
            */
            role: "dialog" }, inheritedAttributes, { "aria-modal": "true", class: "modal-wrapper ion-overlay-wrapper", part: "content", ref: (el) => (this.wrapperEl = el) }), showHandle && (h("button", { key: '332dc0b40363a77c7be62331d9f26def91c790e9', class: "modal-handle",
            // Prevents the handle from receiving keyboard focus when it does not cycle
            tabIndex: !isHandleCycle ? -1 : 0, "aria-label": "Activate to adjust the size of the dialog overlaying the screen", onClick: isHandleCycle ? this.onHandleClick : undefined, part: "handle" })), h("slot", { key: 'c32698350193c450327e97049daf8b8d1fda0d0e' }))));
    }
    get el() { return this; }
    static get watchers() { return {
        "isOpen": ["onIsOpenChange"],
        "trigger": ["triggerChanged"]
    }; }
    static get style() { return {
        ios: modalIosCss,
        md: modalMdCss
    }; }
}, [33, "ion-modal", {
        "hasController": [4, "has-controller"],
        "overlayIndex": [2, "overlay-index"],
        "delegate": [16],
        "keyboardClose": [4, "keyboard-close"],
        "enterAnimation": [16, "enter-animation"],
        "leaveAnimation": [16, "leave-animation"],
        "breakpoints": [16],
        "expandToScroll": [4, "expand-to-scroll"],
        "initialBreakpoint": [2, "initial-breakpoint"],
        "backdropBreakpoint": [2, "backdrop-breakpoint"],
        "handle": [4],
        "handleBehavior": [1, "handle-behavior"],
        "component": [1],
        "componentProps": [16, "component-props"],
        "cssClass": [1, "css-class"],
        "backdropDismiss": [4, "backdrop-dismiss"],
        "showBackdrop": [4, "show-backdrop"],
        "animated": [4],
        "presentingElement": [16, "presenting-element"],
        "htmlAttributes": [16, "html-attributes"],
        "isOpen": [4, "is-open"],
        "trigger": [1],
        "keepContentsMounted": [4, "keep-contents-mounted"],
        "focusTrap": [4, "focus-trap"],
        "canDismiss": [4, "can-dismiss"],
        "presented": [32],
        "present": [64],
        "dismiss": [64],
        "onDidDismiss": [64],
        "onWillDismiss": [64],
        "setCurrentBreakpoint": [64],
        "getCurrentBreakpoint": [64]
    }, undefined, {
        "isOpen": ["onIsOpenChange"],
        "trigger": ["triggerChanged"]
    }]);
const LIFECYCLE_MAP = {
    ionModalDidPresent: 'ionViewDidEnter',
    ionModalWillPresent: 'ionViewWillEnter',
    ionModalWillDismiss: 'ionViewWillLeave',
    ionModalDidDismiss: 'ionViewDidLeave',
};
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-modal", "ion-backdrop"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-modal":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Modal);
            }
            break;
        case "ion-backdrop":
            if (!customElements.get(tagName)) {
                defineCustomElement$1();
            }
            break;
    } });
}

export { Modal as M, defineCustomElement as d };
