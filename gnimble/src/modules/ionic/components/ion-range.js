/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, h, Host } from '@stencil/core/internal/client';
import { a as findClosestIonContent, d as disableContentScrollY, r as resetContentScrollY } from './index8.js';
import { o as isSafeNumber, f as clamp, l as debounceEvent, i as inheritAriaAttributes, e as renderHiddenInput } from './helpers.js';
import { p as printIonWarning } from './index4.js';
import { i as isRTL } from './dir.js';
import { h as hostContext, c as createColorClasses } from './theme.js';
import { b as getIonMode } from './ionic-global.js';

function getDecimalPlaces(n) {
    if (!isSafeNumber(n))
        return 0;
    if (n % 1 === 0)
        return 0;
    return n.toString().split('.')[1].length;
}
/**
 * Fixes floating point rounding errors in a result by rounding
 * to the same specificity, or number of decimal places (*not*
 * significant figures) as provided reference numbers. If multiple
 * references are provided, the highest number of decimal places
 * between them will be used.
 *
 * The main use case is when numbers x and y are added to produce n,
 * but x and y are floats, so n may have rounding errors (such as
 * 3.1000000004 instead of 3.1). As long as only addition/subtraction
 * occurs between x and y, the specificity of the result will never
 * increase, so x and y should be passed in as the references.
 *
 * If multiplication, division, or other operations were used to
 * calculate n, the rounded result may have less specificity than
 * desired. For example, 1 / 3 = 0.33333(...), but
 * roundToMaxDecimalPlaces((1 / 3), 1, 3) will return 0, since both
 * 1 and 3 are whole numbers.
 *
 * Note that extremely precise reference numbers may lead to rounding
 * errors not being trimmed, due to the error result having the same or
 * fewer decimal places as the reference(s). This is acceptable as we
 * would not be able to tell the difference between a rounding error
 * and correct value in this case, but it does mean there is an implicit
 * precision limit. If precision that high is needed, it is recommended
 * to use a third party data type designed to handle floating point
 * errors instead.
 *
 * @param n The number to round.
 * @param references Number(s) used to calculate n, or that should otherwise
 * be used as a reference for the desired specificity.
 */
function roundToMaxDecimalPlaces(n, ...references) {
    if (!isSafeNumber(n))
        return 0;
    const maxPlaces = Math.max(...references.map((r) => getDecimalPlaces(r)));
    return Number(n.toFixed(maxPlaces));
}

