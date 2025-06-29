/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { writeTask } from '@stencil/core/internal/client';
import { c as createAnimation } from './animation.js';
import { c as componentOnReady, t as transitionEndAsync, f as clamp } from './helpers.js';

const getRefresherAnimationType = (contentEl) => {
    const previousSibling = contentEl.previousElementSibling;
    const hasHeader = previousSibling !== null && previousSibling.tagName === 'ION-HEADER';
    return hasHeader ? 'translate' : 'scale';
};
const createPullingAnimation = (type, pullingSpinner, refresherEl) => {
    return type === 'scale'
        ? createScaleAnimation(pullingSpinner, refresherEl)
        : createTranslateAnimation(pullingSpinner, refresherEl);
};
const createBaseAnimation = (pullingRefresherIcon) => {
    const spinner = pullingRefresherIcon.querySelector('ion-spinner');
    const circle = spinner.shadowRoot.querySelector('circle');
    const spinnerArrowContainer = pullingRefresherIcon.querySelector('.spinner-arrow-container');
    const arrowContainer = pullingRefresherIcon.querySelector('.arrow-container');
    const arrow = arrowContainer ? arrowContainer.querySelector('ion-icon') : null;
    const baseAnimation = createAnimation().duration(1000).easing('ease-out');
    const spinnerArrowContainerAnimation = createAnimation()
        .addElement(spinnerArrowContainer)
        .keyframes([
        { offset: 0, opacity: '0.3' },
        { offset: 0.45, opacity: '0.3' },
        { offset: 0.55, opacity: '1' },
        { offset: 1, opacity: '1' },
    ]);
    const circleInnerAnimation = createAnimation()
        .addElement(circle)
        .keyframes([
        { offset: 0, strokeDasharray: '1px, 200px' },
        { offset: 0.2, strokeDasharray: '1px, 200px' },
        { offset: 0.55, strokeDasharray: '100px, 200px' },
        { offset: 1, strokeDasharray: '100px, 200px' },
    ]);
    const circleOuterAnimation = createAnimation()
        .addElement(spinner)
        .keyframes([
        { offset: 0, transform: 'rotate(-90deg)' },
        { offset: 1, transform: 'rotate(210deg)' },
    ]);
    /**
     * Only add arrow animation if present
     * this allows users to customize the spinners
     * without errors being thrown
     */
    if (arrowContainer && arrow) {
        const arrowContainerAnimation = createAnimation()
            .addElement(arrowContainer)
            .keyframes([
            { offset: 0, transform: 'rotate(0deg)' },
            { offset: 0.3, transform: 'rotate(0deg)' },
            { offset: 0.55, transform: 'rotate(280deg)' },
            { offset: 1, transform: 'rotate(400deg)' },
        ]);
        const arrowAnimation = createAnimation()
            .addElement(arrow)
            .keyframes([
            { offset: 0, transform: 'translateX(2px) scale(0)' },
            { offset: 0.3, transform: 'translateX(2px) scale(0)' },
            { offset: 0.55, transform: 'translateX(-1.5px) scale(1)' },
            { offset: 1, transform: 'translateX(-1.5px) scale(1)' },
        ]);
        baseAnimation.addAnimation([arrowContainerAnimation, arrowAnimation]);
    }
    return baseAnimation.addAnimation([spinnerArrowContainerAnimation, circleInnerAnimation, circleOuterAnimation]);
};
const createScaleAnimation = (pullingRefresherIcon, refresherEl) => {
    /**
     * Do not take the height of the refresher icon
     * because at this point the DOM has not updated,
     * so the refresher icon is still hidden with
     * display: none.
     * The `ion-refresher` container height
     * is roughly the amount we need to offset
     * the icon by when pulling down.
     */
    const height = refresherEl.clientHeight;
    const spinnerAnimation = createAnimation()
        .addElement(pullingRefresherIcon)
        .keyframes([
        { offset: 0, transform: `scale(0) translateY(-${height}px)` },
        { offset: 1, transform: 'scale(1) translateY(100px)' },
    ]);
    return createBaseAnimation(pullingRefresherIcon).addAnimation([spinnerAnimation]);
};
const createTranslateAnimation = (pullingRefresherIcon, refresherEl) => {
    /**
     * Do not take the height of the refresher icon
     * because at this point the DOM has not updated,
     * so the refresher icon is still hidden with
     * display: none.
     * The `ion-refresher` container height
     * is roughly the amount we need to offset
     * the icon by when pulling down.
     */
    const height = refresherEl.clientHeight;
    const spinnerAnimation = createAnimation()
        .addElement(pullingRefresherIcon)
        .keyframes([
        { offset: 0, transform: `translateY(-${height}px)` },
        { offset: 1, transform: 'translateY(100px)' },
    ]);
    return createBaseAnimation(pullingRefresherIcon).addAnimation([spinnerAnimation]);
};
const createSnapBackAnimation = (pullingRefresherIcon) => {
    return createAnimation()
        .duration(125)
        .addElement(pullingRefresherIcon)
        .fromTo('transform', 'translateY(var(--ion-pulling-refresher-translate, 100px))', 'translateY(0px)');
};
// iOS Native Refresher
// -----------------------------
const setSpinnerOpacity = (spinner, opacity) => {
    spinner.style.setProperty('opacity', opacity.toString());
};
const handleScrollWhilePulling = (ticks, numTicks, pullAmount) => {
    const max = 1;
    writeTask(() => {
        ticks.forEach((el, i) => {
            /**
             * Compute the opacity of each tick
             * mark as a percentage of the pullAmount
             * offset by max / numTicks so
             * the tick marks are shown staggered.
             */
            const min = i * (max / numTicks);
            const range = max - min;
            const start = pullAmount - min;
            const progression = clamp(0, start / range, 1);
            el.style.setProperty('opacity', progression.toString());
        });
    });
};
const handleScrollWhileRefreshing = (spinner, lastVelocityY) => {
    writeTask(() => {
        // If user pulls down quickly, the spinner should spin faster
        spinner.style.setProperty('--refreshing-rotation-duration', lastVelocityY >= 1.0 ? '0.5s' : '2s');
        spinner.style.setProperty('opacity', '1');
    });
};
const translateElement = (el, value, duration = 200) => {
    if (!el) {
        return Promise.resolve();
    }
    const trans = transitionEndAsync(el, duration);
    writeTask(() => {
        el.style.setProperty('transition', `${duration}ms all ease-out`);
        if (value === undefined) {
            el.style.removeProperty('transform');
        }
        else {
            el.style.setProperty('transform', `translate3d(0px, ${value}, 0px)`);
        }
    });
    return trans;
};
// Utils
// -----------------------------
/**
 * In order to use the native iOS refresher the device must support rubber band scrolling.
 * As part of this, we need to exclude Desktop Safari because it has a slightly different rubber band effect that is not compatible with the native refresher in Ionic.
 *
 * We also need to be careful not to include devices that spoof their user agent.
 * For example, when using iOS emulation in Chrome the user agent will be spoofed such that
 * navigator.maxTouchPointer > 0. To work around this,
 * we check to see if the apple-pay-logo is supported as a named image which is only
 * true on Apple devices.
 *
 * We previously checked referencEl.style.webkitOverflowScrolling to explicitly check
 * for rubber band support. However, this property was removed on iPadOS and it's possible
 * that this will be removed on iOS in the future too.
 *
 */
const supportsRubberBandScrolling = () => {
    return navigator.maxTouchPoints > 0 && CSS.supports('background: -webkit-named-image(apple-pay-logo-black)');
};
const shouldUseNativeRefresher = async (referenceEl, mode) => {
    const refresherContent = referenceEl.querySelector('ion-refresher-content');
    if (!refresherContent) {
        return Promise.resolve(false);
    }
    await new Promise((resolve) => componentOnReady(refresherContent, resolve));
    const pullingSpinner = referenceEl.querySelector('ion-refresher-content .refresher-pulling ion-spinner');
    const refreshingSpinner = referenceEl.querySelector('ion-refresher-content .refresher-refreshing ion-spinner');
    return (pullingSpinner !== null &&
        refreshingSpinner !== null &&
        ((mode === 'ios' && supportsRubberBandScrolling()) || mode === 'md'));
};

export { setSpinnerOpacity as a, handleScrollWhilePulling as b, createSnapBackAnimation as c, createPullingAnimation as d, supportsRubberBandScrolling as e, getRefresherAnimationType as g, handleScrollWhileRefreshing as h, shouldUseNativeRefresher as s, translateElement as t };
