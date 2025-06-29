/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent, h, Host } from '@stencil/core/internal/client';
import { a as addEventListener, b as removeEventListener } from './helpers.js';
import { h as hostContext, c as createColorClasses } from './theme.js';
import { b as getIonMode } from './ionic-global.js';

/**
 * Uses the compareWith param to compare two values to determine if they are equal.
 *
 * @param currentValue The current value of the control.
 * @param compareValue The value to compare against.
 * @param compareWith The function or property name to use to compare values.
 */
const compareOptions = (currentValue, compareValue, compareWith) => {
    if (typeof compareWith === 'function') {
        return compareWith(currentValue, compareValue);
    }
    else if (typeof compareWith === 'string') {
        return currentValue[compareWith] === compareValue[compareWith];
    }
    else {
        return Array.isArray(compareValue) ? compareValue.includes(currentValue) : currentValue === compareValue;
    }
};
/**
 * Compares a value against the current value(s) to determine if it is selected.
 *
 * @param currentValue The current value of the control.
 * @param compareValue The value to compare against.
 * @param compareWith The function or property name to use to compare values.
 */
const isOptionSelected = (currentValue, compareValue, compareWith) => {
    if (currentValue === undefined) {
        return false;
    }
    if (Array.isArray(currentValue)) {
        return currentValue.some((val) => compareOptions(val, compareValue, compareWith));
    }
    else {
        return compareOptions(currentValue, compareValue, compareWith);
    }
};

