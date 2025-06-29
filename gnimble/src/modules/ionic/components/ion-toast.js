/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { Build, proxyCustomElement, HTMLElement, createEvent, h, Host } from '@stencil/core/internal/client';
import { E as ENABLE_HTML_CONTENT_DEFAULT, a as sanitizeDOMString } from './config.js';
import { g as getElementRoot, r as raf } from './helpers.js';
import { c as createLockController } from './lock-controller.js';
import { p as printIonWarning, c as config, a as printIonError } from './index4.js';
import { O as OVERLAY_GESTURE_PRIORITY, d as createDelegateController, e as createTriggerController, i as isCancel, j as prepareOverlay, k as setOverlayId, f as present, g as dismiss, h as eventMethod, s as safeCall, G as GESTURE } from './overlays.js';
import { c as createColorClasses, g as getClassMap } from './theme.js';
import { b as getIonMode } from './ionic-global.js';
import { c as createAnimation } from './animation.js';
import { w as win } from './index9.js';
import { createGesture } from './index3.js';
import { d as defineCustomElement$3 } from './icon.js';
import { d as defineCustomElement$2 } from './ripple-effect.js';

/**
 * Calculate the CSS top and bottom position of the toast, to be used
 * as starting points for the animation keyframes.
 *
 * The default animations for both MD and iOS
 * use translateY, which calculates from the
 * top edge of the screen. This behavior impacts
 * how we compute the offset when a toast has
 * position='bottom' since we need to calculate from
 * the bottom edge of the screen instead.
 *
 * @param position The value of the toast's position prop.
 * @param positionAnchor The element the toast should be anchored to,
 * if applicable.
 * @param mode The toast component's mode (md, ios, etc).
 * @param toast A reference to the toast element itself.
 */
function getAnimationPosition(position, positionAnchor, mode, toast) {
    /**
     * Start with a predefined offset from the edge the toast will be
     * positioned relative to, whether on the screen or anchor element.
     */
    let offset;
    if (mode === 'md') {
        offset = position === 'top' ? 8 : -8;
    }
    else {
        offset = position === 'top' ? 10 : -10;
    }
    /**
     * If positionAnchor is defined, add in the distance from the target
     * screen edge to the target anchor edge. For position="top", the
     * bottom anchor edge is targeted. For position="bottom", the top
     * anchor edge is targeted.
     */
    if (positionAnchor && win) {
        warnIfAnchorIsHidden(positionAnchor, toast);
        const box = positionAnchor.getBoundingClientRect();
        if (position === 'top') {
            offset += box.bottom;
        }
        else if (position === 'bottom') {
            /**
             * Just box.top is the distance from the top edge of the screen
             * to the top edge of the anchor. We want to calculate from the
             * bottom edge of the screen instead.
             */
            offset -= win.innerHeight - box.top;
        }
        /**
         * We don't include safe area here because that should already be
         * accounted for when checking the position of the anchor.
         */
        return {
            top: `${offset}px`,
            bottom: `${offset}px`,
        };
    }
    else {
        return {
            top: `calc(${offset}px + var(--ion-safe-area-top, 0px))`,
            bottom: `calc(${offset}px - var(--ion-safe-area-bottom, 0px))`,
        };
    }
}
/**
 * If the anchor element is hidden, getBoundingClientRect()
 * will return all 0s for it, which can cause unexpected
 * results in the position calculation when animating.
 */
function warnIfAnchorIsHidden(positionAnchor, toast) {
    if (positionAnchor.offsetParent === null) {
        printIonWarning('[ion-toast] - The positionAnchor element for ion-toast was found in the DOM, but appears to be hidden. This may lead to unexpected positioning of the toast.', toast);
    }
}
/**
 * Returns the top offset required to place
 * the toast in the middle of the screen.
 * Only needed when position="toast".
 * @param toastHeight - The height of the ion-toast element
 * @param wrapperHeight - The height of the .toast-wrapper element
 * inside the toast's shadow root.
 */
const getOffsetForMiddlePosition = (toastHeight, wrapperHeight) => {
    return Math.floor(toastHeight / 2 - wrapperHeight / 2);
};

/**
 * iOS Toast Enter Animation
 */
const iosEnterAnimation = (baseEl, opts) => {
    const baseAnimation = createAnimation();
    const wrapperAnimation = createAnimation();
    const { position, top, bottom } = opts;
    const root = getElementRoot(baseEl);
    const wrapperEl = root.querySelector('.toast-wrapper');
    wrapperAnimation.addElement(wrapperEl);
    switch (position) {
        case 'top':
            wrapperAnimation.fromTo('transform', 'translateY(-100%)', `translateY(${top})`);
            break;
        case 'middle':
            const topPosition = getOffsetForMiddlePosition(baseEl.clientHeight, wrapperEl.clientHeight);
            wrapperEl.style.top = `${topPosition}px`;
            wrapperAnimation.fromTo('opacity', 0.01, 1);
            break;
        default:
            wrapperAnimation.fromTo('transform', 'translateY(100%)', `translateY(${bottom})`);
            break;
    }
    return baseAnimation.easing('cubic-bezier(.155,1.105,.295,1.12)').duration(400).addAnimation(wrapperAnimation);
};

/**
 * iOS Toast Leave Animation
 */
