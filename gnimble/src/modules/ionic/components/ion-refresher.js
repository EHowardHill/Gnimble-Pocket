/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, writeTask, readTask, h, Host } from '@stencil/core/internal/client';
import { g as getTimeGivenProgression } from './cubic-bezier.js';
import { I as ION_CONTENT_CLASS_SELECTOR, b as ION_CONTENT_ELEMENT_SELECTOR, p as printIonContentErrorMsg, g as getScrollElement } from './index8.js';
import { t as transitionEndAsync, f as clamp, g as getElementRoot, c as componentOnReady, r as raf } from './helpers.js';
import { a as printIonError } from './index4.js';
import { c as hapticImpact, I as ImpactStyle } from './haptic.js';
import { b as getIonMode } from './ionic-global.js';
import { s as shouldUseNativeRefresher, t as translateElement, a as setSpinnerOpacity, h as handleScrollWhileRefreshing, b as handleScrollWhilePulling, c as createSnapBackAnimation, d as createPullingAnimation, g as getRefresherAnimationType } from './refresher.utils.js';

const refresherIosCss = "ion-refresher{top:0;display:none;position:absolute;width:100%;height:60px;pointer-events:none;z-index:-1}ion-refresher{inset-inline-start:0}ion-refresher.refresher-active{display:block}ion-refresher-content{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center;height:100%}.refresher-pulling,.refresher-refreshing{display:none;width:100%}.refresher-pulling-icon,.refresher-refreshing-icon{-webkit-transform-origin:center;transform-origin:center;-webkit-transition:200ms;transition:200ms;font-size:30px;text-align:center}:host-context([dir=rtl]) .refresher-pulling-icon,:host-context([dir=rtl]) .refresher-refreshing-icon{-webkit-transform-origin:calc(100% - center);transform-origin:calc(100% - center)}[dir=rtl] .refresher-pulling-icon,[dir=rtl] .refresher-refreshing-icon{-webkit-transform-origin:calc(100% - center);transform-origin:calc(100% - center)}@supports selector(:dir(rtl)){.refresher-pulling-icon:dir(rtl),.refresher-refreshing-icon:dir(rtl){-webkit-transform-origin:calc(100% - center);transform-origin:calc(100% - center)}}.refresher-pulling-text,.refresher-refreshing-text{font-size:16px;text-align:center}ion-refresher-content .arrow-container{display:none}.refresher-pulling ion-refresher-content .refresher-pulling{display:block}.refresher-ready ion-refresher-content .refresher-pulling{display:block}.refresher-ready ion-refresher-content .refresher-pulling-icon{-webkit-transform:rotate(180deg);transform:rotate(180deg)}.refresher-refreshing ion-refresher-content .refresher-refreshing{display:block}.refresher-cancelling ion-refresher-content .refresher-pulling{display:block}.refresher-cancelling ion-refresher-content .refresher-pulling-icon{-webkit-transform:scale(0);transform:scale(0)}.refresher-completing ion-refresher-content .refresher-refreshing{display:block}.refresher-completing ion-refresher-content .refresher-refreshing-icon{-webkit-transform:scale(0);transform:scale(0)}.refresher-native .refresher-pulling-text,.refresher-native .refresher-refreshing-text{display:none}.refresher-ios .refresher-pulling-icon,.refresher-ios .refresher-refreshing-icon{color:var(--ion-text-color, #000)}.refresher-ios .refresher-pulling-text,.refresher-ios .refresher-refreshing-text{color:var(--ion-text-color, #000)}.refresher-ios .refresher-refreshing .spinner-lines-ios line,.refresher-ios .refresher-refreshing .spinner-lines-small-ios line,.refresher-ios .refresher-refreshing .spinner-crescent circle{stroke:var(--ion-text-color, #000)}.refresher-ios .refresher-refreshing .spinner-bubbles circle,.refresher-ios .refresher-refreshing .spinner-circles circle,.refresher-ios .refresher-refreshing .spinner-dots circle{fill:var(--ion-text-color, #000)}ion-refresher.refresher-native{display:block;z-index:1}ion-refresher.refresher-native ion-spinner{-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:0;margin-bottom:0}.refresher-native .refresher-refreshing ion-spinner{--refreshing-rotation-duration:2s;display:none;-webkit-animation:var(--refreshing-rotation-duration) ease-out refresher-rotate forwards;animation:var(--refreshing-rotation-duration) ease-out refresher-rotate forwards}.refresher-native .refresher-refreshing{display:none;-webkit-animation:250ms linear refresher-pop forwards;animation:250ms linear refresher-pop forwards}.refresher-native ion-spinner{width:32px;height:32px;color:var(--ion-color-step-450, var(--ion-background-color-step-450, #747577))}.refresher-native.refresher-refreshing .refresher-pulling ion-spinner,.refresher-native.refresher-completing .refresher-pulling ion-spinner{display:none}.refresher-native.refresher-refreshing .refresher-refreshing ion-spinner,.refresher-native.refresher-completing .refresher-refreshing ion-spinner{display:block}.refresher-native.refresher-pulling .refresher-pulling ion-spinner{display:block}.refresher-native.refresher-pulling .refresher-refreshing ion-spinner{display:none}.refresher-native.refresher-completing ion-refresher-content .refresher-refreshing-icon{-webkit-transform:scale(0) rotate(180deg);transform:scale(0) rotate(180deg);-webkit-transition:300ms;transition:300ms}@-webkit-keyframes refresher-pop{0%{-webkit-transform:scale(1);transform:scale(1);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}50%{-webkit-transform:scale(1.2);transform:scale(1.2);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}100%{-webkit-transform:scale(1);transform:scale(1)}}@keyframes refresher-pop{0%{-webkit-transform:scale(1);transform:scale(1);-webkit-animation-timing-function:ease-in;animation-timing-function:ease-in}50%{-webkit-transform:scale(1.2);transform:scale(1.2);-webkit-animation-timing-function:ease-out;animation-timing-function:ease-out}100%{-webkit-transform:scale(1);transform:scale(1)}}@-webkit-keyframes refresher-rotate{from{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(180deg);transform:rotate(180deg)}}@keyframes refresher-rotate{from{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(180deg);transform:rotate(180deg)}}";