const radioIosCss = ":host{--inner-border-radius:50%;display:inline-block;position:relative;max-width:100%;min-height:inherit;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:2;-webkit-box-sizing:border-box;box-sizing:border-box}:host(.radio-disabled){pointer-events:none}.radio-icon{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:100%;height:100%;contain:layout size style}.radio-icon,.radio-inner{-webkit-box-sizing:border-box;box-sizing:border-box}input{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;margin:0;padding:0;border:0;outline:0;clip:rect(0 0 0 0);opacity:0;overflow:hidden;-webkit-appearance:none;-moz-appearance:none}:host(:focus){outline:none}:host(.in-item){-ms-flex:1 1 0px;flex:1 1 0;width:100%;height:100%}:host([slot=start]),:host([slot=end]){-ms-flex:initial;flex:initial;width:auto}.radio-wrapper{display:-ms-flexbox;display:flex;position:relative;-ms-flex-positive:1;flex-grow:1;-ms-flex-align:center;align-items:center;-ms-flex-pack:justify;justify-content:space-between;height:inherit;min-height:inherit;cursor:inherit}.label-text-wrapper{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}:host(.in-item) .label-text-wrapper{margin-top:10px;margin-bottom:10px}:host(.in-item.radio-label-placement-stacked) .label-text-wrapper{margin-top:10px;margin-bottom:16px}:host(.in-item.radio-label-placement-stacked) .native-wrapper{margin-bottom:10px}.label-text-wrapper-hidden{display:none}.native-wrapper{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}:host(.radio-justify-space-between) .radio-wrapper{-ms-flex-pack:justify;justify-content:space-between}:host(.radio-justify-start) .radio-wrapper{-ms-flex-pack:start;justify-content:start}:host(.radio-justify-end) .radio-wrapper{-ms-flex-pack:end;justify-content:end}:host(.radio-alignment-start) .radio-wrapper{-ms-flex-align:start;align-items:start}:host(.radio-alignment-center) .radio-wrapper{-ms-flex-align:center;align-items:center}:host(.radio-justify-space-between),:host(.radio-justify-start),:host(.radio-justify-end),:host(.radio-alignment-start),:host(.radio-alignment-center){display:block}:host(.radio-label-placement-start) .radio-wrapper{-ms-flex-direction:row;flex-direction:row}:host(.radio-label-placement-start) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px}:host(.radio-label-placement-end) .radio-wrapper{-ms-flex-direction:row-reverse;flex-direction:row-reverse}:host(.radio-label-placement-end) .label-text-wrapper{-webkit-margin-start:16px;margin-inline-start:16px;-webkit-margin-end:0;margin-inline-end:0}:host(.radio-label-placement-fixed) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px}:host(.radio-label-placement-fixed) .label-text-wrapper{-ms-flex:0 0 100px;flex:0 0 100px;width:100px;min-width:100px}:host(.radio-label-placement-stacked) .radio-wrapper{-ms-flex-direction:column;flex-direction:column}:host(.radio-label-placement-stacked) .label-text-wrapper{-webkit-transform:scale(0.75);transform:scale(0.75);margin-left:0;margin-right:0;margin-bottom:16px;max-width:calc(100% / 0.75)}:host(.radio-label-placement-stacked.radio-alignment-start) .label-text-wrapper{-webkit-transform-origin:left top;transform-origin:left top}:host-context([dir=rtl]):host(.radio-label-placement-stacked.radio-alignment-start) .label-text-wrapper,:host-context([dir=rtl]).radio-label-placement-stacked.radio-alignment-start .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}@supports selector(:dir(rtl)){:host(.radio-label-placement-stacked.radio-alignment-start:dir(rtl)) .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}}:host(.radio-label-placement-stacked.radio-alignment-center) .label-text-wrapper{-webkit-transform-origin:center top;transform-origin:center top}:host-context([dir=rtl]):host(.radio-label-placement-stacked.radio-alignment-center) .label-text-wrapper,:host-context([dir=rtl]).radio-label-placement-stacked.radio-alignment-center .label-text-wrapper{-webkit-transform-origin:calc(100% - center) top;transform-origin:calc(100% - center) top}@supports selector(:dir(rtl)){:host(.radio-label-placement-stacked.radio-alignment-center:dir(rtl)) .label-text-wrapper{-webkit-transform-origin:calc(100% - center) top;transform-origin:calc(100% - center) top}}:host{--color-checked:var(--ion-color-primary, #0054e9)}:host(.ion-color.radio-checked) .radio-inner{border-color:var(--ion-color-base)}.item-radio.item-ios ion-label{-webkit-margin-start:0;margin-inline-start:0}.radio-inner{width:33%;height:50%}:host(.radio-checked) .radio-inner{-webkit-transform:rotate(45deg);transform:rotate(45deg);border-width:0.125rem;border-top-width:0;border-left-width:0;border-style:solid;border-color:var(--color-checked)}:host(.radio-disabled){opacity:0.3}:host(.ion-focused) .radio-icon::after{border-radius:var(--inner-border-radius);top:-8px;display:block;position:absolute;width:36px;height:36px;background:var(--ion-color-primary-tint, #1a65eb);content:\"\";opacity:0.2}:host(.ion-focused) .radio-icon::after{inset-inline-start:-9px}.native-wrapper .radio-icon{width:0.9375rem;height:1.5rem}";

