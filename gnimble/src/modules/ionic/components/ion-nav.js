/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, h, Build } from '@stencil/core/internal/client';
import { g as getTimeGivenProgression } from './cubic-bezier.js';
import { s as shallowEqualStringMap, n as assert } from './helpers.js';
import { p as printIonWarning, c as config } from './index4.js';
import { l as lifecycle, t as transition, s as setPageHidden, d as LIFECYCLE_WILL_UNLOAD, b as LIFECYCLE_WILL_LEAVE, c as LIFECYCLE_DID_LEAVE } from './index2.js';
import { b as getIonMode } from './ionic-global.js';
import { a as attachComponent } from './framework-delegate.js';

const VIEW_STATE_NEW = 1;
const VIEW_STATE_ATTACHED = 2;
const VIEW_STATE_DESTROYED = 3;
// TODO(FW-2832): types
class ViewController {
    constructor(component, params) {
        this.component = component;
        this.params = params;
        this.state = VIEW_STATE_NEW;
    }
    async init(container) {
        this.state = VIEW_STATE_ATTACHED;
        if (!this.element) {
            const component = this.component;
            this.element = await attachComponent(this.delegate, container, component, ['ion-page', 'ion-page-invisible'], this.params);
        }
    }
    /**
     * DOM WRITE
     */
    _destroy() {
        assert(this.state !== VIEW_STATE_DESTROYED, 'view state must be ATTACHED');
        const element = this.element;
        if (element) {
            if (this.delegate) {
                this.delegate.removeViewFromDom(element.parentElement, element);
            }
            else {
                element.remove();
            }
        }
        this.nav = undefined;
        this.state = VIEW_STATE_DESTROYED;
    }
}
const matches = (view, id, params) => {
    if (!view) {
        return false;
    }
    if (view.component !== id) {
        return false;
    }
    return shallowEqualStringMap(view.params, params);
};
const convertToView = (page, params) => {
    if (!page) {
        return null;
    }
    if (page instanceof ViewController) {
        return page;
    }
    return new ViewController(page, params);
};
const convertToViews = (pages) => {
    return pages
        .map((page) => {
        if (page instanceof ViewController) {
            return page;
        }
        if ('component' in page) {
            return convertToView(page.component, page.componentProps === null ? undefined : page.componentProps);
        }
        return convertToView(page, undefined);
    })
        .filter((v) => v !== null);
};

const navCss = ":host{left:0;right:0;top:0;bottom:0;position:absolute;contain:layout size style;z-index:0}";