const refresherMdCss = "ion-refresher{top:0;display:none;position:absolute;width:100%;height:60px;pointer-events:none;z-index:-1}ion-refresher{inset-inline-start:0}ion-refresher.refresher-active{display:block}ion-refresher-content{display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:center;justify-content:center;height:100%}.refresher-pulling,.refresher-refreshing{display:none;width:100%}.refresher-pulling-icon,.refresher-refreshing-icon{-webkit-transform-origin:center;transform-origin:center;-webkit-transition:200ms;transition:200ms;font-size:30px;text-align:center}:host-context([dir=rtl]) .refresher-pulling-icon,:host-context([dir=rtl]) .refresher-refreshing-icon{-webkit-transform-origin:calc(100% - center);transform-origin:calc(100% - center)}[dir=rtl] .refresher-pulling-icon,[dir=rtl] .refresher-refreshing-icon{-webkit-transform-origin:calc(100% - center);transform-origin:calc(100% - center)}@supports selector(:dir(rtl)){.refresher-pulling-icon:dir(rtl),.refresher-refreshing-icon:dir(rtl){-webkit-transform-origin:calc(100% - center);transform-origin:calc(100% - center)}}.refresher-pulling-text,.refresher-refreshing-text{font-size:16px;text-align:center}ion-refresher-content .arrow-container{display:none}.refresher-pulling ion-refresher-content .refresher-pulling{display:block}.refresher-ready ion-refresher-content .refresher-pulling{display:block}.refresher-ready ion-refresher-content .refresher-pulling-icon{-webkit-transform:rotate(180deg);transform:rotate(180deg)}.refresher-refreshing ion-refresher-content .refresher-refreshing{display:block}.refresher-cancelling ion-refresher-content .refresher-pulling{display:block}.refresher-cancelling ion-refresher-content .refresher-pulling-icon{-webkit-transform:scale(0);transform:scale(0)}.refresher-completing ion-refresher-content .refresher-refreshing{display:block}.refresher-completing ion-refresher-content .refresher-refreshing-icon{-webkit-transform:scale(0);transform:scale(0)}.refresher-native .refresher-pulling-text,.refresher-native .refresher-refreshing-text{display:none}.refresher-md .refresher-pulling-icon,.refresher-md .refresher-refreshing-icon{color:var(--ion-text-color, #000)}.refresher-md .refresher-pulling-text,.refresher-md .refresher-refreshing-text{color:var(--ion-text-color, #000)}.refresher-md .refresher-refreshing .spinner-lines-md line,.refresher-md .refresher-refreshing .spinner-lines-small-md line,.refresher-md .refresher-refreshing .spinner-crescent circle{stroke:var(--ion-text-color, #000)}.refresher-md .refresher-refreshing .spinner-bubbles circle,.refresher-md .refresher-refreshing .spinner-circles circle,.refresher-md .refresher-refreshing .spinner-dots circle{fill:var(--ion-text-color, #000)}ion-refresher.refresher-native{display:block;z-index:1}ion-refresher.refresher-native ion-spinner{-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:0;margin-bottom:0;width:24px;height:24px;color:var(--ion-color-primary, #0054e9)}ion-refresher.refresher-native .spinner-arrow-container{display:inherit}ion-refresher.refresher-native .arrow-container{display:block;position:absolute;width:24px;height:24px}ion-refresher.refresher-native .arrow-container ion-icon{-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:0;margin-bottom:0;left:0;right:0;bottom:-4px;position:absolute;color:var(--ion-color-primary, #0054e9);font-size:12px}ion-refresher.refresher-native.refresher-pulling ion-refresher-content .refresher-pulling,ion-refresher.refresher-native.refresher-ready ion-refresher-content .refresher-pulling{display:-ms-flexbox;display:flex}ion-refresher.refresher-native.refresher-refreshing ion-refresher-content .refresher-refreshing,ion-refresher.refresher-native.refresher-completing ion-refresher-content .refresher-refreshing,ion-refresher.refresher-native.refresher-cancelling ion-refresher-content .refresher-refreshing{display:-ms-flexbox;display:flex}ion-refresher.refresher-native .refresher-pulling-icon{-webkit-transform:translateY(calc(-100% - 10px));transform:translateY(calc(-100% - 10px))}ion-refresher.refresher-native .refresher-pulling-icon,ion-refresher.refresher-native .refresher-refreshing-icon{-webkit-margin-start:auto;margin-inline-start:auto;-webkit-margin-end:auto;margin-inline-end:auto;margin-top:0;margin-bottom:0;border-radius:100%;-webkit-padding-start:8px;padding-inline-start:8px;-webkit-padding-end:8px;padding-inline-end:8px;padding-top:8px;padding-bottom:8px;display:-ms-flexbox;display:flex;border:1px solid var(--ion-color-step-200, var(--ion-background-color-step-200, #ececec));background:var(--ion-color-step-250, var(--ion-background-color-step-250, #ffffff));-webkit-box-shadow:0px 1px 6px rgba(0, 0, 0, 0.1);box-shadow:0px 1px 6px rgba(0, 0, 0, 0.1)}";