const iosLeaveAnimation = (baseEl, opts) => {
    const baseAnimation = createAnimation();
    const wrapperAnimation = createAnimation();
    const { position, top, bottom } = opts;
    const root = getElementRoot(baseEl);
    const wrapperEl = root.querySelector('.toast-wrapper');
    wrapperAnimation.addElement(wrapperEl);
    switch (position) {
        case 'top':
            wrapperAnimation.fromTo('transform', `translateY(${top})`, 'translateY(-100%)');
            break;
        case 'middle':
            wrapperAnimation.fromTo('opacity', 0.99, 0);
            break;
        default:
            wrapperAnimation.fromTo('transform', `translateY(${bottom})`, 'translateY(100%)');
            break;
    }
    return baseAnimation.easing('cubic-bezier(.36,.66,.04,1)').duration(300).addAnimation(wrapperAnimation);
};

/**
 * MD Toast Enter Animation
 */
const mdEnterAnimation = (baseEl, opts) => {
    const baseAnimation = createAnimation();
    const wrapperAnimation = createAnimation();
    const { position, top, bottom } = opts;
    const root = getElementRoot(baseEl);
    const wrapperEl = root.querySelector('.toast-wrapper');
    wrapperAnimation.addElement(wrapperEl);
    switch (position) {
        case 'top':
            wrapperEl.style.setProperty('transform', `translateY(${top})`);
            wrapperAnimation.fromTo('opacity', 0.01, 1);
            break;
        case 'middle':
            const topPosition = getOffsetForMiddlePosition(baseEl.clientHeight, wrapperEl.clientHeight);
            wrapperEl.style.top = `${topPosition}px`;
            wrapperAnimation.fromTo('opacity', 0.01, 1);
            break;
        default:
            wrapperEl.style.setProperty('transform', `translateY(${bottom})`);
            wrapperAnimation.fromTo('opacity', 0.01, 1);
            break;
    }
    return baseAnimation.easing('cubic-bezier(.36,.66,.04,1)').duration(400).addAnimation(wrapperAnimation);
};

/**
 * md Toast Leave Animation
 */
const mdLeaveAnimation = (baseEl) => {
    const baseAnimation = createAnimation();
    const wrapperAnimation = createAnimation();
    const root = getElementRoot(baseEl);
    const wrapperEl = root.querySelector('.toast-wrapper');
    wrapperAnimation.addElement(wrapperEl).fromTo('opacity', 0.99, 0);
    return baseAnimation.easing('cubic-bezier(.36,.66,.04,1)').duration(300).addAnimation(wrapperAnimation);
};

/**
 * Create a gesture that allows the Toast
 * to be swiped to dismiss.
 * @param el - The Toast element
 * @param toastPosition - The last computed position of the Toast. This is computed in the "present" method.
 * @param onDismiss - A callback to fire when the Toast was swiped to dismiss.
 */