const rangeIosCss = ":host{--knob-handle-size:calc(var(--knob-size) * 2);display:-ms-flexbox;display:flex;position:relative;-ms-flex:3;flex:3;-ms-flex-align:center;align-items:center;font-family:var(--ion-font-family, inherit);-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:2}:host(.range-disabled){pointer-events:none}::slotted(ion-label){-ms-flex:initial;flex:initial}::slotted(ion-icon[slot]){font-size:24px}.range-slider{position:relative;-ms-flex:1;flex:1;width:100%;height:var(--height);contain:size layout style;cursor:-webkit-grab;cursor:grab;-ms-touch-action:pan-y;touch-action:pan-y}:host(.range-pressed) .range-slider{cursor:-webkit-grabbing;cursor:grabbing}.range-pin{position:absolute;background:var(--ion-color-base);color:var(--ion-color-contrast);text-align:center;-webkit-box-sizing:border-box;box-sizing:border-box}.range-knob-handle{top:calc((var(--height) - var(--knob-handle-size)) / 2);-webkit-margin-start:calc(0px - var(--knob-handle-size) / 2);margin-inline-start:calc(0px - var(--knob-handle-size) / 2);display:-ms-flexbox;display:flex;position:absolute;-ms-flex-pack:center;justify-content:center;width:var(--knob-handle-size);height:var(--knob-handle-size);text-align:center}.range-knob-handle{inset-inline-start:0}:host-context([dir=rtl]) .range-knob-handle{left:unset}[dir=rtl] .range-knob-handle{left:unset}@supports selector(:dir(rtl)){.range-knob-handle:dir(rtl){left:unset}}.range-knob-handle:active,.range-knob-handle:focus{outline:none}.range-bar-container{border-radius:var(--bar-border-radius);top:calc((var(--height) - var(--bar-height)) / 2);position:absolute;width:100%;height:var(--bar-height)}.range-bar-container{inset-inline-start:0}:host-context([dir=rtl]) .range-bar-container{left:unset}[dir=rtl] .range-bar-container{left:unset}@supports selector(:dir(rtl)){.range-bar-container:dir(rtl){left:unset}}.range-bar{border-radius:var(--bar-border-radius);position:absolute;width:100%;height:var(--bar-height);background:var(--bar-background);pointer-events:none}.range-knob{border-radius:var(--knob-border-radius);top:calc(50% - var(--knob-size) / 2);position:absolute;width:var(--knob-size);height:var(--knob-size);background:var(--knob-background);-webkit-box-shadow:var(--knob-box-shadow);box-shadow:var(--knob-box-shadow);z-index:2;pointer-events:none}.range-knob{inset-inline-start:calc(50% - var(--knob-size) / 2)}:host-context([dir=rtl]) .range-knob{left:unset}[dir=rtl] .range-knob{left:unset}@supports selector(:dir(rtl)){.range-knob:dir(rtl){left:unset}}:host(.range-pressed) .range-bar-active{will-change:left, right}:host(.in-item){width:100%}:host([slot=start]),:host([slot=end]){width:auto}:host(.in-item) ::slotted(ion-label){-ms-flex-item-align:center;align-self:center}.range-wrapper{display:-ms-flexbox;display:flex;position:relative;-ms-flex-positive:1;flex-grow:1;-ms-flex-align:center;align-items:center;height:inherit}::slotted([slot=label]){max-width:200px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.label-text-wrapper-hidden{display:none}.native-wrapper{display:-ms-flexbox;display:flex;-ms-flex-positive:1;flex-grow:1;-ms-flex-align:center;align-items:center}:host(.range-label-placement-start) .range-wrapper{-ms-flex-direction:row;flex-direction:row}:host(.range-label-placement-start) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px;margin-top:0;margin-bottom:0}:host(.range-label-placement-end) .range-wrapper{-ms-flex-direction:row-reverse;flex-direction:row-reverse}:host(.range-label-placement-end) .label-text-wrapper{-webkit-margin-start:16px;margin-inline-start:16px;-webkit-margin-end:0;margin-inline-end:0;margin-top:0;margin-bottom:0}:host(.range-label-placement-fixed) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px;margin-top:0;margin-bottom:0}:host(.range-label-placement-fixed) .label-text-wrapper{-ms-flex:0 0 100px;flex:0 0 100px;width:100px;min-width:100px;max-width:200px}:host(.range-label-placement-stacked) .range-wrapper{-ms-flex-direction:column;flex-direction:column;-ms-flex-align:stretch;align-items:stretch}:host(.range-label-placement-stacked) .label-text-wrapper{-webkit-transform-origin:left top;transform-origin:left top;-webkit-transform:scale(0.75);transform:scale(0.75);margin-left:0;margin-right:0;margin-bottom:16px;max-width:calc(100% / 0.75)}:host-context([dir=rtl]):host(.range-label-placement-stacked) .label-text-wrapper,:host-context([dir=rtl]).range-label-placement-stacked .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}@supports selector(:dir(rtl)){:host(.range-label-placement-stacked:dir(rtl)) .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}}:host(.in-item.range-label-placement-stacked) .label-text-wrapper{margin-top:10px;margin-bottom:16px}:host(.in-item.range-label-placement-stacked) .native-wrapper{margin-bottom:0px}:host{--knob-border-radius:50%;--knob-background:#ffffff;--knob-box-shadow:0px 0.5px 4px rgba(0, 0, 0, 0.12), 0px 6px 13px rgba(0, 0, 0, 0.12);--knob-size:26px;--bar-height:4px;--bar-background:var(--ion-color-step-900, var(--ion-background-color-step-900, #e6e6e6));--bar-background-active:var(--ion-color-primary, #0054e9);--bar-border-radius:2px;--height:42px}:host(.range-item-start-adjustment){-webkit-padding-start:24px;padding-inline-start:24px}:host(.range-item-end-adjustment){-webkit-padding-end:24px;padding-inline-end:24px}:host(.ion-color) .range-bar-active,:host(.ion-color) .range-tick-active{background:var(--ion-color-base)}::slotted([slot=start]){-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px;margin-top:0;margin-bottom:0}::slotted([slot=end]){-webkit-margin-start:16px;margin-inline-start:16px;-webkit-margin-end:0;margin-inline-end:0;margin-top:0;margin-bottom:0}:host(.range-has-pin:not(.range-label-placement-stacked)){padding-top:calc(8px + 0.75rem)}:host(.range-has-pin.range-label-placement-stacked) .label-text-wrapper{margin-bottom:calc(8px + 0.75rem)}.range-bar-active{bottom:0;width:auto;background:var(--bar-background-active)}.range-bar-active.has-ticks{border-radius:0;-webkit-margin-start:-2px;margin-inline-start:-2px;-webkit-margin-end:-2px;margin-inline-end:-2px}.range-tick{-webkit-margin-start:-2px;margin-inline-start:-2px;border-radius:0;position:absolute;top:17px;width:4px;height:8px;background:var(--ion-color-step-900, var(--ion-background-color-step-900, #e6e6e6));pointer-events:none}.range-tick-active{background:var(--bar-background-active)}.range-pin{-webkit-transform:translate3d(0,  100%,  0) scale(0.01);transform:translate3d(0,  100%,  0) scale(0.01);-webkit-padding-start:8px;padding-inline-start:8px;-webkit-padding-end:8px;padding-inline-end:8px;padding-top:8px;padding-bottom:8px;min-width:28px;-webkit-transition:-webkit-transform 120ms ease;transition:-webkit-transform 120ms ease;transition:transform 120ms ease;transition:transform 120ms ease, -webkit-transform 120ms ease;background:transparent;color:var(--ion-text-color, #000);font-size:0.75rem;text-align:center}.range-knob-pressed .range-pin,.range-knob-handle.ion-focused .range-pin{-webkit-transform:translate3d(0, calc(-100% + 11px), 0) scale(1);transform:translate3d(0, calc(-100% + 11px), 0) scale(1)}:host(.range-disabled){opacity:0.3}";