const radioMdCss = ":host{--inner-border-radius:50%;display:inline-block;position:relative;max-width:100%;min-height:inherit;cursor:pointer;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:2;-webkit-box-sizing:border-box;box-sizing:border-box}:host(.radio-disabled){pointer-events:none}.radio-icon{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;width:100%;height:100%;contain:layout size style}.radio-icon,.radio-inner{-webkit-box-sizing:border-box;box-sizing:border-box}input{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;margin:0;padding:0;border:0;outline:0;clip:rect(0 0 0 0);opacity:0;overflow:hidden;-webkit-appearance:none;-moz-appearance:none}:host(:focus){outline:none}:host(.in-item){-ms-flex:1 1 0px;flex:1 1 0;width:100%;height:100%}:host([slot=start]),:host([slot=end]){-ms-flex:initial;flex:initial;width:auto}.radio-wrapper{display:-ms-flexbox;display:flex;position:relative;-ms-flex-positive:1;flex-grow:1;-ms-flex-align:center;align-items:center;-ms-flex-pack:justify;justify-content:space-between;height:inherit;min-height:inherit;cursor:inherit}.label-text-wrapper{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}:host(.in-item) .label-text-wrapper{margin-top:10px;margin-bottom:10px}:host(.in-item.radio-label-placement-stacked) .label-text-wrapper{margin-top:10px;margin-bottom:16px}:host(.in-item.radio-label-placement-stacked) .native-wrapper{margin-bottom:10px}.label-text-wrapper-hidden{display:none}.native-wrapper{display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center}:host(.radio-justify-space-between) .radio-wrapper{-ms-flex-pack:justify;justify-content:space-between}:host(.radio-justify-start) .radio-wrapper{-ms-flex-pack:start;justify-content:start}:host(.radio-justify-end) .radio-wrapper{-ms-flex-pack:end;justify-content:end}:host(.radio-alignment-start) .radio-wrapper{-ms-flex-align:start;align-items:start}:host(.radio-alignment-center) .radio-wrapper{-ms-flex-align:center;align-items:center}:host(.radio-justify-space-between),:host(.radio-justify-start),:host(.radio-justify-end),:host(.radio-alignment-start),:host(.radio-alignment-center){display:block}:host(.radio-label-placement-start) .radio-wrapper{-ms-flex-direction:row;flex-direction:row}:host(.radio-label-placement-start) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px}:host(.radio-label-placement-end) .radio-wrapper{-ms-flex-direction:row-reverse;flex-direction:row-reverse}:host(.radio-label-placement-end) .label-text-wrapper{-webkit-margin-start:16px;margin-inline-start:16px;-webkit-margin-end:0;margin-inline-end:0}:host(.radio-label-placement-fixed) .label-text-wrapper{-webkit-margin-start:0;margin-inline-start:0;-webkit-margin-end:16px;margin-inline-end:16px}:host(.radio-label-placement-fixed) .label-text-wrapper{-ms-flex:0 0 100px;flex:0 0 100px;width:100px;min-width:100px}:host(.radio-label-placement-stacked) .radio-wrapper{-ms-flex-direction:column;flex-direction:column}:host(.radio-label-placement-stacked) .label-text-wrapper{-webkit-transform:scale(0.75);transform:scale(0.75);margin-left:0;margin-right:0;margin-bottom:16px;max-width:calc(100% / 0.75)}:host(.radio-label-placement-stacked.radio-alignment-start) .label-text-wrapper{-webkit-transform-origin:left top;transform-origin:left top}:host-context([dir=rtl]):host(.radio-label-placement-stacked.radio-alignment-start) .label-text-wrapper,:host-context([dir=rtl]).radio-label-placement-stacked.radio-alignment-start .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}@supports selector(:dir(rtl)){:host(.radio-label-placement-stacked.radio-alignment-start:dir(rtl)) .label-text-wrapper{-webkit-transform-origin:right top;transform-origin:right top}}:host(.radio-label-placement-stacked.radio-alignment-center) .label-text-wrapper{-webkit-transform-origin:center top;transform-origin:center top}:host-context([dir=rtl]):host(.radio-label-placement-stacked.radio-alignment-center) .label-text-wrapper,:host-context([dir=rtl]).radio-label-placement-stacked.radio-alignment-center .label-text-wrapper{-webkit-transform-origin:calc(100% - center) top;transform-origin:calc(100% - center) top}@supports selector(:dir(rtl)){:host(.radio-label-placement-stacked.radio-alignment-center:dir(rtl)) .label-text-wrapper{-webkit-transform-origin:calc(100% - center) top;transform-origin:calc(100% - center) top}}:host{--color:rgb(var(--ion-text-color-rgb, 0, 0, 0), 0.6);--color-checked:var(--ion-color-primary, #0054e9);--border-width:0.125rem;--border-style:solid;--border-radius:50%}:host(.ion-color) .radio-inner{background:var(--ion-color-base)}:host(.ion-color.radio-checked) .radio-icon{border-color:var(--ion-color-base)}.radio-icon{margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;border-radius:var(--border-radius);border-width:var(--border-width);border-style:var(--border-style);border-color:var(--color)}.radio-inner{border-radius:var(--inner-border-radius);width:calc(50% + var(--border-width));height:calc(50% + var(--border-width));-webkit-transform:scale3d(0, 0, 0);transform:scale3d(0, 0, 0);-webkit-transition:-webkit-transform 280ms cubic-bezier(0.4, 0, 0.2, 1);transition:-webkit-transform 280ms cubic-bezier(0.4, 0, 0.2, 1);transition:transform 280ms cubic-bezier(0.4, 0, 0.2, 1);transition:transform 280ms cubic-bezier(0.4, 0, 0.2, 1), -webkit-transform 280ms cubic-bezier(0.4, 0, 0.2, 1);background:var(--color-checked)}:host(.radio-checked) .radio-icon{border-color:var(--color-checked)}:host(.radio-checked) .radio-inner{-webkit-transform:scale3d(1, 1, 1);transform:scale3d(1, 1, 1)}:host(.radio-disabled) .label-text-wrapper{opacity:0.38}:host(.radio-disabled) .native-wrapper{opacity:0.63}:host(.ion-focused) .radio-icon::after{border-radius:var(--inner-border-radius);display:block;position:absolute;width:36px;height:36px;background:var(--ion-color-primary-tint, #1a65eb);content:\"\";opacity:0.2}.native-wrapper .radio-icon{width:1.25rem;height:1.25rem}";