const createSwipeToDismissGesture = (el, toastPosition, onDismiss) => {
    /**
     * Users should swipe on the visible toast wrapper
     * rather than on ion-toast which covers the entire screen.
     * When testing the class instance the inner wrapper will not
     * be defined. As a result, we use a placeholder element in those environments.
     */
    const wrapperEl = Build.isTesting
        ? document.createElement('div')
        : getElementRoot(el).querySelector('.toast-wrapper');
    const hostElHeight = el.clientHeight;
    const wrapperElBox = wrapperEl.getBoundingClientRect();
    /**
     * The maximum amount that
     * the toast can be swiped. This should
     * account for the wrapper element's height
     * too so the toast can be swiped offscreen
     * completely.
     */
    let MAX_SWIPE_DISTANCE = 0;
    /**
     * The step value at which a toast
     * is eligible for dismissing via gesture.
     */
    const DISMISS_THRESHOLD = 0.5;
    /**
     * The middle position Toast starts 50% of the way
     * through the animation, so we need to use this
     * as the starting point for our step values.
     */
    const STEP_OFFSET = el.position === 'middle' ? 0.5 : 0;
    /**
     * When the Toast is at the top users will be
     * swiping up. As a result, the delta values will be
     * negative numbers which will result in negative steps
     * and thresholds. As a result, we need to make those numbers
     * positive.
     */
    const INVERSION_FACTOR = el.position === 'top' ? -1 : 1;
    /**
     * The top offset that places the
     * toast in the middle of the screen.
     * Only needed when position="middle".
     */
    const topPosition = getOffsetForMiddlePosition(hostElHeight, wrapperElBox.height);
    const SWIPE_UP_DOWN_KEYFRAMES = [
        { offset: 0, transform: `translateY(-${topPosition + wrapperElBox.height}px)` },
        { offset: 0.5, transform: `translateY(0px)` },
        { offset: 1, transform: `translateY(${topPosition + wrapperElBox.height}px)` },
    ];
    const swipeAnimation = createAnimation('toast-swipe-to-dismiss-animation')
        .addElement(wrapperEl)
        /**
         * The specific value here does not actually
         * matter. We just need this to be a positive
         * value so the animation does not jump
         * to the end when the user beings to drag.
         */
        .duration(100);
    switch (el.position) {
        case 'middle':
            MAX_SWIPE_DISTANCE = hostElHeight + wrapperElBox.height;
            swipeAnimation.keyframes(SWIPE_UP_DOWN_KEYFRAMES);
            /**
             * Toast can be swiped up or down but
             * should start in the middle of the screen.
             */
            swipeAnimation.progressStart(true, 0.5);
            break;
        case 'top':
            /**
             * The bottom edge of the wrapper
             * includes the distance between the top
             * of the screen and the top of the wrapper
             * as well as the wrapper height so the wrapper
             * can be dragged fully offscreen.
             */
            MAX_SWIPE_DISTANCE = wrapperElBox.bottom;
            swipeAnimation.keyframes([
                { offset: 0, transform: `translateY(${toastPosition.top})` },
                { offset: 1, transform: 'translateY(-100%)' },
            ]);
            swipeAnimation.progressStart(true, 0);
            break;
        case 'bottom':
        default:
            /**
             * This computes the distance between the
             * top of the wrapper and the bottom of the
             * screen including the height of the wrapper
             * element so it can be dragged fully offscreen.
             */
            MAX_SWIPE_DISTANCE = hostElHeight - wrapperElBox.top;
            swipeAnimation.keyframes([
                { offset: 0, transform: `translateY(${toastPosition.bottom})` },
                { offset: 1, transform: 'translateY(100%)' },
            ]);
            swipeAnimation.progressStart(true, 0);
            break;
    }
    const computeStep = (delta) => {
        return (delta * INVERSION_FACTOR) / MAX_SWIPE_DISTANCE;
    };
    const onMove = (detail) => {
        const step = STEP_OFFSET + computeStep(detail.deltaY);
        swipeAnimation.progressStep(step);
    };
    const onEnd = (detail) => {
        const velocity = detail.velocityY;
        const threshold = ((detail.deltaY + velocity * 1000) / MAX_SWIPE_DISTANCE) * INVERSION_FACTOR;
        /**
         * Disable the gesture for the remainder of the animation.
         * It will be re-enabled if the toast animates back to
         * its initial presented position.
         */
        gesture.enable(false);
        let shouldDismiss = true;
        let playTo = 1;
        let step = 0;
        let remainingDistance = 0;
        if (el.position === 'middle') {
            /**
             * A middle positioned Toast appears
             * in the middle of the screen (at animation offset 0.5).
             * As a result, the threshold will be calculated relative
             * to this starting position. In other words at animation offset 0.5
             * the threshold will be 0. We want the middle Toast to be eligible
             * for dismiss when the user has swiped either half way up or down the
             * screen. As a result, we divide DISMISS_THRESHOLD in half. We also
             * consider when the threshold is a negative in the event the
             * user drags up (since the deltaY will also be negative).
             */
            shouldDismiss = threshold >= DISMISS_THRESHOLD / 2 || threshold <= -0.5 / 2;
            /**
             * Since we are replacing the keyframes
             * below the animation always starts from
             * the beginning of the new keyframes.
             * Similarly, we are always playing to
             * the end of the new keyframes.
             */
            playTo = 1;
            step = 0;
            /**
             * The Toast should animate from wherever its
             * current position is to the desired end state.
             *
             * To begin, we get the current position of the
             * Toast for its starting state.
             */
            const wrapperElBox = wrapperEl.getBoundingClientRect();
            const startOffset = wrapperElBox.top - topPosition;
            const startPosition = `${startOffset}px`;
            /**
             * If the deltaY is negative then the user is swiping
             * up, so the Toast should animate to the top of the screen.
             * If the deltaY is positive then the user is swiping
             * down, so the Toast should animate to the bottom of the screen.
             * We also account for when the deltaY is 0, but realistically
             * that should never happen because it means the user did not drag
             * the toast.
             */
            const offsetFactor = detail.deltaY <= 0 ? -1 : 1;
            const endOffset = (topPosition + wrapperElBox.height) * offsetFactor;
            /**
             * If the Toast should dismiss
             * then we need to figure out which edge of
             * the screen it should animate towards.
             * By default, the Toast will come
             * back to its default state in the
             * middle of the screen.
             */
            const endPosition = shouldDismiss ? `${endOffset}px` : '0px';
            const KEYFRAMES = [
                { offset: 0, transform: `translateY(${startPosition})` },
                { offset: 1, transform: `translateY(${endPosition})` },
            ];
            swipeAnimation.keyframes(KEYFRAMES);
            /**
             * Compute the remaining amount of pixels the
             * toast needs to move to be fully dismissed.
             */
            remainingDistance = endOffset - startOffset;
        }
        else {
            shouldDismiss = threshold >= DISMISS_THRESHOLD;
            playTo = shouldDismiss ? 1 : 0;
            step = computeStep(detail.deltaY);
            /**
             * Compute the remaining amount of pixels the
             * toast needs to move to be fully dismissed.
             */
            const remainingStepAmount = shouldDismiss ? 1 - step : step;
            remainingDistance = remainingStepAmount * MAX_SWIPE_DISTANCE;
        }
        /**
         * The animation speed should depend on how quickly
         * the user flicks the toast across the screen. However,
         * it should be no slower than 200ms.
         * We use Math.abs on the remainingDistance because that value
         * can be negative when swiping up on a middle position toast.
         */
        const duration = Math.min(Math.abs(remainingDistance) / Math.abs(velocity), 200);
        swipeAnimation
            .onFinish(() => {
            if (shouldDismiss) {
                onDismiss();
                swipeAnimation.destroy();
            }
            else {
                if (el.position === 'middle') {
                    /**
                     * If the toast snapped back to
                     * the middle of the screen we need
                     * to reset the keyframes
                     * so the toast can be swiped
                     * up or down again.
                     */
                    swipeAnimation.keyframes(SWIPE_UP_DOWN_KEYFRAMES).progressStart(true, 0.5);
                }
                else {
                    swipeAnimation.progressStart(true, 0);
                }
                /**
                 * If the toast did not dismiss then
                 * the user should be able to swipe again.
                 */
                gesture.enable(true);
            }
            /**
             * This must be a one time callback
             * otherwise a new callback will
             * be added every time onEnd runs.
             */
        }, { oneTimeCallback: true })
            .progressEnd(playTo, step, duration);
    };
    const gesture = createGesture({
        el: wrapperEl,
        gestureName: 'toast-swipe-to-dismiss',
        gesturePriority: OVERLAY_GESTURE_PRIORITY,
        /**
         * Toast only supports vertical swipes.
         * This needs to be updated if we later
         * support horizontal swipes.
         */
        direction: 'y',
        onMove,
        onEnd,
    });
    return gesture;
};