const rangeMdCss = ":host{--knob-handle-size:calc(var(--knob-size) * 2);display:-ms-flexbox;display:flex;position:relative;-ms-flex:3;flex:3;-ms-flex-align:center;align-items:center;font-family:var(--ion-font-family, inherit);-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:2}:host(.range-disabled){pointer-events:none}::slotted(ion-label){-ms-flex:initial;flex:initial}::slotted(ion-icon[slot]){font-size:24px}.range-slider{position:relative;-ms-flex:1;flex:1;width:100%;height:var(--height);contain:size layout style;cursor:-webkit-grab;cursor:grab;-ms-touch-action:pan-y;touch-action:pan-y}:host(.range-pressed) .range-slider{cursor:-webkit-grabbing;cursor:grabbing}.range-pin{position:absolute;background:var(--ion-color-base);color:var(--ion-color-contrast);text-align:center;-webkit-box-sizing:border-box;box-sizing:border-box}.range-knob-handle{top:calc((var(--height) - var(--knob-handle-size)) / 2);-webkit-margin-start:calc(0px - var(--knob-handle-size) / 2);margin-inline-start:calc(0px - var(--knob-handle-size) / 2);display:-ms-flexbox;display:flex;position:absolute;-ms-flex-pack:center;justify-content:center;width:var(--knob-handle-size);height:var(--knob-handle-size);text-align:center}.range-knob-handle{inset-inline-start:0}:host-context([dir=rtl]) .range-knob-handle{left:unset}[dir=rtl] .range-knob-handle{left:unset}@supports selector(:dir(rtl)){.range-knob-handle:dir(rtl){left:unset}}.range-knob-handle:active,.range-knob-handle:focus{outline:none}.range-bar-container{border-radius:var(--bar-border-radius);top:calc((var(--height) - var(--bar-height)) / 2);position:absolute;width:100%;height:var(--bar-height)}.range-bar-container{inset-inline-start:0}:host-context([dir=rtl]) .range-bar-container{left:unset}[dir=rtl] .range-bar-container{left:unset}@supports selector(:dir(rtl)){.range-bar-container:dir(rtl){left:unset}}.range-bar{border-radius:var(--bar-border-radius);position:absolute;width:100%;height:var(--bar-height);background:var(--bar-background);pointer-events:none}.range-knob{border-radius:var(--knob-border-radius);top:calc(50% - var(--knob-size) / 2);position:absolute;width:var(--knob-size);height:var(--knob-size);background:var(--knob-background);-webkit-box-shadow:var(--knob-box-shadow);box-shadow:var(--knob-box-shadow);z-index:2;pointer-events:none}.range-knob{inset-inline-start:calc(50% - var(--knob-size) / 2)}:host-context([dir=rtl]) .range-knob{left:unset}[dir=rtl] .range-knob{left:unset}@supports selector(:dir(rtl)){.range-knob:dir(rtl){left:unset}}:host(.range-pressed) .range-bar-active{will-change:left, right}:host(.in-item){width:100%}:host([slot=start]),:host([slot=end]){width:auto}:host(.in-item) ::slotted(ion-label){-ms-flex-item-align:center;align-self:center}.range-wrapper{display:-ms-flexbox;display:flex;position:relative;-ms-flex-positive:1;flex-grow:1;-ms-flex-align:center;align-items:center;height:inherit}::slotted([slot=label]){max-width:200px;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.label-text-wrapper-hidden{display:none}.native-wrapper{display:-ms-flexbox;display:flex;-ms-flex-positive:1;flex-grow:1;-ms-flex-align:center;align-items:center}:host(.range-label-placement-start) .range-wrapper{-ms-flex-direction:row;flex-direction:row}:host(.range-label-placement-start) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px;margin-top:0;margin-bottom:0}:host(.range-label-placement-end) .range-wrapper{-ms-flex-direction:row-reverse;flex-direction:row-reverse}:host(.range-label-placement-end) .label-text-wrapper{-webkit-margin-start:16px;margin-inline-start:16px;-webkit-margin-end:0;margin-inline-end:0;margin-top:0;margin-bottom:0}:host(.range-label-placement-fixed) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px;margin-top:0;margin-bottom:0}:host(.range-label-placement-fixed) .label-text-wrapper{-ms-flex:0 0 100px;flex:0 0 100px;width:100px;min-width:100px;max-width:200px}:host(.range-label-placement-stacked) .range-wrapper{-ms-flex-direction:column;flex-direction:column;-ms-flex-align:stretch;align-items:stretch}:host(.range-label-placement-stacked) .label-text-wrapper{-webkit-transform-origin:left top;transform-origin:left top;-webkit-transform:scale(0.75);transform:scale(0.75);margin-left:0;margin-right:0;margin-bottom:16px;max-width:calc(100% / 0.75)}:host-context([dir=rtl]):host(.range-label-placement-stacked) .label-text-wrapper,:host-context([dir=rtl]).range-label-placement-stacked .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}@supports selector(:dir(rtl)){:host(.range-label-placement-stacked:dir(rtl)) .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}}:host(.in-item.range-label-placement-stacked) .label-text-wrapper{margin-top:10px;margin-bottom:16px}:host(.in-item.range-label-placement-stacked) .native-wrapper{margin-bottom:0px}:host{--knob-border-radius:50%;--knob-background:var(--bar-background-active);--knob-box-shadow:none;--knob-size:18px;--bar-height:2px;--bar-background:rgba(var(--ion-color-primary-rgb, 0, 84, 233), 0.26);--bar-background-active:var(--ion-color-primary, #0054e9);--bar-border-radius:0;--height:42px;--pin-background:var(--ion-color-primary, #0054e9);--pin-color:var(--ion-color-primary-contrast, #fff)}::slotted(:not(ion-icon)[slot=start]),::slotted(:not(ion-icon)[slot=end]),.native-wrapper{font-size:0.75rem}:host(.range-item-start-adjustment){-webkit-padding-start:18px;padding-inline-start:18px}:host(.range-item-end-adjustment){-webkit-padding-end:18px;padding-inline-end:18px}:host(.ion-color) .range-bar{background:rgba(var(--ion-color-base-rgb), 0.26)}:host(.ion-color) .range-bar-active,:host(.ion-color) .range-knob,:host(.ion-color) .range-knob::before,:host(.ion-color) .range-pin,:host(.ion-color) .range-pin::before,:host(.ion-color) .range-tick{background:var(--ion-color-base);color:var(--ion-color-contrast)}::slotted([slot=start]){-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:14px;margin-inline-end:14px;margin-top:0;margin-bottom:0}::slotted([slot=end]){-webkit-margin-start:14px;margin-inline-start:14px;-webkit-margin-end:0;margin-inline-end:0;margin-top:0;margin-bottom:0}:host(.range-has-pin:not(.range-label-placement-stacked)){padding-top:1.75rem}:host(.range-has-pin.range-label-placement-stacked) .label-text-wrapper{margin-bottom:1.75rem}.range-bar-active{bottom:0;width:auto;background:var(--bar-background-active)}.range-knob{-webkit-transform:scale(0.67);transform:scale(0.67);-webkit-transition-duration:120ms;transition-duration:120ms;-webkit-transition-property:background-color, border, -webkit-transform;transition-property:background-color, border, -webkit-transform;transition-property:transform, background-color, border;transition-property:transform, background-color, border, -webkit-transform;-webkit-transition-timing-function:ease;transition-timing-function:ease;z-index:2}.range-knob::before{border-radius:50%;position:absolute;width:var(--knob-size);height:var(--knob-size);-webkit-transform:scale(1);transform:scale(1);-webkit-transition:0.267s cubic-bezier(0, 0, 0.58, 1);transition:0.267s cubic-bezier(0, 0, 0.58, 1);background:var(--knob-background);content:\"\";opacity:0.13;pointer-events:none}.range-knob::before{inset-inline-start:0}.range-tick{position:absolute;top:calc((var(--height) - var(--bar-height)) / 2);width:var(--bar-height);height:var(--bar-height);background:var(--bar-background-active);z-index:1;pointer-events:none}.range-tick-active{background:transparent}.range-pin{padding-left:0;padding-right:0;padding-top:8px;padding-bottom:8px;border-radius:50%;-webkit-transform:translate3d(0,  0,  0) scale(0.01);transform:translate3d(0,  0,  0) scale(0.01);display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:1.75rem;height:1.75rem;-webkit-transition:background 120ms ease, -webkit-transform 120ms ease;transition:background 120ms ease, -webkit-transform 120ms ease;transition:transform 120ms ease, background 120ms ease;transition:transform 120ms ease, background 120ms ease, -webkit-transform 120ms ease;background:var(--pin-background);color:var(--pin-color)}.range-pin::before{bottom:-1px;-webkit-margin-start:-13px;margin-inline-start:-13px;border-radius:50% 50% 50% 0;position:absolute;width:26px;height:26px;-webkit-transform:rotate(-45deg);transform:rotate(-45deg);-webkit-transition:background 120ms ease;transition:background 120ms ease;background:var(--pin-background);content:\"\";z-index:-1}.range-pin::before{inset-inline-start:50%}:host-context([dir=rtl]) .range-pin::before{left:unset}[dir=rtl] .range-pin::before{left:unset}@supports selector(:dir(rtl)){.range-pin::before:dir(rtl){left:unset}}.range-knob-pressed .range-pin,.range-knob-handle.ion-focused .range-pin{-webkit-transform:translate3d(0, calc(-100% + 4px), 0) scale(1);transform:translate3d(0, calc(-100% + 4px), 0) scale(1)}@media (any-hover: hover){.range-knob-handle:hover .range-knob:before{-webkit-transform:scale(2);transform:scale(2);opacity:0.13}}.range-knob-handle.ion-activated .range-knob:before,.range-knob-handle.ion-focused .range-knob:before,.range-knob-handle.range-knob-pressed .range-knob:before{-webkit-transform:scale(2);transform:scale(2)}.range-knob-handle.ion-focused .range-knob::before{opacity:0.13}.range-knob-handle.ion-activated .range-knob::before,.range-knob-handle.range-knob-pressed .range-knob::before{opacity:0.25}:host(:not(.range-has-pin)) .range-knob-pressed .range-knob,:host(:not(.range-has-pin)) .range-knob-handle.ion-focused .range-knob{-webkit-transform:scale(1);transform:scale(1)}:host(.range-disabled) .range-bar-active,:host(.range-disabled) .range-bar,:host(.range-disabled) .range-tick{background-color:var(--ion-color-step-250, var(--ion-background-color-step-250, #bfbfbf))}:host(.range-disabled) .range-knob{-webkit-transform:scale(0.55);transform:scale(0.55);outline:5px solid #fff;background-color:var(--ion-color-step-250, var(--ion-background-color-step-250, #bfbfbf))}:host(.range-disabled) .label-text-wrapper,:host(.range-disabled) ::slotted([slot=start]),:host(.range-disabled) ::slotted([slot=end]){opacity:0.38}";