const Radio = /*@__PURE__*/ proxyCustomElement(class Radio extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.__attachShadow();
        this.ionFocus = createEvent(this, "ionFocus", 7);
        this.ionBlur = createEvent(this, "ionBlur", 7);
        this.inputId = `ion-rb-${radioButtonIds++}`;
        this.radioGroup = null;
        /**
         * If `true`, the radio is selected.
         */
        this.checked = false;
        /**
         * The tabindex of the radio button.
         * @internal
         */
        this.buttonTabindex = -1;
        /**
         * The name of the control, which is submitted with the form data.
         */
        this.name = this.inputId;
        /**
         * If `true`, the user cannot interact with the radio.
         */
        this.disabled = false;
        /**
         * Where to place the label relative to the radio.
         * `"start"`: The label will appear to the left of the radio in LTR and to the right in RTL.
         * `"end"`: The label will appear to the right of the radio in LTR and to the left in RTL.
         * `"fixed"`: The label has the same behavior as `"start"` except it also has a fixed width. Long text will be truncated with ellipses ("...").
         * `"stacked"`: The label will appear above the radio regardless of the direction. The alignment of the label can be controlled with the `alignment` property.
         */
        this.labelPlacement = 'start';
        this.updateState = () => {
            if (this.radioGroup) {
                const { compareWith, value: radioGroupValue } = this.radioGroup;
                this.checked = isOptionSelected(radioGroupValue, this.value, compareWith);
            }
        };
        this.onClick = () => {
            const { radioGroup, checked, disabled } = this;
            if (disabled) {
                return;
            }
            /**
             * The modern control does not use a native input
             * inside of the radio host, so we cannot rely on the
             * ev.preventDefault() behavior above. If the radio
             * is checked and the parent radio group allows for empty
             * selection, then we can set the checked state to false.
             * Otherwise, the checked state should always be set
             * to true because the checked state cannot be toggled.
             */
            if (checked && (radioGroup === null || radioGroup === void 0 ? void 0 : radioGroup.allowEmptySelection)) {
                this.checked = false;
            }
            else {
                this.checked = true;
            }
        };
        this.onFocus = () => {
            this.ionFocus.emit();
        };
        this.onBlur = () => {
            this.ionBlur.emit();
        };
    }
    valueChanged() {
        /**
         * The new value of the radio may
         * match the radio group's value,
         * so we see if it should be checked.
         */
        this.updateState();
    }
    componentDidLoad() {
        /**
         * The value may be `undefined` if it
         * gets set before the radio is
         * rendered. This ensures that the radio
         * is checked if the value matches. This
         * happens most often when Angular is
         * rendering the radio.
         */
        this.updateState();
    }
    /** @internal */
    async setFocus(ev) {
        if (ev !== undefined) {
            ev.stopPropagation();
            ev.preventDefault();
        }
        this.el.focus();
    }
    /** @internal */
    async setButtonTabindex(value) {
        this.buttonTabindex = value;
    }
    connectedCallback() {
        if (this.value === undefined) {
            this.value = this.inputId;
        }
        const radioGroup = (this.radioGroup = this.el.closest('ion-radio-group'));
        if (radioGroup) {
            this.updateState();
            addEventListener(radioGroup, 'ionValueChange', this.updateState);
        }
    }
    disconnectedCallback() {
        const radioGroup = this.radioGroup;
        if (radioGroup) {
            removeEventListener(radioGroup, 'ionValueChange', this.updateState);
            this.radioGroup = null;
        }
    }
    get hasLabel() {
        return this.el.textContent !== '';
    }
    renderRadioControl() {
        return (h("div", { class: "radio-icon", part: "container" }, h("div", { class: "radio-inner", part: "mark" }), h("div", { class: "radio-ripple" })));
    }
    render() {
        const { checked, disabled, color, el, justify, labelPlacement, hasLabel, buttonTabindex, alignment } = this;
        const mode = getIonMode(this);
        const inItem = hostContext('ion-item', el);
        return (h(Host, { key: '3353b28172b7f837d4b38964169b5b5f4ba02788', onFocus: this.onFocus, onBlur: this.onBlur, onClick: this.onClick, class: createColorClasses(color, {
                [mode]: true,
                'in-item': inItem,
                'radio-checked': checked,
                'radio-disabled': disabled,
                [`radio-justify-${justify}`]: justify !== undefined,
                [`radio-alignment-${alignment}`]: alignment !== undefined,
                [`radio-label-placement-${labelPlacement}`]: true,
                // Focus and active styling should not apply when the radio is in an item
                'ion-activatable': !inItem,
                'ion-focusable': !inItem,
            }), role: "radio", "aria-checked": checked ? 'true' : 'false', "aria-disabled": disabled ? 'true' : null, tabindex: buttonTabindex }, h("label", { key: '418a0a48366ff900e97da123abf665bbbda87fb7', class: "radio-wrapper" }, h("div", { key: '6e5acdd8c8f5d0ad26632a65396afef8094153d1', class: {
                'label-text-wrapper': true,
                'label-text-wrapper-hidden': !hasLabel,
            }, part: "label" }, h("slot", { key: '10b157162cd283d624153c747679609cf0bbf11e' })), h("div", { key: '4c45cca95cb105cd6df1025a26e3c045272184a0', class: "native-wrapper" }, this.renderRadioControl()))));
    }
    get el() { return this; }
    static get watchers() { return {
        "value": ["valueChanged"]
    }; }
    static get style() { return {
        ios: radioIosCss,
        md: radioMdCss
    }; }
}, [33, "ion-radio", {
        "color": [513],
        "name": [1],
        "disabled": [4],
        "value": [8],
        "labelPlacement": [1, "label-placement"],
        "justify": [1],
        "alignment": [1],
        "checked": [32],
        "buttonTabindex": [32],
        "setFocus": [64],
        "setButtonTabindex": [64]
    }, undefined, {
        "value": ["valueChanged"]
    }]);
let radioButtonIds = 0;
function defineCustomElement() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-radio"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-radio":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Radio);
            }
            break;
    } });
}

export { Radio as R, compareOptions as c, defineCustomElement as d, isOptionSelected as i };