const toastIosCss = ":host{--border-width:0;--border-style:none;--border-color:initial;--box-shadow:none;--min-width:auto;--width:auto;--min-height:auto;--height:auto;--max-height:auto;--white-space:normal;top:0;display:block;position:absolute;width:100%;height:100%;outline:none;color:var(--color);font-family:var(--ion-font-family, inherit);contain:strict;z-index:1001;pointer-events:none}:host{inset-inline-start:0}:host(.overlay-hidden){display:none}:host(.ion-color){--button-color:inherit;color:var(--ion-color-contrast)}:host(.ion-color) .toast-button-cancel{color:inherit}:host(.ion-color) .toast-wrapper{background:var(--ion-color-base)}.toast-wrapper{border-radius:var(--border-radius);width:var(--width);min-width:var(--min-width);max-width:var(--max-width);height:var(--height);min-height:var(--min-height);max-height:var(--max-height);border-width:var(--border-width);border-style:var(--border-style);border-color:var(--border-color);background:var(--background);-webkit-box-shadow:var(--box-shadow);box-shadow:var(--box-shadow);pointer-events:auto}.toast-wrapper{inset-inline-start:var(--start);inset-inline-end:var(--end)}.toast-wrapper.toast-top{-webkit-transform:translate3d(0,  -100%,  0);transform:translate3d(0,  -100%,  0);top:0}.toast-wrapper.toast-bottom{-webkit-transform:translate3d(0,  100%,  0);transform:translate3d(0,  100%,  0);bottom:0}.toast-container{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;height:inherit;min-height:inherit;max-height:inherit;contain:content}.toast-layout-stacked .toast-container{-ms-flex-wrap:wrap;flex-wrap:wrap}.toast-layout-baseline .toast-content{display:-ms-flexbox;display:flex;-ms-flex:1;flex:1;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center}.toast-icon{-webkit-margin-start:16px;margin-inline-start:16px}.toast-content{min-width:0}.toast-message{-ms-flex:1;flex:1;white-space:var(--white-space)}.toast-button-group{display:-ms-flexbox;display:flex}.toast-layout-stacked .toast-button-group{-ms-flex-pack:end;justify-content:end;width:100%}.toast-button{border:0;outline:none;color:var(--button-color);z-index:0}.toast-icon,.toast-button-icon{font-size:1.4em}.toast-button-inner{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}@media (any-hover: hover){.toast-button:hover{cursor:pointer}}:host{--background:var(--ion-color-step-50, var(--ion-background-color-step-50, #f2f2f2));--border-radius:14px;--button-color:var(--ion-color-primary, #0054e9);--color:var(--ion-color-step-850, var(--ion-text-color-step-150, #262626));--max-width:700px;--max-height:478px;--start:10px;--end:10px;font-size:clamp(14px, 0.875rem, 43.4px)}.toast-wrapper{-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:auto;margin-bottom:auto;display:block;position:absolute;z-index:10}@supports ((-webkit-backdrop-filter: blur(0)) or (backdrop-filter: blur(0))){:host(.toast-translucent) .toast-wrapper{background:rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.8);-webkit-backdrop-filter:saturate(180%) blur(20px);backdrop-filter:saturate(180%) blur(20px)}:host(.ion-color.toast-translucent) .toast-wrapper{background:rgba(var(--ion-color-base-rgb), 0.8)}}.toast-wrapper.toast-middle{opacity:0.01}.toast-content{-webkit-padding-start:15px;padding-inline-start:15px;-webkit-padding-end:15px;padding-inline-end:15px;padding-top:15px;padding-bottom:15px}.toast-header{margin-bottom:2px;font-weight:500}.toast-button{-webkit-padding-start:15px;padding-inline-start:15px;-webkit-padding-end:15px;padding-inline-end:15px;padding-top:10px;padding-bottom:10px;min-height:44px;-webkit-transition:background-color, opacity 100ms linear;transition:background-color, opacity 100ms linear;border:0;background-color:transparent;font-family:var(--ion-font-family);font-size:clamp(17px, 1.0625rem, 21.998px);font-weight:500;overflow:hidden}.toast-button.ion-activated{opacity:0.4}@media (any-hover: hover){.toast-button:hover{opacity:0.6}}";

