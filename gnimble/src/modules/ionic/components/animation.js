/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { a as printIonError } from './index4.js';
import { w as win } from './index9.js';

let animationPrefix;
const getAnimationPrefix = (el) => {
    if (animationPrefix === undefined) {
        const supportsUnprefixed = el.style.animationName !== undefined;
        const supportsWebkitPrefix = el.style.webkitAnimationName !== undefined;
        animationPrefix = !supportsUnprefixed && supportsWebkitPrefix ? '-webkit-' : '';
    }
    return animationPrefix;
};
const setStyleProperty = (element, propertyName, value) => {
    const prefix = propertyName.startsWith('animation') ? getAnimationPrefix(element) : '';
    element.style.setProperty(prefix + propertyName, value);
};
const addClassToArray = (classes = [], className) => {
    if (className !== undefined) {
        const classNameToAppend = Array.isArray(className) ? className : [className];
        return [...classes, ...classNameToAppend];
    }
    return classes;
};

const createAnimation = (animationId) => {
    let _delay;
    let _duration;
    let _easing;
    let _iterations;
    let _fill;
    let _direction;
    let _keyframes = [];
    let beforeAddClasses = [];
    let beforeRemoveClasses = [];
    let initialized = false;
    let parentAnimation;
    let beforeStylesValue = {};
    let afterAddClasses = [];
    let afterRemoveClasses = [];
    let afterStylesValue = {};
    let numAnimationsRunning = 0;
    let shouldForceLinearEasing = false;
    let shouldForceSyncPlayback = false;
    let forceDirectionValue;
    let forceDurationValue;
    let forceDelayValue;
    let willComplete = true;
    let finished = false;
    let shouldCalculateNumAnimations = true;
    let ani;
    let paused = false;
    const id = animationId;
    const onFinishCallbacks = [];
    const onFinishOneTimeCallbacks = [];
    const onStopOneTimeCallbacks = [];
    const elements = [];
    const childAnimations = [];
    const stylesheets = [];
    const _beforeAddReadFunctions = [];
    const _beforeAddWriteFunctions = [];
    const _afterAddReadFunctions = [];
    const _afterAddWriteFunctions = [];
    const webAnimations = [];
    const supportsAnimationEffect = typeof AnimationEffect === 'function' ||
        (win !== undefined && typeof win.AnimationEffect === 'function');
    /**
     * This is a feature detection for Web Animations.
     *
     * Certain environments such as emulated browser environments for testing,
     * do not support Web Animations. As a result, we need to check for support
     * and provide a fallback to test certain functionality related to Web Animations.
     */
    const supportsWebAnimations = typeof Element === 'function' &&
        typeof Element.prototype.animate === 'function' &&
        supportsAnimationEffect;
    const getWebAnimations = () => {
        return webAnimations;
    };
    const destroy = (clearStyleSheets) => {
        childAnimations.forEach((childAnimation) => {
            childAnimation.destroy(clearStyleSheets);
        });
        cleanUp(clearStyleSheets);
        elements.length = 0;
        childAnimations.length = 0;
        _keyframes.length = 0;
        clearOnFinish();
        initialized = false;
        shouldCalculateNumAnimations = true;
        return ani;
    };
    /**
     * Cancels any Web Animations, removes
     * any animation properties from the
     * animation's elements, and removes the
     * animation's stylesheets from the DOM.
     */
    const cleanUp = (clearStyleSheets) => {
        cleanUpElements();
        if (clearStyleSheets) {
            cleanUpStyleSheets();
        }
    };
    const resetFlags = () => {
        shouldForceLinearEasing = false;
        shouldForceSyncPlayback = false;
        shouldCalculateNumAnimations = true;
        forceDirectionValue = undefined;
        forceDurationValue = undefined;
        forceDelayValue = undefined;
        numAnimationsRunning = 0;
        finished = false;
        willComplete = true;
        paused = false;
    };
    const isRunning = () => {
        return numAnimationsRunning !== 0 && !paused;
    };
    /**
     * @internal
     * Remove a callback from a chosen callback array
     * @param callbackToRemove: A reference to the callback that should be removed
     * @param callbackObjects: An array of callbacks that callbackToRemove should be removed from.
     */
    const clearCallback = (callbackToRemove, callbackObjects) => {
        const index = callbackObjects.findIndex((callbackObject) => callbackObject.c === callbackToRemove);
        if (index > -1) {
            callbackObjects.splice(index, 1);
        }
    };
    /**
     * @internal
     * Add a callback to be fired when an animation is stopped/cancelled.
     * @param callback: A reference to the callback that should be fired
     * @param opts: Any options associated with this particular callback
     */
    const onStop = (callback, opts) => {
        onStopOneTimeCallbacks.push({ c: callback, o: opts });
        return ani;
    };
    const onFinish = (callback, opts) => {
        const callbacks = (opts === null || opts === void 0 ? void 0 : opts.oneTimeCallback) ? onFinishOneTimeCallbacks : onFinishCallbacks;
        callbacks.push({ c: callback, o: opts });
        return ani;
    };
    const clearOnFinish = () => {
        onFinishCallbacks.length = 0;
        onFinishOneTimeCallbacks.length = 0;
        return ani;
    };
    /**
     * Cancels any Web Animations and removes
     * any animation properties from the
     * the animation's elements.
     */
    const cleanUpElements = () => {
        if (supportsWebAnimations) {
            webAnimations.forEach((animation) => {
                animation.cancel();
            });
            webAnimations.length = 0;
        }
    };
    /**
     * Removes the animation's stylesheets
     * from the DOM.
     */
    const cleanUpStyleSheets = () => {
        stylesheets.forEach((stylesheet) => {
            /**
             * When sharing stylesheets, it's possible
             * for another animation to have already
             * cleaned up a particular stylesheet
             */
            if (stylesheet === null || stylesheet === void 0 ? void 0 : stylesheet.parentNode) {
                stylesheet.parentNode.removeChild(stylesheet);
            }
        });
        stylesheets.length = 0;
    };
    const beforeAddRead = (readFn) => {
        _beforeAddReadFunctions.push(readFn);
        return ani;
    };
    const beforeAddWrite = (writeFn) => {
        _beforeAddWriteFunctions.push(writeFn);
        return ani;
    };
    const afterAddRead = (readFn) => {
        _afterAddReadFunctions.push(readFn);
        return ani;
    };
    const afterAddWrite = (writeFn) => {
        _afterAddWriteFunctions.push(writeFn);
        return ani;
    };
    const beforeAddClass = (className) => {
        beforeAddClasses = addClassToArray(beforeAddClasses, className);
        return ani;
    };
    const beforeRemoveClass = (className) => {
        beforeRemoveClasses = addClassToArray(beforeRemoveClasses, className);
        return ani;
    };
    /**
     * Set CSS inline styles to the animation's
     * elements before the animation begins.
     */
    const beforeStyles = (styles = {}) => {
        beforeStylesValue = styles;
        return ani;
    };
    /**
     * Clear CSS inline styles from the animation's
     * elements before the animation begins.
     */
    const beforeClearStyles = (propertyNames = []) => {
        for (const property of propertyNames) {
            beforeStylesValue[property] = '';
        }
        return ani;
    };
    const afterAddClass = (className) => {
        afterAddClasses = addClassToArray(afterAddClasses, className);
        return ani;
    };
    const afterRemoveClass = (className) => {
        afterRemoveClasses = addClassToArray(afterRemoveClasses, className);
        return ani;
    };
    const afterStyles = (styles = {}) => {
        afterStylesValue = styles;
        return ani;
    };
    const afterClearStyles = (propertyNames = []) => {
        for (const property of propertyNames) {
            afterStylesValue[property] = '';
        }
        return ani;
    };
    const getFill = () => {
        if (_fill !== undefined) {
            return _fill;
        }
        if (parentAnimation) {
            return parentAnimation.getFill();
        }
        return 'both';
    };
    const getDirection = () => {
        if (forceDirectionValue !== undefined) {
            return forceDirectionValue;
        }
        if (_direction !== undefined) {
            return _direction;
        }
        if (parentAnimation) {
            return parentAnimation.getDirection();
        }
        return 'normal';
    };
    const getEasing = () => {
        if (shouldForceLinearEasing) {
            return 'linear';
        }
        if (_easing !== undefined) {
            return _easing;
        }
        if (parentAnimation) {
            return parentAnimation.getEasing();
        }
        return 'linear';
    };
    const getDuration = () => {
        if (shouldForceSyncPlayback) {
            return 0;
        }
        if (forceDurationValue !== undefined) {
            return forceDurationValue;
        }
        if (_duration !== undefined) {
            return _duration;
        }
        if (parentAnimation) {
            return parentAnimation.getDuration();
        }
        return 0;
    };
    const getIterations = () => {
        if (_iterations !== undefined) {
            return _iterations;
        }
        if (parentAnimation) {
            return parentAnimation.getIterations();
        }
        return 1;
    };
    const getDelay = () => {
        if (forceDelayValue !== undefined) {
            return forceDelayValue;
        }
        if (_delay !== undefined) {
            return _delay;
        }
        if (parentAnimation) {
            return parentAnimation.getDelay();
        }
        return 0;
    };
    const getKeyframes = () => {
        return _keyframes;
    };
    const direction = (animationDirection) => {
        _direction = animationDirection;
        update(true);
        return ani;
    };
    const fill = (animationFill) => {
        _fill = animationFill;
        update(true);
        return ani;
    };
    const delay = (animationDelay) => {
        _delay = animationDelay;
        update(true);
        return ani;
    };
    const easing = (animationEasing) => {
        _easing = animationEasing;
        update(true);
        return ani;
    };
    const duration = (animationDuration) => {
        /**
         * CSS Animation Durations of 0ms work fine on Chrome
         * but do not run on Safari, so force it to 1ms to
         * get it to run on both platforms.
         */
        if (!supportsWebAnimations && animationDuration === 0) {
            animationDuration = 1;
        }
        _duration = animationDuration;
        update(true);
        return ani;
    };
    const iterations = (animationIterations) => {
        _iterations = animationIterations;
        update(true);
        return ani;
    };
    const parent = (animation) => {
        parentAnimation = animation;
        return ani;
    };
    const addElement = (el) => {
        if (el != null) {
            if (el.nodeType === 1) {
                elements.push(el);
            }
            else if (el.length >= 0) {
                for (let i = 0; i < el.length; i++) {
                    elements.push(el[i]);
                }
            }
            else {
                printIonError('createAnimation - Invalid addElement value.');
            }
        }
        return ani;
    };
    const addAnimation = (animationToAdd) => {
        if (animationToAdd != null) {
            if (Array.isArray(animationToAdd)) {
                for (const animation of animationToAdd) {
                    animation.parent(ani);
                    childAnimations.push(animation);
                }
            }
            else {
                animationToAdd.parent(ani);
                childAnimations.push(animationToAdd);
            }
        }
        return ani;
    };
    const keyframes = (keyframeValues) => {
        const different = _keyframes !== keyframeValues;
        _keyframes = keyframeValues;
        if (different) {
            updateKeyframes(_keyframes);
        }
        return ani;
    };
    const updateKeyframes = (keyframeValues) => {
        if (supportsWebAnimations) {
            getWebAnimations().forEach((animation) => {
                /**
                 * animation.effect's type is AnimationEffect.
                 * However, in this case we have a more specific
                 * type of AnimationEffect called KeyframeEffect which
                 * inherits from AnimationEffect. As a result,
                 * we cast animation.effect to KeyframeEffect.
                 */
                const keyframeEffect = animation.effect;
                /**
                 * setKeyframes is not supported in all browser
                 * versions that Ionic supports, so we need to
                 * check for support before using it.
                 */
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                if (keyframeEffect.setKeyframes) {
                    keyframeEffect.setKeyframes(keyframeValues);
                }
                else {
                    const newEffect = new KeyframeEffect(keyframeEffect.target, keyframeValues, keyframeEffect.getTiming());
                    animation.effect = newEffect;
                }
            });
        }
    };
    /**
     * Run all "before" animation hooks.
     */
    const beforeAnimation = () => {
        // Runs all before read callbacks
        _beforeAddReadFunctions.forEach((callback) => callback());
        // Runs all before write callbacks
        _beforeAddWriteFunctions.forEach((callback) => callback());
        // Updates styles and classes before animation runs
        const addClasses = beforeAddClasses;
        const removeClasses = beforeRemoveClasses;
        const styles = beforeStylesValue;
        elements.forEach((el) => {
            const elementClassList = el.classList;
            addClasses.forEach((c) => elementClassList.add(c));
            removeClasses.forEach((c) => elementClassList.remove(c));
            for (const property in styles) {
                // eslint-disable-next-line no-prototype-builtins
                if (styles.hasOwnProperty(property)) {
                    setStyleProperty(el, property, styles[property]);
                }
            }
        });
    };
    /**
     * Run all "after" animation hooks.
     */
    const afterAnimation = () => {
        // Runs all after read callbacks
        _afterAddReadFunctions.forEach((callback) => callback());
        // Runs all after write callbacks
        _afterAddWriteFunctions.forEach((callback) => callback());
        // Updates styles and classes before animation ends
        const currentStep = willComplete ? 1 : 0;
        const addClasses = afterAddClasses;
        const removeClasses = afterRemoveClasses;
        const styles = afterStylesValue;
        elements.forEach((el) => {
            const elementClassList = el.classList;
            addClasses.forEach((c) => elementClassList.add(c));
            removeClasses.forEach((c) => elementClassList.remove(c));
            for (const property in styles) {
                // eslint-disable-next-line no-prototype-builtins
                if (styles.hasOwnProperty(property)) {
                    setStyleProperty(el, property, styles[property]);
                }
            }
        });
        /**
         * Clean up any value coercion before
         * the user callbacks fire otherwise
         * they may get stale values. For example,
         * if someone calls progressStart(0) the
         * animation may still be reversed.
         */
        forceDurationValue = undefined;
        forceDirectionValue = undefined;
        forceDelayValue = undefined;
        onFinishCallbacks.forEach((onFinishCallback) => {
            return onFinishCallback.c(currentStep, ani);
        });
        onFinishOneTimeCallbacks.forEach((onFinishCallback) => {
            return onFinishCallback.c(currentStep, ani);
        });
        onFinishOneTimeCallbacks.length = 0;
        shouldCalculateNumAnimations = true;
        if (willComplete) {
            finished = true;
        }
        willComplete = true;
    };
    const animationFinish = () => {
        if (numAnimationsRunning === 0) {
            return;
        }
        numAnimationsRunning--;
        if (numAnimationsRunning === 0) {
            afterAnimation();
            if (parentAnimation) {
                parentAnimation.animationFinish();
            }
        }
    };
    const initializeWebAnimation = () => {
        elements.forEach((element) => {
            const animation = element.animate(_keyframes, {
                id,
                delay: getDelay(),
                duration: getDuration(),
                easing: getEasing(),
                iterations: getIterations(),
                fill: getFill(),
                direction: getDirection(),
            });
            animation.pause();
            webAnimations.push(animation);
        });
        if (webAnimations.length > 0) {
            webAnimations[0].onfinish = () => {
                animationFinish();
            };
        }
    };
    const initializeAnimation = () => {
        beforeAnimation();
        if (_keyframes.length > 0) {
            if (supportsWebAnimations) {
                initializeWebAnimation();
            }
        }
        initialized = true;
    };
    const setAnimationStep = (step) => {
        step = Math.min(Math.max(step, 0), 0.9999);
        if (supportsWebAnimations) {
            webAnimations.forEach((animation) => {
                // When creating the animation the delay is guaranteed to be set to a number.
                animation.currentTime = animation.effect.getComputedTiming().delay + getDuration() * step;
                animation.pause();
            });
        }
    };
    const updateWebAnimation = (step) => {
        webAnimations.forEach((animation) => {
            animation.effect.updateTiming({
                delay: getDelay(),
                duration: getDuration(),
                easing: getEasing(),
                iterations: getIterations(),
                fill: getFill(),
                direction: getDirection(),
            });
        });
        if (step !== undefined) {
            setAnimationStep(step);
        }
    };
    const update = (deep = false, toggleAnimationName = true, step) => {
        if (deep) {
            childAnimations.forEach((animation) => {
                animation.update(deep, toggleAnimationName, step);
            });
        }
        if (supportsWebAnimations) {
            updateWebAnimation(step);
        }
        return ani;
    };
    const progressStart = (forceLinearEasing = false, step) => {
        childAnimations.forEach((animation) => {
            animation.progressStart(forceLinearEasing, step);
        });
        pauseAnimation();
        shouldForceLinearEasing = forceLinearEasing;
        if (!initialized) {
            initializeAnimation();
        }
        update(false, true, step);
        return ani;
    };
    const progressStep = (step) => {
        childAnimations.forEach((animation) => {
            animation.progressStep(step);
        });
        setAnimationStep(step);
        return ani;
    };
    const progressEnd = (playTo, step, dur) => {
        shouldForceLinearEasing = false;
        childAnimations.forEach((animation) => {
            animation.progressEnd(playTo, step, dur);
        });
        if (dur !== undefined) {
            forceDurationValue = dur;
        }
        finished = false;
        willComplete = true;
        if (playTo === 0) {
            forceDirectionValue = getDirection() === 'reverse' ? 'normal' : 'reverse';
            if (forceDirectionValue === 'reverse') {
                willComplete = false;
            }
            if (supportsWebAnimations) {
                update();
                setAnimationStep(1 - step);
            }
            else {
                forceDelayValue = (1 - step) * getDuration() * -1;
                update(false, false);
            }
        }
        else if (playTo === 1) {
            if (supportsWebAnimations) {
                update();
                setAnimationStep(step);
            }
            else {
                forceDelayValue = step * getDuration() * -1;
                update(false, false);
            }
        }
        if (playTo !== undefined && !parentAnimation) {
            play();
        }
        return ani;
    };
    const pauseAnimation = () => {
        if (initialized) {
            if (supportsWebAnimations) {
                webAnimations.forEach((animation) => {
                    animation.pause();
                });
            }
            else {
                elements.forEach((element) => {
                    setStyleProperty(element, 'animation-play-state', 'paused');
                });
            }
            paused = true;
        }
    };
    const pause = () => {
        childAnimations.forEach((animation) => {
            animation.pause();
        });
        pauseAnimation();
        return ani;
    };
    const playCSSAnimations = () => {
        animationFinish();
    };
    const playWebAnimations = () => {
        webAnimations.forEach((animation) => {
            animation.play();
        });
        if (_keyframes.length === 0 || elements.length === 0) {
            animationFinish();
        }
    };
    const resetAnimation = () => {
        if (supportsWebAnimations) {
            setAnimationStep(0);
            updateWebAnimation();
        }
    };
    const play = (opts) => {
        return new Promise((resolve) => {
            if (opts === null || opts === void 0 ? void 0 : opts.sync) {
                shouldForceSyncPlayback = true;
                onFinish(() => (shouldForceSyncPlayback = false), { oneTimeCallback: true });
            }
            if (!initialized) {
                initializeAnimation();
            }
            if (finished) {
                resetAnimation();
                finished = false;
            }
            if (shouldCalculateNumAnimations) {
                numAnimationsRunning = childAnimations.length + 1;
                shouldCalculateNumAnimations = false;
            }
            /**
             * When one of these callbacks fires we
             * need to clear the other's callback otherwise
             * you can potentially get these callbacks
             * firing multiple times if the play method
             * is subsequently called.
             * Example:
             * animation.play() (onStop and onFinish callbacks are registered)
             * animation.stop() (onStop callback is fired, onFinish is not)
             * animation.play() (onStop and onFinish callbacks are registered)
             * Total onStop callbacks: 1
             * Total onFinish callbacks: 2
             */
            const onStopCallback = () => {
                clearCallback(onFinishCallback, onFinishOneTimeCallbacks);
                resolve();
            };
            const onFinishCallback = () => {
                clearCallback(onStopCallback, onStopOneTimeCallbacks);
                resolve();
            };
            /**
             * The play method resolves when an animation
             * run either finishes or is cancelled.
             */
            onFinish(onFinishCallback, { oneTimeCallback: true });
            onStop(onStopCallback, { oneTimeCallback: true });
            childAnimations.forEach((animation) => {
                animation.play();
            });
            if (supportsWebAnimations) {
                playWebAnimations();
            }
            else {
                playCSSAnimations();
            }
            paused = false;
        });
    };
    /**
     * Stops an animation and resets it state to the
     * beginning. This does not fire any onFinish
     * callbacks because the animation did not finish.
     * However, since the animation was not destroyed
     * (i.e. the animation could run again) we do not
     * clear the onFinish callbacks.
     */
    const stop = () => {
        childAnimations.forEach((animation) => {
            animation.stop();
        });
        if (initialized) {
            cleanUpElements();
            initialized = false;
        }
        resetFlags();
        onStopOneTimeCallbacks.forEach((onStopCallback) => onStopCallback.c(0, ani));
        onStopOneTimeCallbacks.length = 0;
    };
    const from = (property, value) => {
        const firstFrame = _keyframes[0];
        if (firstFrame !== undefined && (firstFrame.offset === undefined || firstFrame.offset === 0)) {
            firstFrame[property] = value;
        }
        else {
            _keyframes = [{ offset: 0, [property]: value }, ..._keyframes];
        }
        return ani;
    };
    const to = (property, value) => {
        const lastFrame = _keyframes[_keyframes.length - 1];
        if (lastFrame !== undefined && (lastFrame.offset === undefined || lastFrame.offset === 1)) {
            lastFrame[property] = value;
        }
        else {
            _keyframes = [..._keyframes, { offset: 1, [property]: value }];
        }
        return ani;
    };
    const fromTo = (property, fromValue, toValue) => {
        return from(property, fromValue).to(property, toValue);
    };
    return (ani = {
        parentAnimation,
        elements,
        childAnimations,
        id,
        animationFinish,
        from,
        to,
        fromTo,
        parent,
        play,
        pause,
        stop,
        destroy,
        keyframes,
        addAnimation,
        addElement,
        update,
        fill,
        direction,
        iterations,
        duration,
        easing,
        delay,
        getWebAnimations,
        getKeyframes,
        getFill,
        getDirection,
        getDelay,
        getIterations,
        getEasing,
        getDuration,
        afterAddRead,
        afterAddWrite,
        afterClearStyles,
        afterStyles,
        afterRemoveClass,
        afterAddClass,
        beforeAddRead,
        beforeAddWrite,
        beforeClearStyles,
        beforeStyles,
        beforeRemoveClass,
        beforeAddClass,
        onFinish,
        isRunning,
        progressStart,
        progressStep,
        progressEnd,
    });
};

export { createAnimation as c };