const Range = /*@__PURE__*/ proxyCustomElement(class Range extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionChange = createEvent(this, "ionChange", 7);
        this.ionInput = createEvent(this, "ionInput", 7);
        this.ionFocus = createEvent(this, "ionFocus", 7);
        this.ionBlur = createEvent(this, "ionBlur", 7);
        this.ionKnobMoveStart = createEvent(this, "ionKnobMoveStart", 7);
        this.ionKnobMoveEnd = createEvent(this, "ionKnobMoveEnd", 7);
        this.rangeId = `ion-r-${rangeIds++}`;
        this.didLoad = false;
        this.noUpdate = false;
        this.hasFocus = false;
        this.inheritedAttributes = {};
        this.contentEl = null;
        this.initialContentScrollY = true;
        this.ratioA = 0;
        this.ratioB = 0;
        /**
         * The name of the control, which is submitted with the form data.
         */
        this.name = this.rangeId;
        /**
         * Show two knobs.
         */
        this.dualKnobs = false;
        /**
         * Minimum integer value of the range.
         */
        this.min = 0;
        /**
         * Maximum integer value of the range.
         */
        this.max = 100;
        /**
         * If `true`, a pin with integer value is shown when the knob
         * is pressed.
         */
        this.pin = false;
        /**
         * A callback used to format the pin text.
         * By default the pin text is set to `Math.round(value)`.
         *
         * See https://ionicframework.com/docs/troubleshooting/runtime#accessing-this
         * if you need to access `this` from within the callback.
         */
        this.pinFormatter = (value) => Math.round(value);
        /**
         * If `true`, the knob snaps to tick marks evenly spaced based
         * on the step property value.
         */
        this.snaps = false;
        /**
         * Specifies the value granularity.
         */
        this.step = 1;
        /**
         * If `true`, tick marks are displayed based on the step value.
         * Only applies when `snaps` is `true`.
         */
        this.ticks = true;
        /**
         * If `true`, the user cannot interact with the range.
         */
        this.disabled = false;
        /**
         * the value of the range.
         */
        this.value = 0;
        /**
         * Compares two RangeValue inputs to determine if they are different.
         *
         * @param newVal - The new value.
         * @param oldVal - The old value.
         * @returns `true` if the values are different, `false` otherwise.
         */
        this.compareValues = (newVal, oldVal) => {
            if (typeof newVal === 'object' && typeof oldVal === 'object') {
                return newVal.lower !== oldVal.lower || newVal.upper !== oldVal.upper;
            }
            return newVal !== oldVal;
        };
        this.clampBounds = (value) => {
            return clamp(this.min, value, this.max);
        };
        this.ensureValueInBounds = (value) => {
            if (this.dualKnobs) {
                return {
                    lower: this.clampBounds(value.lower),
                    upper: this.clampBounds(value.upper),
                };
            }
            else {
                return this.clampBounds(value);
            }
        };
        /**
         * Where to place the label relative to the range.
         * `"start"`: The label will appear to the left of the range in LTR and to the right in RTL.
         * `"end"`: The label will appear to the right of the range in LTR and to the left in RTL.
         * `"fixed"`: The label has the same behavior as `"start"` except it also has a fixed width. Long text will be truncated with ellipses ("...").
         * `"stacked"`: The label will appear above the range regardless of the direction.
         */
        this.labelPlacement = 'start';
        this.setupGesture = async () => {
            const rangeSlider = this.rangeSlider;
            if (rangeSlider) {
                this.gesture = (await import('./index3.js')).createGesture({
                    el: rangeSlider,
                    gestureName: 'range',
                    gesturePriority: 100,
                    /**
                     * Provide a threshold since the drag movement
                     * might be a user scrolling the view.
                     * If this is true, then the range
                     * should not move.
                     */
                    threshold: 10,
                    onStart: () => this.onStart(),
                    onMove: (ev) => this.onMove(ev),
                    onEnd: (ev) => this.onEnd(ev),
                });
                this.gesture.enable(!this.disabled);
            }
        };
        this.handleKeyboard = (knob, isIncrease) => {
            const { ensureValueInBounds } = this;
            let step = this.step;
            step = step > 0 ? step : 1;
            step = step / (this.max - this.min);
            if (!isIncrease) {
                step *= -1;
            }
            if (knob === 'A') {
                this.ratioA = clamp(0, this.ratioA + step, 1);
            }
            else {
                this.ratioB = clamp(0, this.ratioB + step, 1);
            }
            this.ionKnobMoveStart.emit({ value: ensureValueInBounds(this.value) });
            this.updateValue();
            this.emitValueChange();
            this.ionKnobMoveEnd.emit({ value: ensureValueInBounds(this.value) });
        };
        this.onBlur = () => {
            if (this.hasFocus) {
                this.hasFocus = false;
                this.ionBlur.emit();
            }
        };
        this.onFocus = () => {
            if (!this.hasFocus) {
                this.hasFocus = true;
                this.ionFocus.emit();
            }
        };
    }
    debounceChanged() {
        const { ionInput, debounce, originalIonInput } = this;
        /**
         * If debounce is undefined, we have to manually revert the ionInput emitter in case
         * debounce used to be set to a number. Otherwise, the event would stay debounced.
         */
        this.ionInput = debounce === undefined ? originalIonInput !== null && originalIonInput !== void 0 ? originalIonInput : ionInput : debounceEvent(ionInput, debounce);
    }
    minChanged(newValue) {
        if (!isSafeNumber(newValue)) {
            this.min = 0;
        }
        if (!this.noUpdate) {
            this.updateRatio();
        }
    }
    maxChanged(newValue) {
        if (!isSafeNumber(newValue)) {
            this.max = 100;
        }
        if (!this.noUpdate) {
            this.updateRatio();
        }
    }
    stepChanged(newValue) {
        if (!isSafeNumber(newValue)) {
            this.step = 1;
        }
    }
    activeBarStartChanged() {
        const { activeBarStart } = this;
        if (activeBarStart !== undefined) {
            if (activeBarStart > this.max) {
                printIonWarning(`[ion-range] - The value of activeBarStart (${activeBarStart}) is greater than the max (${this.max}). Valid values are greater than or equal to the min value and less than or equal to the max value.`, this.el);
                this.activeBarStart = this.max;
            }
            else if (activeBarStart < this.min) {
                printIonWarning(`[ion-range] - The value of activeBarStart (${activeBarStart}) is less than the min (${this.min}). Valid values are greater than or equal to the min value and less than or equal to the max value.`, this.el);
                this.activeBarStart = this.min;
            }
        }
    }
    disabledChanged() {
        if (this.gesture) {
            this.gesture.enable(!this.disabled);
        }
    }
    valueChanged(newValue, oldValue) {
        const valuesChanged = this.compareValues(newValue, oldValue);
        if (valuesChanged) {
            this.ionInput.emit({ value: this.value });
        }
        if (!this.noUpdate) {
            this.updateRatio();
        }
    }
    componentWillLoad() {
        /**
         * If user has custom ID set then we should
         * not assign the default incrementing ID.
         */
        if (this.el.hasAttribute('id')) {
            this.rangeId = this.el.getAttribute('id');
        }
        this.inheritedAttributes = inheritAriaAttributes(this.el);
        // If min, max, or step are not safe, set them to 0, 100, and 1, respectively.
        // Each watch does this, but not before the initial load.
        this.min = isSafeNumber(this.min) ? this.min : 0;
        this.max = isSafeNumber(this.max) ? this.max : 100;
        this.step = isSafeNumber(this.step) ? this.step : 1;
    }
    componentDidLoad() {
        this.originalIonInput = this.ionInput;
        this.setupGesture();
        this.updateRatio();
        this.didLoad = true;
    }
    connectedCallback() {
        var _a;
        this.updateRatio();
        this.debounceChanged();
        this.disabledChanged();
        this.activeBarStartChanged();
        /**
         * If we have not yet rendered
         * ion-range, then rangeSlider is not defined.
         * But if we are moving ion-range via appendChild,
         * then rangeSlider will be defined.
         */
        if (this.didLoad) {
            this.setupGesture();
        }
        const ionContent = findClosestIonContent(this.el);
        this.contentEl = (_a = ionContent === null || ionContent === void 0 ? void 0 : ionContent.querySelector('.ion-content-scroll-host')) !== null && _a !== void 0 ? _a : ionContent;
    }
    disconnectedCallback() {
        if (this.gesture) {
            this.gesture.destroy();
            this.gesture = undefined;
        }
    }
    getValue() {
        var _a;
        const value = (_a = this.value) !== null && _a !== void 0 ? _a : 0;
        if (this.dualKnobs) {
            if (typeof value === 'object') {
                return value;
            }
            return {
                lower: 0,
                upper: value,
            };
        }
        else {
            if (typeof value === 'object') {
                return value.upper;
            }
            return value;
        }
    }
    /**
     * Emits an `ionChange` event.
     *
     * This API should be called for user committed changes.
     * This API should not be used for external value changes.
     */
    emitValueChange() {
        this.value = this.ensureValueInBounds(this.value);
        this.ionChange.emit({ value: this.value });
    }
    /**
     * The value should be updated on touch end or
     * when the component is being dragged.
     * This follows the native behavior of mobile devices.
     *
     * For example: When the user lifts their finger from the
     * screen after tapping the bar or dragging the bar or knob.
     */
    onStart() {
        this.ionKnobMoveStart.emit({ value: this.ensureValueInBounds(this.value) });
    }
    /**
     * The value should be updated while dragging the
     * bar or knob.
     *
     * While the user is dragging, the view
     * should not scroll. This is to prevent the user from
     * feeling disoriented while dragging.
     *
     * The user can scroll on the view if the knob or
     * bar is not being dragged.
     *
     * @param detail The details of the gesture event.
     */
    onMove(detail) {
        const { contentEl, pressedKnob } = this;
        const currentX = detail.currentX;
        /**
         * Since the user is dragging on the bar or knob, the view should not scroll.
         *
         * This only needs to be done once.
         */
        if (contentEl && this.pressedKnob === undefined) {
            this.initialContentScrollY = disableContentScrollY(contentEl);
        }
        /**
         * The `pressedKnob` can be undefined if the user just
         * started dragging the knob.
         *
         * This is necessary to determine which knob the user is dragging,
         * especially when it's a dual knob.
         * Plus, it determines when to apply certain styles.
         *
         * This only needs to be done once since the knob won't change
         * while the user is dragging.
         */
        if (pressedKnob === undefined) {
            this.setPressedKnob(currentX);
        }
        this.update(currentX);
    }
    /**
     * The value should be updated on touch end:
     * - When the user lifts their finger from the screen after
     * tapping the bar.
     *
     * @param detail The details of the gesture or mouse event.
     */
    onEnd(detail) {
        var _a;
        const { contentEl, initialContentScrollY } = this;
        const currentX = (_a = detail.currentX) !== null && _a !== void 0 ? _a : detail.clientX;
        /**
         * The `pressedKnob` can be undefined if the user never
         * dragged the knob. They just tapped on the bar.
         *
         * This is necessary to determine which knob the user is changing,
         * especially when it's a dual knob.
         * Plus, it determines when to apply certain styles.
         */
        if (this.pressedKnob === undefined) {
            this.setPressedKnob(currentX);
        }
        /**
         * The user is no longer dragging the bar or
         * knob (if they were dragging it).
         *
         * The user can now scroll on the view in the next gesture event.
         */
        if (contentEl && this.pressedKnob !== undefined) {
            resetContentScrollY(contentEl, initialContentScrollY);
        }
        // update the active knob's position
        this.update(currentX);
        /**
         * Reset the pressed knob to undefined since the user
         * may start dragging a different knob in the next gesture event.
         */
        this.pressedKnob = undefined;
        this.emitValueChange();
        this.ionKnobMoveEnd.emit({ value: this.ensureValueInBounds(this.value) });
    }
    update(currentX) {
        // figure out where the pointer is currently at
        // update the knob being interacted with
        const rect = this.rect;
        let ratio = clamp(0, (currentX - rect.left) / rect.width, 1);
        if (isRTL(this.el)) {
            ratio = 1 - ratio;
        }
        if (this.snaps) {
            // snaps the ratio to the current value
            ratio = valueToRatio(ratioToValue(ratio, this.min, this.max, this.step), this.min, this.max);
        }
        // update which knob is pressed
        if (this.pressedKnob === 'A') {
            this.ratioA = ratio;
        }
        else {
            this.ratioB = ratio;
        }
        // Update input value
        this.updateValue();
    }
    setPressedKnob(currentX) {
        const rect = (this.rect = this.rangeSlider.getBoundingClientRect());
        // figure out which knob they started closer to
        let ratio = clamp(0, (currentX - rect.left) / rect.width, 1);
        if (isRTL(this.el)) {
            ratio = 1 - ratio;
        }
        this.pressedKnob = !this.dualKnobs || Math.abs(this.ratioA - ratio) < Math.abs(this.ratioB - ratio) ? 'A' : 'B';
        this.setFocus(this.pressedKnob);
    }
    get valA() {
        return ratioToValue(this.ratioA, this.min, this.max, this.step);
    }
    get valB() {
        return ratioToValue(this.ratioB, this.min, this.max, this.step);
    }
    get ratioLower() {
        if (this.dualKnobs) {
            return Math.min(this.ratioA, this.ratioB);
        }
        const { activeBarStart } = this;
        if (activeBarStart == null) {
            return 0;
        }
        return valueToRatio(activeBarStart, this.min, this.max);
    }
    get ratioUpper() {
        if (this.dualKnobs) {
            return Math.max(this.ratioA, this.ratioB);
        }
        return this.ratioA;
    }
    updateRatio() {
        const value = this.getValue();
        const { min, max } = this;
        if (this.dualKnobs) {
            this.ratioA = valueToRatio(value.lower, min, max);
            this.ratioB = valueToRatio(value.upper, min, max);
        }
        else {
            this.ratioA = valueToRatio(value, min, max);
        }
    }
    updateValue() {
        this.noUpdate = true;
        const { valA, valB } = this;
        this.value = !this.dualKnobs
            ? valA
            : {
                lower: Math.min(valA, valB),
                upper: Math.max(valA, valB),
            };
        this.noUpdate = false;
    }
    setFocus(knob) {
        if (this.el.shadowRoot) {
            const knobEl = this.el.shadowRoot.querySelector(knob === 'A' ? '.range-knob-a' : '.range-knob-b');
            if (knobEl) {
                knobEl.focus();
            }
        }
    }
    /**
     * Returns true if content was passed to the "start" slot
     */
    get hasStartSlotContent() {
        return this.el.querySelector('[slot="start"]') !== null;
    }
    /**
     * Returns true if content was passed to the "end" slot
     */
    get hasEndSlotContent() {
        return this.el.querySelector('[slot="end"]') !== null;
    }
    get hasLabel() {
        return this.label !== undefined || this.el.querySelector('[slot="label"]') !== null;
    }
    renderRangeSlider() {
        var _a;
        const { min, max, step, handleKeyboard, pressedKnob, disabled, pin, ratioLower, ratioUpper, pinFormatter, inheritedAttributes, } = this;
        let barStart = `${ratioLower * 100}%`;
        let barEnd = `${100 - ratioUpper * 100}%`;
        const rtl = isRTL(this.el);
        const start = rtl ? 'right' : 'left';
        const end = rtl ? 'left' : 'right';
        const tickStyle = (tick) => {
            return {
                [start]: tick[start],
            };
        };
        if (this.dualKnobs === false) {
            /**
             * When the value is less than the activeBarStart or the min value,
             * the knob will display at the start of the active bar.
             */
            if (this.valA < ((_a = this.activeBarStart) !== null && _a !== void 0 ? _a : this.min)) {
                /**
                 * Sets the bar positions relative to the upper and lower limits.
                 * Converts the ratio values into percentages, used as offsets for left/right styles.
                 *
                 * The ratioUpper refers to the knob position on the bar.
                 * The ratioLower refers to the end position of the active bar (the value).
                 */
                barStart = `${ratioUpper * 100}%`;
                barEnd = `${100 - ratioLower * 100}%`;
            }
            else {
                /**
                 * Otherwise, the knob will display at the end of the active bar.
                 *
                 * The ratioLower refers to the start position of the active bar (the value).
                 * The ratioUpper refers to the knob position on the bar.
                 */
                barStart = `${ratioLower * 100}%`;
                barEnd = `${100 - ratioUpper * 100}%`;
            }
        }
        const barStyle = {
            [start]: barStart,
            [end]: barEnd,
        };
        const ticks = [];
        if (this.snaps && this.ticks) {
            for (let value = min; value <= max; value += step) {
                const ratio = valueToRatio(value, min, max);
                const ratioMin = Math.min(ratioLower, ratioUpper);
                const ratioMax = Math.max(ratioLower, ratioUpper);
                const tick = {
                    ratio,
                    /**
                     * Sets the tick mark as active when the tick is between the min bounds and the knob.
                     * When using activeBarStart, the tick mark will be active between the knob and activeBarStart.
                     */
                    active: ratio >= ratioMin && ratio <= ratioMax,
                };
                tick[start] = `${ratio * 100}%`;
                ticks.push(tick);
            }
        }
        return (h("div", { class: "range-slider", ref: (rangeEl) => (this.rangeSlider = rangeEl),
            /**
             * Since the gesture has a threshold, the value
             * won't change until the user has dragged past
             * the threshold. This is to prevent the range
             * from moving when the user is scrolling.
             *
             * This results in the value not being updated
             * and the event emitters not being triggered
             * if the user taps on the range. This is why
             * we need to listen for the "pointerUp" event.
             */
            onPointerUp: (ev) => {
                /**
                 * If the user drags the knob on the web
                 * version (does not occur on mobile),
                 * the "pointerUp" event will be triggered
                 * along with the gesture's events.
                 * This leads to duplicate events.
                 *
                 * By checking if the pressedKnob is undefined,
                 * we can determine if the "pointerUp" event was
                 * triggered by a tap or a drag. If it was
                 * dragged, the pressedKnob will be defined.
                 */
                if (this.pressedKnob === undefined) {
                    this.onStart();
                    this.onEnd(ev);
                }
            } }, ticks.map((tick) => (h("div", { style: tickStyle(tick), role: "presentation", class: {
                'range-tick': true,
                'range-tick-active': tick.active,
            }, part: tick.active ? 'tick-active' : 'tick' }))), h("div", { class: "range-bar-container" }, h("div", { class: "range-bar", role: "presentation", part: "bar" }), h("div", { class: {
                'range-bar': true,
                'range-bar-active': true,
                'has-ticks': ticks.length > 0,
            }, role: "presentation", style: barStyle, part: "bar-active" })), renderKnob(rtl, {
            knob: 'A',
            pressed: pressedKnob === 'A',
            value: this.valA,
            ratio: this.ratioA,
            pin,
            pinFormatter,
            disabled,
            handleKeyboard,
            min,
            max,
            inheritedAttributes,
        }), this.dualKnobs &&
            renderKnob(rtl, {
                knob: 'B',
                pressed: pressedKnob === 'B',
                value: this.valB,
                ratio: this.ratioB,
                pin,
                pinFormatter,
                disabled,
                handleKeyboard,
                min,
                max,
                inheritedAttributes,
            })));
    }
    render() {
        const { disabled, el, hasLabel, rangeId, pin, pressedKnob, labelPlacement, label } = this;
        const inItem = hostContext('ion-item', el);
        /**
         * If there is no start content then the knob at
         * the min value will be cut off by the item margin.
         */
        const hasStartContent = (hasLabel && (labelPlacement === 'start' || labelPlacement === 'fixed')) || this.hasStartSlotContent;
        const needsStartAdjustment = inItem && !hasStartContent;
        /**
         * If there is no end content then the knob at
         * the max value will be cut off by the item margin.
         */
        const hasEndContent = (hasLabel && labelPlacement === 'end') || this.hasEndSlotContent;
        const needsEndAdjustment = inItem && !hasEndContent;
        const mode = getIonMode(this);
        renderHiddenInput(true, el, this.name, JSON.stringify(this.getValue()), disabled);
        return (h(Host, { key: '124909954930d95f353e8593fd967de1486b0315', onFocusin: this.onFocus, onFocusout: this.onBlur, id: rangeId, class: createColorClasses(this.color, {
                [mode]: true,
                'in-item': inItem,
                'range-disabled': disabled,
                'range-pressed': pressedKnob !== undefined,
                'range-has-pin': pin,
                [`range-label-placement-${labelPlacement}`]: true,
                'range-item-start-adjustment': needsStartAdjustment,
                'range-item-end-adjustment': needsEndAdjustment,
            }) }, h("label", { key: '0af177a2ba5869d3441c4b3f393835218807a418', class: "range-wrapper", id: "range-label" }, h("div", { key: '4d834224b9c834e88497f58af4339348cec9ca1c', class: {
                'label-text-wrapper': true,
                'label-text-wrapper-hidden': !hasLabel,
            }, part: "label" }, label !== undefined ? h("div", { class: "label-text" }, label) : h("slot", { name: "label" })), h("div", { key: '797d39ac73610f6d81d0b99d71982f98f2a66c88', class: "native-wrapper" }, h("slot", { key: '88824589cac5bb2134c30bed067ed11f6e81d887', name: "start" }), this.renderRangeSlider(), h("slot", { key: '7207a1164b272f56634435f7bff9114fb5d9f085', name: "end" })))));
    }
    get el() { return this; }
    static get watchers() { return {
        "debounce": ["debounceChanged"],
        "min": ["minChanged"],
        "max": ["maxChanged"],
        "step": ["stepChanged"],
        "activeBarStart": ["activeBarStartChanged"],
        "disabled": ["disabledChanged"],
        "value": ["valueChanged"]
    }; }
    static get style() { return {
        ios: rangeIosCss,
        md: rangeMdCss
    }; }
}, [33, "ion-range", {
        "color": [513],
        "debounce": [2],
        "name": [1],
        "label": [1],
        "dualKnobs": [4, "dual-knobs"],
        "min": [2],
        "max": [2],
        "pin": [4],
        "pinFormatter": [16, "pin-formatter"],
        "snaps": [4],
        "step": [2],
        "ticks": [4],
        "activeBarStart": [1026, "active-bar-start"],
        "disabled": [4],
        "value": [1026],
        "labelPlacement": [1, "label-placement"],
        "ratioA": [32],
        "ratioB": [32],
        "pressedKnob": [32]
    }, undefined, {
        "debounce": ["debounceChanged"],
        "min": ["minChanged"],
        "max": ["maxChanged"],
        "step": ["stepChanged"],
        "activeBarStart": ["activeBarStartChanged"],
        "disabled": ["disabledChanged"],
        "value": ["valueChanged"]
    }]);
