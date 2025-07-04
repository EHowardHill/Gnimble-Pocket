/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, h } from '@stencil/core/internal/client';
import { g as getTimeGivenProgression } from './cubic-bezier.js';
import { a as attachComponent, d as detachComponent } from './framework-delegate.js';
import { s as shallowEqualStringMap, k as hasLazyBuild } from './helpers.js';
import { c as createLockController } from './lock-controller.js';
import { a as printIonError, c as config } from './index4.js';
import { t as transition } from './index2.js';
import { b as getIonMode } from './ionic-global.js';

const routerOutletCss = ":host{left:0;right:0;top:0;bottom:0;position:absolute;contain:layout size style;z-index:0}";

const RouterOutlet = /*@__PURE__*/ proxyCustomElement(class RouterOutlet extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionNavWillLoad = createEvent(this, "ionNavWillLoad", 7);
        this.ionNavWillChange = createEvent(this, "ionNavWillChange", 3);
        this.ionNavDidChange = createEvent(this, "ionNavDidChange", 3);
        this.lockController = createLockController();
        this.gestureOrAnimationInProgress = false;
        /**
         * The mode determines which platform styles to use.
         */
        this.mode = getIonMode(this);
        /**
         * If `true`, the router-outlet should animate the transition of components.
         */
        this.animated = true;
    }
    swipeHandlerChanged() {
        if (this.gesture) {
            this.gesture.enable(this.swipeHandler !== undefined);
        }
    }
    async connectedCallback() {
        const onStart = () => {
            this.gestureOrAnimationInProgress = true;
            if (this.swipeHandler) {
                this.swipeHandler.onStart();
            }
        };
        this.gesture = (await import('./swipe-back.js')).createSwipeBackGesture(this.el, () => !this.gestureOrAnimationInProgress && !!this.swipeHandler && this.swipeHandler.canStart(), () => onStart(), (step) => { var _a; return (_a = this.ani) === null || _a === void 0 ? void 0 : _a.progressStep(step); }, (shouldComplete, step, dur) => {
            if (this.ani) {
                this.ani.onFinish(() => {
                    this.gestureOrAnimationInProgress = false;
                    if (this.swipeHandler) {
                        this.swipeHandler.onEnd(shouldComplete);
                    }
                }, { oneTimeCallback: true });
                // Account for rounding errors in JS
                let newStepValue = shouldComplete ? -1e-3 : 0.001;
                /**
                 * Animation will be reversed here, so need to
                 * reverse the easing curve as well
                 *
                 * Additionally, we need to account for the time relative
                 * to the new easing curve, as `stepValue` is going to be given
                 * in terms of a linear curve.
                 */
                if (!shouldComplete) {
                    this.ani.easing('cubic-bezier(1, 0, 0.68, 0.28)');
                    newStepValue += getTimeGivenProgression([0, 0], [1, 0], [0.68, 0.28], [1, 1], step)[0];
                }
                else {
                    newStepValue += getTimeGivenProgression([0, 0], [0.32, 0.72], [0, 1], [1, 1], step)[0];
                }
                this.ani.progressEnd(shouldComplete ? 1 : 0, newStepValue, dur);
            }
            else {
                this.gestureOrAnimationInProgress = false;
            }
        });
        this.swipeHandlerChanged();
    }
    componentWillLoad() {
        this.ionNavWillLoad.emit();
    }
    disconnectedCallback() {
        if (this.gesture) {
            this.gesture.destroy();
            this.gesture = undefined;
        }
    }
    /** @internal */
    async commit(enteringEl, leavingEl, opts) {
        const unlock = await this.lockController.lock();
        let changed = false;
        try {
            changed = await this.transition(enteringEl, leavingEl, opts);
        }
        catch (e) {
            printIonError('[ion-router-outlet] - Exception in commit:', e);
        }
        unlock();
        return changed;
    }
    /** @internal */
    async setRouteId(id, params, direction, animation) {
        const changed = await this.setRoot(id, params, {
            duration: direction === 'root' ? 0 : undefined,
            direction: direction === 'back' ? 'back' : 'forward',
            animationBuilder: animation,
        });
        return {
            changed,
            element: this.activeEl,
        };
    }
    /** @internal */
    async getRouteId() {
        const active = this.activeEl;
        return active
            ? {
                id: active.tagName,
                element: active,
                params: this.activeParams,
            }
            : undefined;
    }
    async setRoot(component, params, opts) {
        if (this.activeComponent === component && shallowEqualStringMap(params, this.activeParams)) {
            return false;
        }
        // attach entering view to DOM
        const leavingEl = this.activeEl;
        const enteringEl = await attachComponent(this.delegate, this.el, component, ['ion-page', 'ion-page-invisible'], params);
        this.activeComponent = component;
        this.activeEl = enteringEl;
        this.activeParams = params;
        // commit animation
        await this.commit(enteringEl, leavingEl, opts);
        await detachComponent(this.delegate, leavingEl);
        return true;
    }
    async transition(enteringEl, leavingEl, opts = {}) {
        if (leavingEl === enteringEl) {
            return false;
        }
        // emit nav will change event
        this.ionNavWillChange.emit();
        const { el, mode } = this;
        const animated = this.animated && config.getBoolean('animated', true);
        const animationBuilder = opts.animationBuilder || this.animation || config.get('navAnimation');
        await transition(Object.assign(Object.assign({ mode,
            animated,
            enteringEl,
            leavingEl, baseEl: el,
            /**
             * We need to wait for all Stencil components
             * to be ready only when using the lazy
             * loaded bundle.
             */
            deepWait: hasLazyBuild(el), progressCallback: opts.progressAnimation
                ? (ani) => {
                    /**
                     * Because this progress callback is called asynchronously
                     * it is possible for the gesture to start and end before
                     * the animation is ever set. In that scenario, we should
                     * immediately call progressEnd so that the transition promise
                     * resolves and the gesture does not get locked up.
                     */
                    if (ani !== undefined && !this.gestureOrAnimationInProgress) {
                        this.gestureOrAnimationInProgress = true;
                        ani.onFinish(() => {
                            this.gestureOrAnimationInProgress = false;
                            if (this.swipeHandler) {
                                this.swipeHandler.onEnd(false);
                            }
                        }, { oneTimeCallback: true });
                        /**
                         * Playing animation to beginning
                         * with a duration of 0 prevents
                         * any flickering when the animation
                         * is later cleaned up.
                         */
                        ani.progressEnd(0, 0, 0);
                    }
                    else {
                        this.ani = ani;
                    }
                }
                : undefined }, opts), { animationBuilder }));
        // emit nav changed event
        this.ionNavDidChange.emit();
        return true;
    }
    render() {
        return h("slot", { key: '84b50f1155b0d780dff802ee13223287259fd525' });
    }
    get el() { return this; }
    static get watchers() { return {
        "swipeHandler": ["swipeHandlerChanged"]
    }; }
    static get style() { return routerOutletCss; }
}, [1, "ion-router-outlet", {
        "mode": [1025],
        "delegate": [16],
        "animated": [4],
        "animation": [16],
        "swipeHandler": [16, "swipe-handler"],
        "commit": [64],
        "setRouteId": [64],
        "getRouteId": [64]
    }, undefined, {
        "swipeHandler": ["swipeHandlerChanged"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-router-outlet"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-router-outlet":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, RouterOutlet);
            }
            break;
    } });
}

const IonRouterOutlet = RouterOutlet;
const defineCustomElement = defineCustomElement$1;

export { IonRouterOutlet, defineCustomElement };