const toastMdCss = ":host{--border-width:0;--border-style:none;--border-color:initial;--box-shadow:none;--min-width:auto;--width:auto;--min-height:auto;--height:auto;--max-height:auto;--white-space:normal;top:0;display:block;position:absolute;width:100%;height:100%;outline:none;color:var(--color);font-family:var(--ion-font-family, inherit);contain:strict;z-index:1001;pointer-events:none}:host{inset-inline-start:0}:host(.overlay-hidden){display:none}:host(.ion-color){--button-color:inherit;color:var(--ion-color-contrast)}:host(.ion-color) .toast-button-cancel{color:inherit}:host(.ion-color) .toast-wrapper{background:var(--ion-color-base)}.toast-wrapper{border-radius:var(--border-radius);width:var(--width);min-width:var(--min-width);max-width:var(--max-width);height:var(--height);min-height:var(--min-height);max-height:var(--max-height);border-width:var(--border-width);border-style:var(--border-style);border-color:var(--border-color);background:var(--background);-webkit-box-shadow:var(--box-shadow);box-shadow:var(--box-shadow);pointer-events:auto}.toast-wrapper{inset-inline-start:var(--start);inset-inline-end:var(--end)}.toast-wrapper.toast-top{-webkit-transform:translate3d(0,  -100%,  0);transform:translate3d(0,  -100%,  0);top:0}.toast-wrapper.toast-bottom{-webkit-transform:translate3d(0,  100%,  0);transform:translate3d(0,  100%,  0);bottom:0}.toast-container{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;height:inherit;min-height:inherit;max-height:inherit;contain:content}.toast-layout-stacked .toast-container{-ms-flex-wrap:wrap;flex-wrap:wrap}.toast-layout-baseline .toast-content{display:-ms-flexbox;display:flex;-ms-flex:1;flex:1;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center}.toast-icon{-webkit-margin-start:16px;margin-inline-start:16px}.toast-content{min-width:0}.toast-message{-ms-flex:1;flex:1;white-space:var(--white-space)}.toast-button-group{display:-ms-flexbox;display:flex}.toast-layout-stacked .toast-button-group{-ms-flex-pack:end;justify-content:end;width:100%}.toast-button{border:0;outline:none;color:var(--button-color);z-index:0}.toast-icon,.toast-button-icon{font-size:1.4em}.toast-button-inner{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}@media (any-hover: hover){.toast-button:hover{cursor:pointer}}:host{--background:var(--ion-color-step-800, var(--ion-background-color-step-800, #333333));--border-radius:4px;--box-shadow:0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);--button-color:var(--ion-color-primary, #0054e9);--color:var(--ion-color-step-50, var(--ion-text-color-step-950, #f2f2f2));--max-width:700px;--start:8px;--end:8px;font-size:0.875rem}.toast-wrapper{-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:auto;margin-bottom:auto;display:block;position:absolute;opacity:0.01;z-index:10}.toast-content{-webkit-padding-start:16px;padding-inline-start:16px;-webkit-padding-end:16px;padding-inline-end:16px;padding-top:14px;padding-bottom:14px}.toast-header{margin-bottom:2px;font-weight:500;line-height:1.25rem}.toast-message{line-height:1.25rem}.toast-layout-baseline .toast-button-group-start{-webkit-margin-start:8px;margin-inline-start:8px}.toast-layout-stacked .toast-button-group-start{-webkit-margin-end:8px;margin-inline-end:8px;margin-top:8px}.toast-layout-baseline .toast-button-group-end{-webkit-margin-end:8px;margin-inline-end:8px}.toast-layout-stacked .toast-button-group-end{-webkit-margin-end:8px;margin-inline-end:8px;margin-bottom:8px}.toast-button{-webkit-padding-start:15px;padding-inline-start:15px;-webkit-padding-end:15px;padding-inline-end:15px;padding-top:10px;padding-bottom:10px;position:relative;background-color:transparent;font-family:var(--ion-font-family);font-size:0.875rem;font-weight:500;letter-spacing:0.84px;text-transform:uppercase;overflow:hidden}.toast-button-cancel{color:var(--ion-color-step-100, var(--ion-text-color-step-900, #e6e6e6))}.toast-button-icon-only{border-radius:50%;-webkit-padding-start:9px;padding-inline-start:9px;-webkit-padding-end:9px;padding-inline-end:9px;padding-top:9px;padding-bottom:9px;width:36px;height:36px}@media (any-hover: hover){.toast-button:hover{background-color:rgba(var(--ion-color-primary-rgb, 0, 84, 233), 0.08)}.toast-button-cancel:hover{background-color:rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.08)}}";