const renderKnob = (rtl, { knob, value, ratio, min, max, disabled, pressed, pin, handleKeyboard, pinFormatter, inheritedAttributes }) => {
    const start = rtl ? 'right' : 'left';
    const knobStyle = () => {
        const style = {};
        style[start] = `${ratio * 100}%`;
        return style;
    };
    // The aria label should be preferred over visible text if both are specified
    const ariaLabel = inheritedAttributes['aria-label'];
    return (h("div", { onKeyDown: (ev) => {
            const key = ev.key;
            if (key === 'ArrowLeft' || key === 'ArrowDown') {
                handleKeyboard(knob, false);
                ev.preventDefault();
                ev.stopPropagation();
            }
            else if (key === 'ArrowRight' || key === 'ArrowUp') {
                handleKeyboard(knob, true);
                ev.preventDefault();
                ev.stopPropagation();
            }
        }, class: {
            'range-knob-handle': true,
            'range-knob-a': knob === 'A',
            'range-knob-b': knob === 'B',
            'range-knob-pressed': pressed,
            'range-knob-min': value === min,
            'range-knob-max': value === max,
            'ion-activatable': true,
            'ion-focusable': true,
        }, style: knobStyle(), role: "slider", tabindex: disabled ? -1 : 0, "aria-label": ariaLabel !== undefined ? ariaLabel : null, "aria-labelledby": ariaLabel === undefined ? 'range-label' : null, "aria-valuemin": min, "aria-valuemax": max, "aria-disabled": disabled ? 'true' : null, "aria-valuenow": value }, pin && (h("div", { class: "range-pin", role: "presentation", part: "pin" }, pinFormatter(value))), h("div", { class: "range-knob", role: "presentation", part: "knob" })));
};
const ratioToValue = (ratio, min, max, step) => {
    let value = (max - min) * ratio;
    if (step > 0) {
        // round to nearest multiple of step, then add min
        value = Math.round(value / step) * step + min;
    }
    const clampedValue = clamp(min, value, max);
    return roundToMaxDecimalPlaces(clampedValue, min, max, step);
};
const valueToRatio = (value, min, max) => {
    return clamp(0, (value - min) / (max - min), 1);
};
let rangeIds = 0;
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-range"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-range":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Range);
            }
            break;
    } });
}

const IonRange = Range;
const defineCustomElement = defineCustomElement$1;

export { IonRange, defineCustomElement };
