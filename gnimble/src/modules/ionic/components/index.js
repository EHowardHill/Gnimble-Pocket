/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
export { getAssetPath, render, setAssetPath, setNonce, setPlatformOptions } from '@stencil/core/internal/client';
export { c as createAnimation } from './animation.js';
export { a as LIFECYCLE_DID_ENTER, c as LIFECYCLE_DID_LEAVE, L as LIFECYCLE_WILL_ENTER, b as LIFECYCLE_WILL_LEAVE, d as LIFECYCLE_WILL_UNLOAD, g as getIonPageElement } from './index2.js';
export { iosTransitionAnimation } from './ios.transition.js';
export { mdTransitionAnimation } from './md.transition.js';
export { g as getTimeGivenProgression } from './cubic-bezier.js';
export { createGesture } from './index3.js';
export { g as getPlatforms, i as initialize, a as isPlatform } from './ionic-global.js';
export { c as componentOnReady } from './helpers.js';
export { L as LogLevel } from './index4.js';
export { I as IonicSafeString, g as getMode, s as setupConfig } from './config.js';
export { o as openURL } from './theme.js';
export { m as menuController } from './index5.js';
export { b as actionSheetController, a as alertController, l as loadingController, m as modalController, p as pickerController, c as popoverController, t as toastController } from './overlays.js';

const IonicSlides = (opts) => {
    const { swiper, extendParams } = opts;
    const slidesParams = {
        effect: undefined,
        direction: 'horizontal',
        initialSlide: 0,
        loop: false,
        parallax: false,
        slidesPerView: 1,
        spaceBetween: 0,
        speed: 300,
        slidesPerColumn: 1,
        slidesPerColumnFill: 'column',
        slidesPerGroup: 1,
        centeredSlides: false,
        slidesOffsetBefore: 0,
        slidesOffsetAfter: 0,
        touchEventsTarget: 'container',
        freeMode: false,
        freeModeMomentum: true,
        freeModeMomentumRatio: 1,
        freeModeMomentumBounce: true,
        freeModeMomentumBounceRatio: 1,
        freeModeMomentumVelocityRatio: 1,
        freeModeSticky: false,
        freeModeMinimumVelocity: 0.02,
        autoHeight: false,
        setWrapperSize: false,
        zoom: {
            maxRatio: 3,
            minRatio: 1,
            toggle: false,
        },
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: true,
        touchStartPreventDefault: false,
        shortSwipes: true,
        longSwipes: true,
        longSwipesRatio: 0.5,
        longSwipesMs: 300,
        followFinger: true,
        threshold: 0,
        touchMoveStopPropagation: true,
        touchReleaseOnEdges: false,
        iOSEdgeSwipeDetection: false,
        iOSEdgeSwipeThreshold: 20,
        resistance: true,
        resistanceRatio: 0.85,
        watchSlidesProgress: false,
        watchSlidesVisibility: false,
        preventClicks: true,
        preventClicksPropagation: true,
        slideToClickedSlide: false,
        loopAdditionalSlides: 0,
        noSwiping: true,
        runCallbacksOnInit: true,
        coverflowEffect: {
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
        },
        flipEffect: {
            slideShadows: true,
            limitRotation: true,
        },
        cubeEffect: {
            slideShadows: true,
            shadow: true,
            shadowOffset: 20,
            shadowScale: 0.94,
        },
        fadeEffect: {
            crossFade: false,
        },
        a11y: {
            prevSlideMessage: 'Previous slide',
            nextSlideMessage: 'Next slide',
            firstSlideMessage: 'This is the first slide',
            lastSlideMessage: 'This is the last slide',
        },
    };
    if (swiper.pagination) {
        slidesParams.pagination = {
            type: 'bullets',
            clickable: false,
            hideOnClick: false,
        };
    }
    if (swiper.scrollbar) {
        slidesParams.scrollbar = {
            hide: true,
        };
    }
    extendParams(slidesParams);
};

export { IonicSlides };