const Nav = /*@__PURE__*/ proxyCustomElement(class Nav extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionNavWillLoad = createEvent(this, "ionNavWillLoad", 7);
        this.ionNavWillChange = createEvent(this, "ionNavWillChange", 3);
        this.ionNavDidChange = createEvent(this, "ionNavDidChange", 3);
        this.transInstr = [];
        this.gestureOrAnimationInProgress = false;
        this.useRouter = false;
        this.isTransitioning = false;
        this.destroyed = false;
        this.views = [];
        this.didLoad = false;
        /**
         * If `true`, the nav should animate the transition of components.
         */
        this.animated = true;
    }
    swipeGestureChanged() {
        if (this.gesture) {
            this.gesture.enable(this.swipeGesture === true);
        }
    }
    rootChanged() {
        const isDev = Build.isDev;
        if (this.root === undefined) {
            return;
        }
        if (this.didLoad === false) {
            /**
             * If the component has not loaded yet, we can skip setting up the root component.
             * It will be called when `componentDidLoad` fires.
             */
            return;
        }
        if (!this.useRouter) {
            if (this.root !== undefined) {
                this.setRoot(this.root, this.rootParams);
            }
        }
        else if (isDev) {
            printIonWarning('[ion-nav] - A root attribute is not supported when using ion-router.', this.el);
        }
    }
    componentWillLoad() {
        this.useRouter = document.querySelector('ion-router') !== null && this.el.closest('[no-router]') === null;
        if (this.swipeGesture === undefined) {
            const mode = getIonMode(this);
            this.swipeGesture = config.getBoolean('swipeBackEnabled', mode === 'ios');
        }
        this.ionNavWillLoad.emit();
    }
    async componentDidLoad() {
        // We want to set this flag before any watch callbacks are manually called
        this.didLoad = true;
        this.rootChanged();
        this.gesture = (await import('./swipe-back.js')).createSwipeBackGesture(this.el, this.canStart.bind(this), this.onStart.bind(this), this.onMove.bind(this), this.onEnd.bind(this));
        this.swipeGestureChanged();
    }
    connectedCallback() {
        this.destroyed = false;
    }
    disconnectedCallback() {
        for (const view of this.views) {
            lifecycle(view.element, LIFECYCLE_WILL_UNLOAD);
            view._destroy();
        }
        // Release swipe back gesture and transition.
        if (this.gesture) {
            this.gesture.destroy();
            this.gesture = undefined;
        }
        this.transInstr.length = 0;
        this.views.length = 0;
        this.destroyed = true;
    }
    /**
     * Push a new component onto the current navigation stack. Pass any additional
     * information along as an object. This additional information is accessible
     * through NavParams.
     *
     * @param component The component to push onto the navigation stack.
     * @param componentProps Any properties of the component.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    push(component, componentProps, opts, done) {
        return this.insert(-1, component, componentProps, opts, done);
    }
    /**
     * Inserts a component into the navigation stack at the specified index.
     * This is useful to add a component at any point in the navigation stack.
     *
     * @param insertIndex The index to insert the component at in the stack.
     * @param component The component to insert into the navigation stack.
     * @param componentProps Any properties of the component.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    insert(insertIndex, component, componentProps, opts, done) {
        return this.insertPages(insertIndex, [{ component, componentProps }], opts, done);
    }
    /**
     * Inserts an array of components into the navigation stack at the specified index.
     * The last component in the array will become instantiated as a view, and animate
     * in to become the active view.
     *
     * @param insertIndex The index to insert the components at in the stack.
     * @param insertComponents The components to insert into the navigation stack.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    insertPages(insertIndex, insertComponents, opts, done) {
        return this.queueTrns({
            insertStart: insertIndex,
            insertViews: insertComponents,
            opts,
        }, done);
    }
    /**
     * Pop a component off of the navigation stack. Navigates back from the current
     * component.
     *
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    pop(opts, done) {
        return this.removeIndex(-1, 1, opts, done);
    }
    /**
     * Pop to a specific index in the navigation stack.
     *
     * @param indexOrViewCtrl The index or view controller to pop to.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    popTo(indexOrViewCtrl, opts, done) {
        const ti = {
            removeStart: -1,
            removeCount: -1,
            opts,
        };
        if (typeof indexOrViewCtrl === 'object' && indexOrViewCtrl.component) {
            ti.removeView = indexOrViewCtrl;
            ti.removeStart = 1;
        }
        else if (typeof indexOrViewCtrl === 'number') {
            ti.removeStart = indexOrViewCtrl + 1;
        }
        return this.queueTrns(ti, done);
    }
    /**
     * Navigate back to the root of the stack, no matter how far back that is.
     *
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    popToRoot(opts, done) {
        return this.removeIndex(1, -1, opts, done);
    }
    /**
     * Removes a component from the navigation stack at the specified index.
     *
     * @param startIndex The number to begin removal at.
     * @param removeCount The number of components to remove.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    removeIndex(startIndex, removeCount = 1, opts, done) {
        return this.queueTrns({
            removeStart: startIndex,
            removeCount,
            opts,
        }, done);
    }
    /**
     * Set the root for the current navigation stack to a component.
     *
     * @param component The component to set as the root of the navigation stack.
     * @param componentProps Any properties of the component.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    setRoot(component, componentProps, opts, done) {
        return this.setPages([{ component, componentProps }], opts, done);
    }
    /**
     * Set the views of the current navigation stack and navigate to the last view.
     * By default animations are disabled, but they can be enabled by passing options
     * to the navigation controller. Navigation parameters can also be passed to the
     * individual pages in the array.
     *
     * @param views The list of views to set as the navigation stack.
     * @param opts The navigation options.
     * @param done The transition complete function.
     */
    setPages(views, opts, done) {
        opts !== null && opts !== void 0 ? opts : (opts = {});
        // if animation wasn't set to true then default it to NOT animate
        if (opts.animated !== true) {
            opts.animated = false;
        }
        return this.queueTrns({
            insertStart: 0,
            insertViews: views,
            removeStart: 0,
            removeCount: -1,
            opts,
        }, done);
    }
    /**
     * Called by the router to update the view.
     *
     * @param id The component tag.
     * @param params The component params.
     * @param direction A direction hint.
     * @param animation an AnimationBuilder.
     *
     * @return the status.
     * @internal
     */
    setRouteId(id, params, direction, animation) {
        const active = this.getActiveSync();
        if (matches(active, id, params)) {
            return Promise.resolve({
                changed: false,
                element: active.element,
            });
        }
        let resolve;
        const promise = new Promise((r) => (resolve = r));
        let finish;
        const commonOpts = {
            updateURL: false,
            viewIsReady: (enteringEl) => {
                let mark;
                const p = new Promise((r) => (mark = r));
                resolve({
                    changed: true,
                    element: enteringEl,
                    markVisible: async () => {
                        mark();
                        await finish;
                    },
                });
                return p;
            },
        };
        if (direction === 'root') {
            finish = this.setRoot(id, params, commonOpts);
        }
        else {
            // Look for a view matching the target in the view stack.
            const viewController = this.views.find((v) => matches(v, id, params));
            if (viewController) {
                finish = this.popTo(viewController, Object.assign(Object.assign({}, commonOpts), { direction: 'back', animationBuilder: animation }));
            }
            else if (direction === 'forward') {
                finish = this.push(id, params, Object.assign(Object.assign({}, commonOpts), { animationBuilder: animation }));
            }
            else if (direction === 'back') {
                finish = this.setRoot(id, params, Object.assign(Object.assign({}, commonOpts), { direction: 'back', animated: true, animationBuilder: animation }));
            }
        }
        return promise;
    }
    /**
     * Called by <ion-router> to retrieve the current component.
     *
     * @internal
     */
    async getRouteId() {
        const active = this.getActiveSync();
        if (active) {
            return {
                id: active.element.tagName,
                params: active.params,
                element: active.element,
            };
        }
        return undefined;
    }
    /**
     * Get the active view.
     */
    async getActive() {
        return this.getActiveSync();
    }
    /**
     * Get the view at the specified index.
     *
     * @param index The index of the view.
     */
    async getByIndex(index) {
        return this.views[index];
    }
    /**
     * Returns `true` if the current view can go back.
     *
     * @param view The view to check.
     */
    async canGoBack(view) {
        return this.canGoBackSync(view);
    }
    /**
     * Get the previous view.
     *
     * @param view The view to get.
     */
    async getPrevious(view) {
        return this.getPreviousSync(view);
    }
    /**
     * Returns the number of views in the stack.
     */
    async getLength() {
        return Promise.resolve(this.views.length);
    }
    getActiveSync() {
        return this.views[this.views.length - 1];
    }
    canGoBackSync(view = this.getActiveSync()) {
        return !!(view && this.getPreviousSync(view));
    }
    getPreviousSync(view = this.getActiveSync()) {
        if (!view) {
            return undefined;
        }
        const views = this.views;
        const index = views.indexOf(view);
        return index > 0 ? views[index - 1] : undefined;
    }
    /**
     * Adds a navigation stack change to the queue and schedules it to run.
     *
     * @returns Whether the transition succeeds.
     */
    async queueTrns(ti, done) {
        var _a, _b;
        if (this.isTransitioning && ((_a = ti.opts) === null || _a === void 0 ? void 0 : _a.skipIfBusy)) {
            return false;
        }
        const promise = new Promise((resolve, reject) => {
            ti.resolve = resolve;
            ti.reject = reject;
        });
        ti.done = done;
        /**
         * If using router, check to see if navigation hooks
         * will allow us to perform this transition. This
         * is required in order for hooks to work with
         * the ion-back-button or swipe to go back.
         */
        if (ti.opts && ti.opts.updateURL !== false && this.useRouter) {
            const router = document.querySelector('ion-router');
            if (router) {
                const canTransition = await router.canTransition();
                if (canTransition === false) {
                    return false;
                }
                if (typeof canTransition === 'string') {
                    router.push(canTransition, ti.opts.direction || 'back');
                    return false;
                }
            }
        }
        // Normalize empty
        if (((_b = ti.insertViews) === null || _b === void 0 ? void 0 : _b.length) === 0) {
            ti.insertViews = undefined;
        }
        // Enqueue transition instruction
        this.transInstr.push(ti);
        // if there isn't a transition already happening
        // then this will kick off this transition
        this.nextTrns();
        return promise;
    }
    success(result, ti) {
        if (this.destroyed) {
            this.fireError('nav controller was destroyed', ti);
            return;
        }
        if (ti.done) {
            ti.done(result.hasCompleted, result.requiresTransition, result.enteringView, result.leavingView, result.direction);
        }
        ti.resolve(result.hasCompleted);
        if (ti.opts.updateURL !== false && this.useRouter) {
            const router = document.querySelector('ion-router');
            if (router) {
                const direction = result.direction === 'back' ? 'back' : 'forward';
                router.navChanged(direction);
            }
        }
    }
    failed(rejectReason, ti) {
        if (this.destroyed) {
            this.fireError('nav controller was destroyed', ti);
            return;
        }
        this.transInstr.length = 0;
        this.fireError(rejectReason, ti);
    }
    fireError(rejectReason, ti) {
        if (ti.done) {
            ti.done(false, false, rejectReason);
        }
        if (ti.reject && !this.destroyed) {
            ti.reject(rejectReason);
        }
        else {
            ti.resolve(false);
        }
    }
    /**
     * Consumes the next transition in the queue.
     *
     * @returns whether the transition is executed.
     */
    nextTrns() {
        // this is the framework's bread 'n butta function
        // only one transition is allowed at any given time
        if (this.isTransitioning) {
            return false;
        }
        // there is no transition happening right now, executes the next instructions.
        const ti = this.transInstr.shift();
        if (!ti) {
            return false;
        }
        this.runTransition(ti);
        return true;
    }
    /** Executes all the transition instruction from the queue. */
    async runTransition(ti) {
        try {
            // set that this nav is actively transitioning
            this.ionNavWillChange.emit();
            this.isTransitioning = true;
            this.prepareTI(ti);
            const leavingView = this.getActiveSync();
            const enteringView = this.getEnteringView(ti, leavingView);
            if (!leavingView && !enteringView) {
                throw new Error('no views in the stack to be removed');
            }
            if (enteringView && enteringView.state === VIEW_STATE_NEW) {
                await enteringView.init(this.el);
            }
            this.postViewInit(enteringView, leavingView, ti);
            // Needs transition?
            const requiresTransition = (ti.enteringRequiresTransition || ti.leavingRequiresTransition) && enteringView !== leavingView;
            if (requiresTransition && ti.opts && leavingView) {
                const isBackDirection = ti.opts.direction === 'back';
                /**
                 * If heading back, use the entering page's animation
                 * unless otherwise specified by the developer.
                 */
                if (isBackDirection) {
                    ti.opts.animationBuilder = ti.opts.animationBuilder || (enteringView === null || enteringView === void 0 ? void 0 : enteringView.animationBuilder);
                }
                leavingView.animationBuilder = ti.opts.animationBuilder;
            }
            let result;
            if (requiresTransition) {
                result = await this.transition(enteringView, leavingView, ti);
            }
            else {
                // transition is not required, so we are already done!
                // they're inserting/removing the views somewhere in the middle or
                // beginning, so visually nothing needs to animate/transition
                // resolve immediately because there's no animation that's happening
                result = {
                    hasCompleted: true,
                    requiresTransition: false,
                };
            }
            this.success(result, ti);
            this.ionNavDidChange.emit();
        }
        catch (rejectReason) {
            this.failed(rejectReason, ti);
        }
        this.isTransitioning = false;
        this.nextTrns();
    }
    prepareTI(ti) {
        var _a, _b;
        var _c;
        const viewsLength = this.views.length;
        (_a = ti.opts) !== null && _a !== void 0 ? _a : (ti.opts = {});
        (_b = (_c = ti.opts).delegate) !== null && _b !== void 0 ? _b : (_c.delegate = this.delegate);
        if (ti.removeView !== undefined) {
            assert(ti.removeStart !== undefined, 'removeView needs removeStart');
            assert(ti.removeCount !== undefined, 'removeView needs removeCount');
            const index = this.views.indexOf(ti.removeView);
            if (index < 0) {
                throw new Error('removeView was not found');
            }
            ti.removeStart += index;
        }
        if (ti.removeStart !== undefined) {
            if (ti.removeStart < 0) {
                ti.removeStart = viewsLength - 1;
            }
            if (ti.removeCount < 0) {
                ti.removeCount = viewsLength - ti.removeStart;
            }
            ti.leavingRequiresTransition = ti.removeCount > 0 && ti.removeStart + ti.removeCount === viewsLength;
        }
        if (ti.insertViews) {
            // allow -1 to be passed in to auto push it on the end
            // and clean up the index if it's larger then the size of the stack
            if (ti.insertStart < 0 || ti.insertStart > viewsLength) {
                ti.insertStart = viewsLength;
            }
            ti.enteringRequiresTransition = ti.insertStart === viewsLength;
        }
        const insertViews = ti.insertViews;
        if (!insertViews) {
            return;
        }
        assert(insertViews.length > 0, 'length can not be zero');
        const viewControllers = convertToViews(insertViews);
        if (viewControllers.length === 0) {
            throw new Error('invalid views to insert');
        }
        // Check all the inserted view are correct
        for (const view of viewControllers) {
            view.delegate = ti.opts.delegate;
            const nav = view.nav;
            if (nav && nav !== this) {
                throw new Error('inserted view was already inserted');
            }
            if (view.state === VIEW_STATE_DESTROYED) {
                throw new Error('inserted view was already destroyed');
            }
        }
        ti.insertViews = viewControllers;
    }
    /**
     * Returns the view that will be entered considering the transition instructions.
     *
     * @param ti The instructions.
     * @param leavingView The view being left or undefined if none.
     *
     * @returns The view that will be entered, undefined if none.
     */
    getEnteringView(ti, leavingView) {
        // The last inserted view will be entered when view are inserted.
        const insertViews = ti.insertViews;
        if (insertViews !== undefined) {
            return insertViews[insertViews.length - 1];
        }
        // When views are deleted, we will enter the last view that is not removed and not the view being left.
        const removeStart = ti.removeStart;
        if (removeStart !== undefined) {
            const views = this.views;
            const removeEnd = removeStart + ti.removeCount;
            for (let i = views.length - 1; i >= 0; i--) {
                const view = views[i];
                if ((i < removeStart || i >= removeEnd) && view !== leavingView) {
                    return view;
                }
            }
        }
        return undefined;
    }
    /**
     * Adds and Removes the views from the navigation stack.
     *
     * @param enteringView The view being entered.
     * @param leavingView The view being left.
     * @param ti The instructions.
     */
    postViewInit(enteringView, leavingView, ti) {
        var _a, _b, _c;
        assert(leavingView || enteringView, 'Both leavingView and enteringView are null');
        assert(ti.resolve, 'resolve must be valid');
        assert(ti.reject, 'reject must be valid');
        // Compute the views to remove.
        const opts = ti.opts;
        const { insertViews, removeStart, removeCount } = ti;
        /** Records the view to destroy */
        let destroyQueue;
        // there are views to remove
        if (removeStart !== undefined && removeCount !== undefined) {
            assert(removeStart >= 0, 'removeStart can not be negative');
            assert(removeCount >= 0, 'removeCount can not be negative');
            destroyQueue = [];
            for (let i = removeStart; i < removeStart + removeCount; i++) {
                const view = this.views[i];
                if (view !== undefined && view !== enteringView && view !== leavingView) {
                    destroyQueue.push(view);
                }
            }
            // default the direction to "back"
            (_a = opts.direction) !== null && _a !== void 0 ? _a : (opts.direction = 'back');
        }
        const finalNumViews = this.views.length + ((_b = insertViews === null || insertViews === void 0 ? void 0 : insertViews.length) !== null && _b !== void 0 ? _b : 0) - (removeCount !== null && removeCount !== void 0 ? removeCount : 0);
        assert(finalNumViews >= 0, 'final balance can not be negative');
        if (finalNumViews === 0) {
            printIonWarning(`[ion-nav] - You can't remove all the pages in the navigation stack. nav.pop() is probably called too many times.`, this, this.el);
            throw new Error('navigation stack needs at least one root page');
        }
        // At this point the transition can not be rejected, any throw should be an error
        // Insert the new views in the stack.
        if (insertViews) {
            // add the views to the
            let insertIndex = ti.insertStart;
            for (const view of insertViews) {
                this.insertViewAt(view, insertIndex);
                insertIndex++;
            }
            if (ti.enteringRequiresTransition) {
                // default to forward if not already set
                (_c = opts.direction) !== null && _c !== void 0 ? _c : (opts.direction = 'forward');
            }
        }
        // if the views to be removed are in the beginning or middle
        // and there is not a view that needs to visually transition out
        // then just destroy them and don't transition anything
        // batch all of lifecycles together
        // let's make sure, callbacks are zoned
        if (destroyQueue && destroyQueue.length > 0) {
            for (const view of destroyQueue) {
                lifecycle(view.element, LIFECYCLE_WILL_LEAVE);
                lifecycle(view.element, LIFECYCLE_DID_LEAVE);
                lifecycle(view.element, LIFECYCLE_WILL_UNLOAD);
            }
            // once all lifecycle events has been delivered, we can safely detroy the views
            for (const view of destroyQueue) {
                this.destroyView(view);
            }
        }
    }
    async transition(enteringView, leavingView, ti) {
        // we should animate (duration > 0) if the pushed page is not the first one (startup)
        // or if it is a portal (modal, actionsheet, etc.)
        const opts = ti.opts;
        const progressCallback = opts.progressAnimation
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
                    this.sbAni = ani;
                }
            }
            : undefined;
        const mode = getIonMode(this);
        const enteringEl = enteringView.element;
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        const leavingEl = leavingView && leavingView.element;
        const animationOpts = Object.assign(Object.assign({ mode, showGoBack: this.canGoBackSync(enteringView), baseEl: this.el, progressCallback, animated: this.animated && config.getBoolean('animated', true), enteringEl,
            leavingEl }, opts), { animationBuilder: opts.animationBuilder || this.animation || config.get('navAnimation') });
        const { hasCompleted } = await transition(animationOpts);
        return this.transitionFinish(hasCompleted, enteringView, leavingView, opts);
    }
    transitionFinish(hasCompleted, enteringView, leavingView, opts) {
        /**
         * If the transition did not complete, the leavingView will still be the active
         * view on the stack. Otherwise unmount all the views after the enteringView.
         */
        const activeView = hasCompleted ? enteringView : leavingView;
        if (activeView) {
            this.unmountInactiveViews(activeView);
        }
        return {
            hasCompleted,
            requiresTransition: true,
            enteringView,
            leavingView,
            direction: opts.direction,
        };
    }
    /**
     * Inserts a view at the specified index.
     *
     * When the view already is in the stack it will be moved to the new position.
     *
     * @param view The view to insert.
     * @param index The index where to insert the view.
     */
    insertViewAt(view, index) {
        const views = this.views;
        const existingIndex = views.indexOf(view);
        if (existingIndex > -1) {
            assert(view.nav === this, 'view is not part of the nav');
            // The view already in the stack, removes it.
            views.splice(existingIndex, 1);
            // and add it back at the requested index.
            views.splice(index, 0, view);
        }
        else {
            assert(!view.nav, 'nav is used');
            // this is a new view to add to the stack
            // create the new entering view
            view.nav = this;
            views.splice(index, 0, view);
        }
    }
    /**
     * Removes a view from the stack.
     *
     * @param view The view to remove.
     */
    removeView(view) {
        assert(view.state === VIEW_STATE_ATTACHED || view.state === VIEW_STATE_DESTROYED, 'view state should be loaded or destroyed');
        const views = this.views;
        const index = views.indexOf(view);
        assert(index > -1, 'view must be part of the stack');
        if (index >= 0) {
            views.splice(index, 1);
        }
    }
    destroyView(view) {
        view._destroy();
        this.removeView(view);
    }
    /**
     * Unmounts all inactive views after the specified active view.
     *
     * DOM WRITE
     *
     * @param activeView The view that is actively visible in the stack. Used to calculate which views to unmount.
     */
    unmountInactiveViews(activeView) {
        // ok, cleanup time!! Destroy all of the views that are
        // INACTIVE and come after the active view
        // only do this if the views exist, though
        if (this.destroyed) {
            return;
        }
        const views = this.views;
        const activeViewIndex = views.indexOf(activeView);
        for (let i = views.length - 1; i >= 0; i--) {
            const view = views[i];
            /**
             * When inserting multiple views via insertPages
             * the last page will be transitioned to, but the
             * others will not be. As a result, a DOM element
             * will only be created for the last page inserted.
             * As a result, it is possible to have views in the
             * stack that do not have `view.element` yet.
             */
            const element = view.element;
            if (element) {
                if (i > activeViewIndex) {
                    // this view comes after the active view
                    // let's unload it
                    lifecycle(element, LIFECYCLE_WILL_UNLOAD);
                    this.destroyView(view);
                }
                else if (i < activeViewIndex) {
                    // this view comes before the active view
                    // and it is not a portal then ensure it is hidden
                    setPageHidden(element, true);
                }
            }
        }
    }
    canStart() {
        return (!this.gestureOrAnimationInProgress &&
            !!this.swipeGesture &&
            !this.isTransitioning &&
            this.transInstr.length === 0 &&
            this.canGoBackSync());
    }
    onStart() {
        this.gestureOrAnimationInProgress = true;
        this.pop({ direction: 'back', progressAnimation: true });
    }
    onMove(stepValue) {
        if (this.sbAni) {
            this.sbAni.progressStep(stepValue);
        }
    }
    onEnd(shouldComplete, stepValue, dur) {
        if (this.sbAni) {
            this.sbAni.onFinish(() => {
                this.gestureOrAnimationInProgress = false;
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
                this.sbAni.easing('cubic-bezier(1, 0, 0.68, 0.28)');
                newStepValue += getTimeGivenProgression([0, 0], [1, 0], [0.68, 0.28], [1, 1], stepValue)[0];
            }
            else {
                newStepValue += getTimeGivenProgression([0, 0], [0.32, 0.72], [0, 1], [1, 1], stepValue)[0];
            }
            this.sbAni.progressEnd(shouldComplete ? 1 : 0, newStepValue, dur);
        }
        else {
            this.gestureOrAnimationInProgress = false;
        }
    }
    render() {
        return h("slot", { key: '8067c9835d255daec61f33dba200fd3a6ff839a0' });
    }
    get el() { return this; }
    static get watchers() { return {
        "swipeGesture": ["swipeGestureChanged"],
        "root": ["rootChanged"]
    }; }
    static get style() { return navCss; }
}, [1, "ion-nav", {
        "delegate": [16],
        "swipeGesture": [1028, "swipe-gesture"],
        "animated": [4],
        "animation": [16],
        "rootParams": [16, "root-params"],
        "root": [1],
        "push": [64],
        "insert": [64],
        "insertPages": [64],
        "pop": [64],
        "popTo": [64],
        "popToRoot": [64],
        "removeIndex": [64],
        "setRoot": [64],
        "setPages": [64],
        "setRouteId": [64],
        "getRouteId": [64],
        "getActive": [64],
        "getByIndex": [64],
        "canGoBack": [64],
        "getPrevious": [64],
        "getLength": [64]
    }, undefined, {
        "swipeGesture": ["swipeGestureChanged"],
        "root": ["rootChanged"]
    }]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-nav"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-nav":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Nav);
            }
            break;
    } });
}

const IonNav = Nav;
const defineCustomElement = defineCustomElement$1;

export { IonNav, defineCustomElement };