const Refresher = /*@__PURE__*/ proxyCustomElement(class Refresher extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.ionRefresh = createEvent(this, "ionRefresh", 7);
        this.ionPull = createEvent(this, "ionPull", 7);
        this.ionStart = createEvent(this, "ionStart", 7);
        this.appliedStyles = false;
        this.didStart = false;
        this.progress = 0;
        this.pointerDown = false;
        this.needsCompletion = false;
        this.didRefresh = false;
        this.contentFullscreen = false;
        this.lastVelocityY = 0;
        this.animations = [];
        this.nativeRefresher = false;
        /**
         * The current state which the refresher is in. The refresher's states include:
         *
         * - `inactive` - The refresher is not being pulled down or refreshing and is currently hidden.
         * - `pulling` - The user is actively pulling down the refresher, but has not reached the point yet that if the user lets go, it'll refresh.
         * - `cancelling` - The user pulled down the refresher and let go, but did not pull down far enough to kick off the `refreshing` state. After letting go, the refresher is in the `cancelling` state while it is closing, and will go back to the `inactive` state once closed.
         * - `ready` - The user has pulled down the refresher far enough that if they let go, it'll begin the `refreshing` state.
         * - `refreshing` - The refresher is actively waiting on the async operation to end. Once the refresh handler calls `complete()` it will begin the `completing` state.
         * - `completing` - The `refreshing` state has finished and the refresher is in the way of closing itself. Once closed, the refresher will go back to the `inactive` state.
         */
        this.state = 1 /* RefresherState.Inactive */;
        /**
         * The minimum distance the user must pull down until the
         * refresher will go into the `refreshing` state.
         * Does not apply when the refresher content uses a spinner,
         * enabling the native refresher.
         */
        this.pullMin = 60;
        /**
         * The maximum distance of the pull until the refresher
         * will automatically go into the `refreshing` state.
         * Defaults to the result of `pullMin + 60`.
         * Does not apply when  the refresher content uses a spinner,
         * enabling the native refresher.
         */
        this.pullMax = this.pullMin + 60;
        /**
         * Time it takes to close the refresher.
         * Does not apply when the refresher content uses a spinner,
         * enabling the native refresher.
         */
        this.closeDuration = '280ms';
        /**
         * Time it takes the refresher to snap back to the `refreshing` state.
         * Does not apply when the refresher content uses a spinner,
         * enabling the native refresher.
         */
        this.snapbackDuration = '280ms';
        /**
         * How much to multiply the pull speed by. To slow the pull animation down,
         * pass a number less than `1`. To speed up the pull, pass a number greater
         * than `1`. The default value is `1` which is equal to the speed of the cursor.
         * If a negative value is passed in, the factor will be `1` instead.
         *
         * For example: If the value passed is `1.2` and the content is dragged by
         * `10` pixels, instead of `10` pixels the content will be pulled by `12` pixels
         * (an increase of 20 percent). If the value passed is `0.8`, the dragged amount
         * will be `8` pixels, less than the amount the cursor has moved.
         *
         * Does not apply when the refresher content uses a spinner,
         * enabling the native refresher.
         */
        this.pullFactor = 1;
        /**
         * If `true`, the refresher will be hidden.
         */
        this.disabled = false;
    }
    disabledChanged() {
        if (this.gesture) {
            this.gesture.enable(!this.disabled);
        }
    }
    async checkNativeRefresher() {
        const useNativeRefresher = await shouldUseNativeRefresher(this.el, getIonMode(this));
        if (useNativeRefresher && !this.nativeRefresher) {
            const contentEl = this.el.closest('ion-content');
            this.setupNativeRefresher(contentEl);
        }
        else if (!useNativeRefresher) {
            this.destroyNativeRefresher();
        }
    }
    destroyNativeRefresher() {
        if (this.scrollEl && this.scrollListenerCallback) {
            this.scrollEl.removeEventListener('scroll', this.scrollListenerCallback);
            this.scrollListenerCallback = undefined;
        }
        this.nativeRefresher = false;
    }
    async resetNativeRefresher(el, state) {
        this.state = state;
        if (getIonMode(this) === 'ios') {
            await translateElement(el, undefined, 300);
        }
        else {
            await transitionEndAsync(this.el.querySelector('.refresher-refreshing-icon'), 200);
        }
        this.didRefresh = false;
        this.needsCompletion = false;
        this.pointerDown = false;
        this.animations.forEach((ani) => ani.destroy());
        this.animations = [];
        this.progress = 0;
        this.state = 1 /* RefresherState.Inactive */;
    }
    async setupiOSNativeRefresher(pullingSpinner, refreshingSpinner) {
        this.elementToTransform = this.scrollEl;
        const ticks = pullingSpinner.shadowRoot.querySelectorAll('svg');
        let MAX_PULL = this.scrollEl.clientHeight * 0.16;
        const NUM_TICKS = ticks.length;
        writeTask(() => ticks.forEach((el) => el.style.setProperty('animation', 'none')));
        this.scrollListenerCallback = () => {
            // If pointer is not on screen or refresher is not active, ignore scroll
            if (!this.pointerDown && this.state === 1 /* RefresherState.Inactive */) {
                return;
            }
            readTask(() => {
                // PTR should only be active when overflow scrolling at the top
                const scrollTop = this.scrollEl.scrollTop;
                const refresherHeight = this.el.clientHeight;
                if (scrollTop > 0) {
                    /**
                     * If refresher is refreshing and user tries to scroll
                     * progressively fade refresher out/in
                     */
                    if (this.state === 8 /* RefresherState.Refreshing */) {
                        const ratio = clamp(0, scrollTop / (refresherHeight * 0.5), 1);
                        writeTask(() => setSpinnerOpacity(refreshingSpinner, 1 - ratio));
                        return;
                    }
                    return;
                }
                if (this.pointerDown) {
                    if (!this.didStart) {
                        this.didStart = true;
                        this.ionStart.emit();
                    }
                    // emit "pulling" on every move
                    if (this.pointerDown) {
                        this.ionPull.emit();
                    }
                }
                /**
                 * We want to delay the start of this gesture by ~30px
                 * when initially pulling down so the refresher does not
                 * overlap with the content. But when letting go of the
                 * gesture before the refresher completes, we want the
                 * refresher tick marks to quickly fade out.
                 */
                const offset = this.didStart ? 30 : 0;
                const pullAmount = (this.progress = clamp(0, (Math.abs(scrollTop) - offset) / MAX_PULL, 1));
                const shouldShowRefreshingSpinner = this.state === 8 /* RefresherState.Refreshing */ || pullAmount === 1;
                if (shouldShowRefreshingSpinner) {
                    if (this.pointerDown) {
                        handleScrollWhileRefreshing(refreshingSpinner, this.lastVelocityY);
                    }
                    if (!this.didRefresh) {
                        this.beginRefresh();
                        this.didRefresh = true;
                        hapticImpact({ style: ImpactStyle.Light });
                        /**
                         * Translate the content element otherwise when pointer is removed
                         * from screen the scroll content will bounce back over the refresher
                         */
                        if (!this.pointerDown) {
                            translateElement(this.elementToTransform, `${refresherHeight}px`);
                        }
                    }
                }
                else {
                    this.state = 2 /* RefresherState.Pulling */;
                    handleScrollWhilePulling(ticks, NUM_TICKS, pullAmount);
                }
            });
        };
        this.scrollEl.addEventListener('scroll', this.scrollListenerCallback);
        this.gesture = (await import('./index3.js')).createGesture({
            el: this.scrollEl,
            gestureName: 'refresher',
            gesturePriority: 31,
            direction: 'y',
            threshold: 5,
            onStart: () => {
                this.pointerDown = true;
                if (!this.didRefresh) {
                    translateElement(this.elementToTransform, '0px');
                }
                /**
                 * If the content had `display: none` when
                 * the refresher was initialized, its clientHeight
                 * will be 0. When the gesture starts, the content
                 * will be visible, so try to get the correct
                 * client height again. This is most common when
                 * using the refresher in an ion-menu.
                 */
                if (MAX_PULL === 0) {
                    MAX_PULL = this.scrollEl.clientHeight * 0.16;
                }
            },
            onMove: (ev) => {
                this.lastVelocityY = ev.velocityY;
            },
            onEnd: () => {
                this.pointerDown = false;
                this.didStart = false;
                if (this.needsCompletion) {
                    this.resetNativeRefresher(this.elementToTransform, 32 /* RefresherState.Completing */);
                    this.needsCompletion = false;
                }
                else if (this.didRefresh) {
                    readTask(() => translateElement(this.elementToTransform, `${this.el.clientHeight}px`));
                }
            },
        });
        this.disabledChanged();
    }
    async setupMDNativeRefresher(contentEl, pullingSpinner, refreshingSpinner) {
        const circle = getElementRoot(pullingSpinner).querySelector('circle');
        const pullingRefresherIcon = this.el.querySelector('ion-refresher-content .refresher-pulling-icon');
        const refreshingCircle = getElementRoot(refreshingSpinner).querySelector('circle');
        if (circle !== null && refreshingCircle !== null) {
            writeTask(() => {
                circle.style.setProperty('animation', 'none');
                // This lines up the animation on the refreshing spinner with the pulling spinner
                refreshingSpinner.style.setProperty('animation-delay', '-655ms');
                refreshingCircle.style.setProperty('animation-delay', '-655ms');
            });
        }
        this.gesture = (await import('./index3.js')).createGesture({
            el: this.scrollEl,
            gestureName: 'refresher',
            gesturePriority: 31,
            direction: 'y',
            threshold: 5,
            canStart: () => this.state !== 8 /* RefresherState.Refreshing */ &&
                this.state !== 32 /* RefresherState.Completing */ &&
                this.scrollEl.scrollTop === 0,
            onStart: (ev) => {
                this.progress = 0;
                ev.data = { animation: undefined, didStart: false, cancelled: false };
            },
            onMove: (ev) => {
                if ((ev.velocityY < 0 && this.progress === 0 && !ev.data.didStart) || ev.data.cancelled) {
                    ev.data.cancelled = true;
                    return;
                }
                if (!ev.data.didStart) {
                    ev.data.didStart = true;
                    this.state = 2 /* RefresherState.Pulling */;
                    // When ion-refresher is being used with a custom scroll target, the overflow styles need to be applied directly instead of via a css variable
                    const { scrollEl } = this;
                    const overflowProperty = scrollEl.matches(ION_CONTENT_CLASS_SELECTOR) ? 'overflow' : '--overflow';
                    writeTask(() => scrollEl.style.setProperty(overflowProperty, 'hidden'));
                    const animationType = getRefresherAnimationType(contentEl);
                    const animation = createPullingAnimation(animationType, pullingRefresherIcon, this.el);
                    ev.data.animation = animation;
                    animation.progressStart(false, 0);
                    this.ionStart.emit();
                    this.animations.push(animation);
                    return;
                }
                // Since we are using an easing curve, slow the gesture tracking down a bit
                this.progress = clamp(0, (ev.deltaY / 180) * 0.5, 1);
                ev.data.animation.progressStep(this.progress);
                this.ionPull.emit();
            },
            onEnd: (ev) => {
                if (!ev.data.didStart) {
                    return;
                }
                this.gesture.enable(false);
                const { scrollEl } = this;
                const overflowProperty = scrollEl.matches(ION_CONTENT_CLASS_SELECTOR) ? 'overflow' : '--overflow';
                writeTask(() => scrollEl.style.removeProperty(overflowProperty));
                if (this.progress <= 0.4) {
                    ev.data.animation.progressEnd(0, this.progress, 500).onFinish(() => {
                        this.animations.forEach((ani) => ani.destroy());
                        this.animations = [];
                        this.gesture.enable(true);
                        this.state = 1 /* RefresherState.Inactive */;
                    });
                    return;
                }
                const progress = getTimeGivenProgression([0, 0], [0, 0], [1, 1], [1, 1], this.progress)[0];
                const snapBackAnimation = createSnapBackAnimation(pullingRefresherIcon);
                this.animations.push(snapBackAnimation);
                writeTask(async () => {
                    pullingRefresherIcon.style.setProperty('--ion-pulling-refresher-translate', `${progress * 100}px`);
                    ev.data.animation.progressEnd();
                    await snapBackAnimation.play();
                    this.beginRefresh();
                    ev.data.animation.destroy();
                    this.gesture.enable(true);
                });
            },
        });
        this.disabledChanged();
    }
    async setupNativeRefresher(contentEl) {
        if (this.scrollListenerCallback || !contentEl || this.nativeRefresher || !this.scrollEl) {
            return;
        }
        /**
         * If using non-native refresher before make sure
         * we clean up any old CSS. This can happen when
         * a user manually calls the refresh method in a
         * component create callback before the native
         * refresher is setup.
         */
        this.setCss(0, '', false, '');
        this.nativeRefresher = true;
        const pullingSpinner = this.el.querySelector('ion-refresher-content .refresher-pulling ion-spinner');
        const refreshingSpinner = this.el.querySelector('ion-refresher-content .refresher-refreshing ion-spinner');
        if (getIonMode(this) === 'ios') {
            this.setupiOSNativeRefresher(pullingSpinner, refreshingSpinner);
        }
        else {
            this.setupMDNativeRefresher(contentEl, pullingSpinner, refreshingSpinner);
        }
    }
    componentDidUpdate() {
        this.checkNativeRefresher();
    }
    async connectedCallback() {
        if (this.el.getAttribute('slot') !== 'fixed') {
            printIonError('[ion-refresher] - Make sure you use: <ion-refresher slot="fixed">');
            return;
        }
        const contentEl = this.el.closest(ION_CONTENT_ELEMENT_SELECTOR);
        if (!contentEl) {
            printIonContentErrorMsg(this.el);
            return;
        }
        /**
         * Waits for the content to be ready before querying the scroll
         * or the background content element.
         */
        componentOnReady(contentEl, async () => {
            const customScrollTarget = contentEl.querySelector(ION_CONTENT_CLASS_SELECTOR);
            /**
             * Query the custom scroll target (if available), first. In refresher implementations,
             * the ion-refresher element will always be a direct child of ion-content (slot="fixed"). By
             * querying the custom scroll target first and falling back to the ion-content element,
             * the correct scroll element will be returned by the implementation.
             */
            this.scrollEl = await getScrollElement(customScrollTarget !== null && customScrollTarget !== void 0 ? customScrollTarget : contentEl);
            /**
             * Query the background content element from the host ion-content element directly.
             */
            this.backgroundContentEl = await contentEl.getBackgroundElement();
            /**
             * Check if the content element is fullscreen to apply the correct styles
             * when the refresher is refreshing. Otherwise, the refresher will be
             * hidden because it is positioned behind the background content element.
             */
            this.contentFullscreen = contentEl.fullscreen;
            if (await shouldUseNativeRefresher(this.el, getIonMode(this))) {
                this.setupNativeRefresher(contentEl);
            }
            else {
                this.gesture = (await import('./index3.js')).createGesture({
                    el: contentEl,
                    gestureName: 'refresher',
                    gesturePriority: 31,
                    direction: 'y',
                    threshold: 20,
                    passive: false,
                    canStart: () => this.canStart(),
                    onStart: () => this.onStart(),
                    onMove: (ev) => this.onMove(ev),
                    onEnd: () => this.onEnd(),
                });
                this.disabledChanged();
            }
        });
    }
    disconnectedCallback() {
        this.destroyNativeRefresher();
        this.scrollEl = undefined;
        if (this.gesture) {
            this.gesture.destroy();
            this.gesture = undefined;
        }
    }
    /**
     * Call `complete()` when your async operation has completed.
     * For example, the `refreshing` state is while the app is performing
     * an asynchronous operation, such as receiving more data from an
     * AJAX request. Once the data has been received, you then call this
     * method to signify that the refreshing has completed and to close
     * the refresher. This method also changes the refresher's state from
     * `refreshing` to `completing`.
     */
    async complete() {
        if (this.nativeRefresher) {
            this.needsCompletion = true;
            // Do not reset scroll el until user removes pointer from screen
            if (!this.pointerDown) {
                raf(() => raf(() => this.resetNativeRefresher(this.elementToTransform, 32 /* RefresherState.Completing */)));
            }
        }
        else {
            this.close(32 /* RefresherState.Completing */, '120ms');
        }
    }
    /**
     * Changes the refresher's state from `refreshing` to `cancelling`.
     */
    async cancel() {
        if (this.nativeRefresher) {
            // Do not reset scroll el until user removes pointer from screen
            if (!this.pointerDown) {
                raf(() => raf(() => this.resetNativeRefresher(this.elementToTransform, 16 /* RefresherState.Cancelling */)));
            }
        }
        else {
            this.close(16 /* RefresherState.Cancelling */, '');
        }
    }
    /**
     * A number representing how far down the user has pulled.
     * The number `0` represents the user hasn't pulled down at all. The
     * number `1`, and anything greater than `1`, represents that the user
     * has pulled far enough down that when they let go then the refresh will
     * happen. If they let go and the number is less than `1`, then the
     * refresh will not happen, and the content will return to it's original
     * position.
     */
    getProgress() {
        return Promise.resolve(this.progress);
    }
    canStart() {
        if (!this.scrollEl) {
            return false;
        }
        if (this.state !== 1 /* RefresherState.Inactive */) {
            return false;
        }
        // if the scrollTop is greater than zero then it's
        // not possible to pull the content down yet
        if (this.scrollEl.scrollTop > 0) {
            return false;
        }
        return true;
    }
    onStart() {
        this.progress = 0;
        this.state = 1 /* RefresherState.Inactive */;
        this.memoizeOverflowStyle();
        /**
         * If the content is fullscreen, then we need to
         * set the offset-top style on the background content
         * element to ensure that the refresher is shown.
         */
        if (this.contentFullscreen && this.backgroundContentEl) {
            this.backgroundContentEl.style.setProperty('--offset-top', '0px');
        }
    }
    onMove(detail) {
        if (!this.scrollEl) {
            return;
        }
        // this method can get called like a bazillion times per second,
        // so it's built to be as efficient as possible, and does its
        // best to do any DOM read/writes only when absolutely necessary
        // if multi-touch then get out immediately
        const ev = detail.event;
        if (ev.touches !== undefined && ev.touches.length > 1) {
            return;
        }
        // do nothing if it's actively refreshing
        // or it's in the way of closing
        // or this was never a startY
        if ((this.state & 56 /* RefresherState._BUSY_ */) !== 0) {
            return;
        }
        const pullFactor = Number.isNaN(this.pullFactor) || this.pullFactor < 0 ? 1 : this.pullFactor;
        const deltaY = detail.deltaY * pullFactor;
        // don't bother if they're scrolling up
        // and have not already started dragging
        if (deltaY <= 0) {
            // the current Y is higher than the starting Y
            // so they scrolled up enough to be ignored
            this.progress = 0;
            this.state = 1 /* RefresherState.Inactive */;
            if (this.appliedStyles) {
                // reset the styles only if they were applied
                this.setCss(0, '', false, '');
                return;
            }
            return;
        }
        if (this.state === 1 /* RefresherState.Inactive */) {
            // this refresh is not already actively pulling down
            // get the content's scrollTop
            const scrollHostScrollTop = this.scrollEl.scrollTop;
            // if the scrollTop is greater than zero then it's
            // not possible to pull the content down yet
            if (scrollHostScrollTop > 0) {
                this.progress = 0;
                return;
            }
            // content scrolled all the way to the top, and dragging down
            this.state = 2 /* RefresherState.Pulling */;
        }
        // prevent native scroll events
        if (ev.cancelable) {
            ev.preventDefault();
        }
        // the refresher is actively pulling at this point
        // move the scroll element within the content element
        this.setCss(deltaY, '0ms', true, '');
        if (deltaY === 0) {
            // don't continue if there's no delta yet
            this.progress = 0;
            return;
        }
        const pullMin = this.pullMin;
        // set pull progress
        this.progress = deltaY / pullMin;
        // emit "start" if it hasn't started yet
        if (!this.didStart) {
            this.didStart = true;
            this.ionStart.emit();
        }
        // emit "pulling" on every move
        this.ionPull.emit();
        // do nothing if the delta is less than the pull threshold
        if (deltaY < pullMin) {
            // ensure it stays in the pulling state, cuz its not ready yet
            this.state = 2 /* RefresherState.Pulling */;
            return;
        }
        if (deltaY > this.pullMax) {
            // they pulled farther than the max, so kick off the refresh
            this.beginRefresh();
            return;
        }
        // pulled farther than the pull min!!
        // it is now in the `ready` state!!
        // if they let go then it'll refresh, kerpow!!
        this.state = 4 /* RefresherState.Ready */;
        return;
    }
    onEnd() {
        // only run in a zone when absolutely necessary
        if (this.state === 4 /* RefresherState.Ready */) {
            // they pulled down far enough, so it's ready to refresh
            this.beginRefresh();
        }
        else if (this.state === 2 /* RefresherState.Pulling */) {
            // they were pulling down, but didn't pull down far enough
            // set the content back to it's original location
            // and close the refresher
            // set that the refresh is actively cancelling
            this.cancel();
        }
        else if (this.state === 1 /* RefresherState.Inactive */) {
            /**
             * The pull to refresh gesture was aborted
             * so we should immediately restore any overflow styles
             * that have been modified. Do not call this.cancel
             * because the styles will only be reset after a timeout.
             * If the gesture is aborted then scrolling should be
             * available right away.
             */
            this.restoreOverflowStyle();
        }
    }
    beginRefresh() {
        // assumes we're already back in a zone
        // they pulled down far enough, so it's ready to refresh
        this.state = 8 /* RefresherState.Refreshing */;
        // place the content in a hangout position while it thinks
        this.setCss(this.pullMin, this.snapbackDuration, true, '');
        // emit "refresh" because it was pulled down far enough
        // and they let go to begin refreshing
        this.ionRefresh.emit({
            complete: this.complete.bind(this),
        });
    }
    close(state, delay) {
        // create fallback timer incase something goes wrong with transitionEnd event
        setTimeout(() => {
            var _a;
            this.state = 1 /* RefresherState.Inactive */;
            this.progress = 0;
            this.didStart = false;
            /**
             * Reset any overflow styles so the
             * user can scroll again.
             */
            this.setCss(0, '0ms', false, '', true);
            /**
             * Reset the offset-top style on the background content
             * when the refresher is no longer refreshing and the
             * content is fullscreen.
             *
             * This ensures that the behavior of background content
             * does not change when refreshing is complete.
             */
            if (this.contentFullscreen && this.backgroundContentEl) {
                (_a = this.backgroundContentEl) === null || _a === void 0 ? void 0 : _a.style.removeProperty('--offset-top');
            }
        }, 600);
        // reset the styles on the scroll element
        // set that the refresh is actively cancelling/completing
        this.state = state;
        this.setCss(0, this.closeDuration, true, delay);
    }
    setCss(y, duration, overflowVisible, delay, shouldRestoreOverflowStyle = false) {
        if (this.nativeRefresher) {
            return;
        }
        this.appliedStyles = y > 0;
        writeTask(() => {
            if (this.scrollEl && this.backgroundContentEl) {
                const scrollStyle = this.scrollEl.style;
                const backgroundStyle = this.backgroundContentEl.style;
                scrollStyle.transform = backgroundStyle.transform = y > 0 ? `translateY(${y}px) translateZ(0px)` : '';
                scrollStyle.transitionDuration = backgroundStyle.transitionDuration = duration;
                scrollStyle.transitionDelay = backgroundStyle.transitionDelay = delay;
                scrollStyle.overflow = overflowVisible ? 'hidden' : '';
            }
            /**
             * Reset the overflow styles only once
             * the pull to refresh effect has been closed.
             * This ensures that the gesture is done
             * and the refresh operation has either
             * been aborted or has completed.
             */
            if (shouldRestoreOverflowStyle) {
                this.restoreOverflowStyle();
            }
        });
    }
    memoizeOverflowStyle() {
        if (this.scrollEl) {
            const { overflow, overflowX, overflowY } = this.scrollEl.style;
            this.overflowStyles = {
                overflow: overflow !== null && overflow !== void 0 ? overflow : '',
                overflowX: overflowX !== null && overflowX !== void 0 ? overflowX : '',
                overflowY: overflowY !== null && overflowY !== void 0 ? overflowY : '',
            };
        }
    }
    restoreOverflowStyle() {
        if (this.overflowStyles !== undefined && this.scrollEl !== undefined) {
            const { overflow, overflowX, overflowY } = this.overflowStyles;
            this.scrollEl.style.overflow = overflow;
            this.scrollEl.style.overflowX = overflowX;
            this.scrollEl.style.overflowY = overflowY;
            this.overflowStyles = undefined;
        }
    }
    render() {
        const mode = getIonMode(this);
        return (h(Host, { key: '8c7a5cc32da02a9cbeaa954258148683f60a6d1b', slot: "fixed", class: {
                [mode]: true,
                // Used internally for styling
                [`refresher-${mode}`]: true,
                'refresher-native': this.nativeRefresher,
                'refresher-active': this.state !== 1 /* RefresherState.Inactive */,
                'refresher-pulling': this.state === 2 /* RefresherState.Pulling */,
                'refresher-ready': this.state === 4 /* RefresherState.Ready */,
                'refresher-refreshing': this.state === 8 /* RefresherState.Refreshing */,
                'refresher-cancelling': this.state === 16 /* RefresherState.Cancelling */,
                'refresher-completing': this.state === 32 /* RefresherState.Completing */,
            } }));
    }
    get el() { return this; }
    static get watchers() { return {
        "disabled": ["disabledChanged"]
    }; }
    static get style() { return {
        ios: refresherIosCss,
        md: refresherMdCss
    }; }
}, [32, "ion-refresher", {
        "pullMin": [2, "pull-min"],
        "pullMax": [2, "pull-max"],
        "closeDuration": [1, "close-duration"],
        "snapbackDuration": [1, "snapback-duration"],
        "pullFactor": [2, "pull-factor"],
        "disabled": [4],
        "nativeRefresher": [32],
        "state": [32],
        "complete": [64],
        "cancel": [64],
        "getProgress": [64]
    }, undefined, {
        "disabled": ["disabledChanged"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-refresher"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-refresher":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Refresher);
            }
            break;
    } });
}

const IonRefresher = Refresher;
const defineCustomElement = defineCustomElement$1;

export { IonRefresher, defineCustomElement };