const Toast = /*@__PURE__*/ proxyCustomElement(class Toast extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.didPresent = createEvent(this, "ionToastDidPresent", 7);
        this.willPresent = createEvent(this, "ionToastWillPresent", 7);
        this.willDismiss = createEvent(this, "ionToastWillDismiss", 7);
        this.didDismiss = createEvent(this, "ionToastDidDismiss", 7);
        this.didPresentShorthand = createEvent(this, "didPresent", 7);
        this.willPresentShorthand = createEvent(this, "willPresent", 7);
        this.willDismissShorthand = createEvent(this, "willDismiss", 7);
        this.didDismissShorthand = createEvent(this, "didDismiss", 7);
        this.delegateController = createDelegateController(this);
        this.lockController = createLockController();
        this.triggerController = createTriggerController();
        this.customHTMLEnabled = config.get('innerHTMLTemplatesEnabled', ENABLE_HTML_CONTENT_DEFAULT);
        this.presented = false;
        /**
         * When `true`, content inside of .toast-content
         * will have aria-hidden elements removed causing
         * screen readers to announce the remaining content.
         */
        this.revealContentToScreenReader = false;
        /** @internal */
        this.hasController = false;
        /**
         * How many milliseconds to wait before hiding the toast. By default, it will show
         * until `dismiss()` is called.
         */
        this.duration = config.getNumber('toastDuration', 0);
        /**
         * Defines how the message and buttons are laid out in the toast.
         * 'baseline': The message and the buttons will appear on the same line.
         * Message text may wrap within the message container.
         * 'stacked': The buttons containers and message will stack on top
         * of each other. Use this if you have long text in your buttons.
         */
        this.layout = 'baseline';
        /**
         * If `true`, the keyboard will be automatically dismissed when the overlay is presented.
         */
        this.keyboardClose = false;
        /**
         * The starting position of the toast on the screen. Can be tweaked further
         * using the `positionAnchor` property.
         */
        this.position = 'bottom';
        /**
         * If `true`, the toast will be translucent.
         * Only applies when the mode is `"ios"` and the device supports
         * [`backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#Browser_compatibility).
         */
        this.translucent = false;
        /**
         * If `true`, the toast will animate.
         */
        this.animated = true;
        /**
         * If `true`, the toast will open. If `false`, the toast will close.
         * Use this if you need finer grained control over presentation, otherwise
         * just use the toastController or the `trigger` property.
         * Note: `isOpen` will not automatically be set back to `false` when
         * the toast dismisses. You will need to do that in your code.
         */
        this.isOpen = false;
        this.dispatchCancelHandler = (ev) => {
            const role = ev.detail.role;
            if (isCancel(role)) {
                const cancelButton = this.getButtons().find((b) => b.role === 'cancel');
                this.callButtonHandler(cancelButton);
            }
        };
        /**
         * Create a new swipe gesture so Toast
         * can be swiped to dismiss.
         */
        this.createSwipeGesture = (toastPosition) => {
            const gesture = (this.gesture = createSwipeToDismissGesture(this.el, toastPosition, () => {
                /**
                 * If the gesture completed then
                 * we should dismiss the toast.
                 */
                this.dismiss(undefined, GESTURE);
            }));
            gesture.enable(true);
        };
        /**
         * Destroy an existing swipe gesture
         * so Toast can no longer be swiped to dismiss.
         */
        this.destroySwipeGesture = () => {
            const { gesture } = this;
            if (gesture === undefined) {
                return;
            }
            gesture.destroy();
            this.gesture = undefined;
        };
        /**
         * Returns `true` if swipeGesture
         * is configured to a value that enables the swipe behavior.
         * Returns `false` otherwise.
         */
        this.prefersSwipeGesture = () => {
            const { swipeGesture } = this;
            return swipeGesture === 'vertical';
        };
    }
    swipeGestureChanged() {
        /**
         * If the Toast is presented, then we need to destroy
         * any actives gestures before a new gesture is potentially
         * created below.
         *
         * If the Toast is dismissed, then no gesture should be available
         * since the Toast is not visible. This case should never
         * happen since the "dismiss" method handles destroying
         * any active swipe gestures, but we keep this code
         * around to handle the first case.
         */
        this.destroySwipeGesture();
        /**
         * A new swipe gesture should only be created
         * if the Toast is presented. If the Toast is not
         * yet presented then the "present" method will
         * handle calling the swipe gesture setup function.
         */
        if (this.presented && this.prefersSwipeGesture()) {
            /**
             * If the Toast is presented then
             * lastPresentedPosition is defined.
             */
            this.createSwipeGesture(this.lastPresentedPosition);
        }
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
    connectedCallback() {
        prepareOverlay(this.el);
        this.triggerChanged();
    }
    disconnectedCallback() {
        this.triggerController.removeClickListener();
    }
    componentWillLoad() {
        var _a;
        if (!((_a = this.htmlAttributes) === null || _a === void 0 ? void 0 : _a.id)) {
            setOverlayId(this.el);
        }
    }
    componentDidLoad() {
        /**
         * If toast was rendered with isOpen="true"
         * then we should open toast immediately.
         */
        if (this.isOpen === true) {
            raf(() => this.present());
        }
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
     * Present the toast overlay after it has been created.
     */
    async present() {
        const unlock = await this.lockController.lock();
        await this.delegateController.attachViewToDom();
        const { el, position } = this;
        const anchor = this.getAnchorElement();
        const animationPosition = getAnimationPosition(position, anchor, getIonMode(this), el);
        /**
         * Cache the calculated position of the toast, so we can re-use it
         * in the dismiss animation.
         */
        this.lastPresentedPosition = animationPosition;
        await present(this, 'toastEnter', iosEnterAnimation, mdEnterAnimation, {
            position,
            top: animationPosition.top,
            bottom: animationPosition.bottom,
        });
        /**
         * Content is revealed to screen readers after
         * the transition to avoid jank since this
         * state updates will cause a re-render.
         */
        this.revealContentToScreenReader = true;
        if (this.duration > 0) {
            this.durationTimeout = setTimeout(() => this.dismiss(undefined, 'timeout'), this.duration);
        }
        /**
         * If the Toast has a swipe gesture then we can
         * create the gesture so users can swipe the
         * presented Toast.
         */
        if (this.prefersSwipeGesture()) {
            this.createSwipeGesture(animationPosition);
        }
        unlock();
    }
    /**
     * Dismiss the toast overlay after it has been presented.
     *
     * @param data Any data to emit in the dismiss events.
     * @param role The role of the element that is dismissing the toast.
     * This can be useful in a button handler for determining which button was
     * clicked to dismiss the toast.
     * Some examples include: ``"cancel"`, `"destructive"`, "selected"`, and `"backdrop"`.
     *
     * This is a no-op if the overlay has not been presented yet. If you want
     * to remove an overlay from the DOM that was never presented, use the
     * [remove](https://developer.mozilla.org/en-US/docs/Web/API/Element/remove) method.
     */
    async dismiss(data, role) {
        var _a, _b;
        const unlock = await this.lockController.lock();
        const { durationTimeout, position, lastPresentedPosition } = this;
        if (durationTimeout) {
            clearTimeout(durationTimeout);
        }
        const dismissed = await dismiss(this, data, role, 'toastLeave', iosLeaveAnimation, mdLeaveAnimation, 
        /**
         * Fetch the cached position that was calculated back in the present
         * animation. We always want to animate the dismiss from the same
         * position the present stopped at, so the animation looks continuous.
         */
        {
            position,
            top: (_a = lastPresentedPosition === null || lastPresentedPosition === void 0 ? void 0 : lastPresentedPosition.top) !== null && _a !== void 0 ? _a : '',
            bottom: (_b = lastPresentedPosition === null || lastPresentedPosition === void 0 ? void 0 : lastPresentedPosition.bottom) !== null && _b !== void 0 ? _b : '',
        });
        if (dismissed) {
            this.delegateController.removeViewFromDom();
            this.revealContentToScreenReader = false;
        }
        this.lastPresentedPosition = undefined;
        /**
         * If the Toast has a swipe gesture then we can
         * safely destroy it now that it is dismissed.
         */
        this.destroySwipeGesture();
        unlock();
        return dismissed;
    }
    /**
     * Returns a promise that resolves when the toast did dismiss.
     */
    onDidDismiss() {
        return eventMethod(this.el, 'ionToastDidDismiss');
    }
    /**
     * Returns a promise that resolves when the toast will dismiss.
     */
    onWillDismiss() {
        return eventMethod(this.el, 'ionToastWillDismiss');
    }
    getButtons() {
        const buttons = this.buttons
            ? this.buttons.map((b) => {
                return typeof b === 'string' ? { text: b } : b;
            })
            : [];
        return buttons;
    }
    /**
     * Returns the element specified by the positionAnchor prop,
     * or undefined if prop's value is an ID string and the element
     * is not found in the DOM.
     */
    getAnchorElement() {
        const { position, positionAnchor, el } = this;
        /**
         * If positionAnchor is undefined then
         * no anchor should be used when presenting the toast.
         */
        if (positionAnchor === undefined) {
            return;
        }
        if (position === 'middle' && positionAnchor !== undefined) {
            printIonWarning('[ion-toast] - The positionAnchor property is ignored when using position="middle".', this.el);
            return undefined;
        }
        if (typeof positionAnchor === 'string') {
            /**
             * If the anchor is defined as an ID, find the element.
             * We do this on every present so the toast doesn't need
             * to account for the surrounding DOM changing since the
             * last time it was presented.
             */
            const foundEl = document.getElementById(positionAnchor);
            if (foundEl === null) {
                printIonWarning(`[ion-toast] - An anchor element with an ID of "${positionAnchor}" was not found in the DOM.`, el);
                return undefined;
            }
            return foundEl;
        }
        if (positionAnchor instanceof HTMLElement) {
            return positionAnchor;
        }
        printIonWarning('[ion-toast] - Invalid positionAnchor value:', positionAnchor, el);
        return undefined;
    }
    async buttonClick(button) {
        const role = button.role;
        if (isCancel(role)) {
            return this.dismiss(undefined, role);
        }
        const shouldDismiss = await this.callButtonHandler(button);
        if (shouldDismiss) {
            return this.dismiss(undefined, role);
        }
        return Promise.resolve();
    }
    async callButtonHandler(button) {
        if (button === null || button === void 0 ? void 0 : button.handler) {
            // a handler has been provided, execute it
            // pass the handler the values from the inputs
            try {
                const rtn = await safeCall(button.handler);
                if (rtn === false) {
                    // if the return value of the handler is false then do not dismiss
                    return false;
                }
            }
            catch (e) {
                printIonError('[ion-toast] - Exception in callButtonHandler:', e);
            }
        }
        return true;
    }
    renderButtons(buttons, side) {
        if (buttons.length === 0) {
            return;
        }
        const mode = getIonMode(this);
        const buttonGroupsClasses = {
            'toast-button-group': true,
            [`toast-button-group-${side}`]: true,
        };
        return (h("div", { class: buttonGroupsClasses }, buttons.map((b) => (h("button", Object.assign({}, b.htmlAttributes, { type: "button", class: buttonClass(b), tabIndex: 0, onClick: () => this.buttonClick(b), part: buttonPart(b) }), h("div", { class: "toast-button-inner" }, b.icon && (h("ion-icon", { "aria-hidden": "true", icon: b.icon, slot: b.text === undefined ? 'icon-only' : undefined, class: "toast-button-icon" })), b.text), mode === 'md' && (h("ion-ripple-effect", { type: b.icon !== undefined && b.text === undefined ? 'unbounded' : 'bounded' })))))));
    }
    /**
     * Render the `message` property.
     * @param key - A key to give the element a stable identity. This is used to improve compatibility with screen readers.
     * @param ariaHidden - If "true" then content will be hidden from screen readers.
     */
    renderToastMessage(key, ariaHidden = null) {
        const { customHTMLEnabled, message } = this;
        if (customHTMLEnabled) {
            return (h("div", { key: key, "aria-hidden": ariaHidden, class: "toast-message", part: "message", innerHTML: sanitizeDOMString(message) }));
        }
        return (h("div", { key: key, "aria-hidden": ariaHidden, class: "toast-message", part: "message" }, message));
    }
    /**
     * Render the `header` property.
     * @param key - A key to give the element a stable identity. This is used to improve compatibility with screen readers.
     * @param ariaHidden - If "true" then content will be hidden from screen readers.
     */
    renderHeader(key, ariaHidden = null) {
        return (h("div", { key: key, class: "toast-header", "aria-hidden": ariaHidden, part: "header" }, this.header));
    }
    render() {
        const { layout, el, revealContentToScreenReader, header, message } = this;
        const allButtons = this.getButtons();
        const startButtons = allButtons.filter((b) => b.side === 'start');
        const endButtons = allButtons.filter((b) => b.side !== 'start');
        const mode = getIonMode(this);
        const wrapperClass = {
            'toast-wrapper': true,
            [`toast-${this.position}`]: true,
            [`toast-layout-${layout}`]: true,
        };
        /**
         * Stacked buttons are only meant to be
         *  used with one type of button.
         */
        if (layout === 'stacked' && startButtons.length > 0 && endButtons.length > 0) {
            printIonWarning('[ion-toast] - This toast is using start and end buttons with the stacked toast layout. We recommend following the best practice of using either start or end buttons with the stacked toast layout.', el);
        }
        return (h(Host, Object.assign({ key: '425be734aee0eeef281ab1609a9f982ce8b5e852', tabindex: "-1" }, this.htmlAttributes, { style: {
                zIndex: `${60000 + this.overlayIndex}`,
            }, class: createColorClasses(this.color, Object.assign(Object.assign({ [mode]: true }, getClassMap(this.cssClass)), { 'overlay-hidden': true, 'toast-translucent': this.translucent })), onIonToastWillDismiss: this.dispatchCancelHandler }), h("div", { key: '7c3ad1a8df9e21fc30fc179c7edebeabcf3c6874', class: wrapperClass }, h("div", { key: 'f950c21e8d7bf92653e0bd52e820ed6b84fa8cf5', class: "toast-container", part: "container" }, this.renderButtons(startButtons, 'start'), this.icon !== undefined && (h("ion-icon", { key: '0266241927dbe16799adb57f9fc11bd5372877b2', class: "toast-icon", part: "icon", icon: this.icon, lazy: false, "aria-hidden": "true" })), h("div", { key: '9ef4b87bad672af6a5b693af61375564daf1eeeb', class: "toast-content", role: "status", "aria-atomic": "true", "aria-live": "polite" }, !revealContentToScreenReader && header !== undefined && this.renderHeader('oldHeader', 'true'), !revealContentToScreenReader && message !== undefined && this.renderToastMessage('oldMessage', 'true'), revealContentToScreenReader && header !== undefined && this.renderHeader('header'), revealContentToScreenReader && message !== undefined && this.renderToastMessage('header')), this.renderButtons(endButtons, 'end')))));
    }
    get el() { return this; }
    static get watchers() { return {
        "swipeGesture": ["swipeGestureChanged"],
        "isOpen": ["onIsOpenChange"],
        "trigger": ["triggerChanged"]
    }; }
    static get style() { return {
        ios: toastIosCss,
        md: toastMdCss
    }; }
}, [33, "ion-toast", {
        "overlayIndex": [2, "overlay-index"],
        "delegate": [16],
        "hasController": [4, "has-controller"],
        "color": [513],
        "enterAnimation": [16, "enter-animation"],
        "leaveAnimation": [16, "leave-animation"],
        "cssClass": [1, "css-class"],
        "duration": [2],
        "header": [1],
        "layout": [1],
        "message": [1],
        "keyboardClose": [4, "keyboard-close"],
        "position": [1],
        "positionAnchor": [1, "position-anchor"],
        "buttons": [16],
        "translucent": [4],
        "animated": [4],
        "icon": [1],
        "htmlAttributes": [16, "html-attributes"],
        "swipeGesture": [1, "swipe-gesture"],
        "isOpen": [4, "is-open"],
        "trigger": [1],
        "revealContentToScreenReader": [32],
        "present": [64],
        "dismiss": [64],
        "onDidDismiss": [64],
        "onWillDismiss": [64]
    }, undefined, {
        "swipeGesture": ["swipeGestureChanged"],
        "isOpen": ["onIsOpenChange"],
        "trigger": ["triggerChanged"]
    }]);
const buttonClass = (button) => {
    return {
        'toast-button': true,
        'toast-button-icon-only': button.icon !== undefined && button.text === undefined,
        [`toast-button-${button.role}`]: button.role !== undefined,
        'ion-focusable': true,
        'ion-activatable': true,
    };
};
const buttonPart = (button) => {
    return isCancel(button.role) ? 'button cancel' : 'button';
};
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-toast", "ion-icon", "ion-ripple-effect"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-toast":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Toast);
            }
            break;
        case "ion-icon":
            if (!customElements.get(tagName)) {
                defineCustomElement$3();
            }
            break;
        case "ion-ripple-effect":
            if (!customElements.get(tagName)) {
                defineCustomElement$2();
            }
            break;
    } });
}

const IonToast = Toast;
const defineCustomElement = defineCustomElement$1;

export { IonToast, defineCustomElement };
