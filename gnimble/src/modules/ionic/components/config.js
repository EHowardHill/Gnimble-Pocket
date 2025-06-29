/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { a as printIonError } from './index4.js';

/**
 * Does a simple sanitization of all elements
 * in an untrusted string
 */
const sanitizeDOMString = (untrustedString) => {
    try {
        if (untrustedString instanceof IonicSafeString) {
            return untrustedString.value;
        }
        if (!isSanitizerEnabled() || typeof untrustedString !== 'string' || untrustedString === '') {
            return untrustedString;
        }
        /**
         * onload is fired when appending to a document
         * fragment in Chrome. If a string
         * contains onload then we should not
         * attempt to add this to the fragment.
         */
        if (untrustedString.includes('onload=')) {
            return '';
        }
        /**
         * Create a document fragment
         * separate from the main DOM,
         * create a div to do our work in
         */
        const documentFragment = document.createDocumentFragment();
        const workingDiv = document.createElement('div');
        documentFragment.appendChild(workingDiv);
        workingDiv.innerHTML = untrustedString;
        /**
         * Remove any elements
         * that are blocked
         */
        blockedTags.forEach((blockedTag) => {
            const getElementsToRemove = documentFragment.querySelectorAll(blockedTag);
            for (let elementIndex = getElementsToRemove.length - 1; elementIndex >= 0; elementIndex--) {
                const element = getElementsToRemove[elementIndex];
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                else {
                    documentFragment.removeChild(element);
                }
                /**
                 * We still need to sanitize
                 * the children of this element
                 * as they are left behind
                 */
                const childElements = getElementChildren(element);
                /* eslint-disable-next-line */
                for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
                    sanitizeElement(childElements[childIndex]);
                }
            }
        });
        /**
         * Go through remaining elements and remove
         * non-allowed attribs
         */
        // IE does not support .children on document fragments, only .childNodes
        const dfChildren = getElementChildren(documentFragment);
        /* eslint-disable-next-line */
        for (let childIndex = 0; childIndex < dfChildren.length; childIndex++) {
            sanitizeElement(dfChildren[childIndex]);
        }
        // Append document fragment to div
        const fragmentDiv = document.createElement('div');
        fragmentDiv.appendChild(documentFragment);
        // First child is always the div we did our work in
        const getInnerDiv = fragmentDiv.querySelector('div');
        return getInnerDiv !== null ? getInnerDiv.innerHTML : fragmentDiv.innerHTML;
    }
    catch (err) {
        printIonError('sanitizeDOMString', err);
        return '';
    }
};
/**
 * Clean up current element based on allowed attributes
 * and then recursively dig down into any child elements to
 * clean those up as well
 */
// TODO(FW-2832): type (using Element triggers other type errors as well)
const sanitizeElement = (element) => {
    // IE uses childNodes, so ignore nodes that are not elements
    if (element.nodeType && element.nodeType !== 1) {
        return;
    }
    /**
     * If attributes is not a NamedNodeMap
     * then we should remove the element entirely.
     * This helps avoid DOM Clobbering attacks where
     * attributes is overridden.
     */
    if (typeof NamedNodeMap !== 'undefined' && !(element.attributes instanceof NamedNodeMap)) {
        element.remove();
        return;
    }
    for (let i = element.attributes.length - 1; i >= 0; i--) {
        const attribute = element.attributes.item(i);
        const attributeName = attribute.name;
        // remove non-allowed attribs
        if (!allowedAttributes.includes(attributeName.toLowerCase())) {
            element.removeAttribute(attributeName);
            continue;
        }
        // clean up any allowed attribs
        // that attempt to do any JS funny-business
        const attributeValue = attribute.value;
        /**
         * We also need to check the property value
         * as javascript: can allow special characters
         * such as &Tab; and still be valid (i.e. java&Tab;script)
         */
        const propertyValue = element[attributeName];
        /* eslint-disable */
        if ((attributeValue != null && attributeValue.toLowerCase().includes('javascript:')) ||
            (propertyValue != null && propertyValue.toLowerCase().includes('javascript:'))) {
            element.removeAttribute(attributeName);
        }
        /* eslint-enable */
    }
    /**
     * Sanitize any nested children
     */
    const childElements = getElementChildren(element);
    /* eslint-disable-next-line */
    for (let i = 0; i < childElements.length; i++) {
        sanitizeElement(childElements[i]);
    }
};
/**
 * IE doesn't always support .children
 * so we revert to .childNodes instead
 */
// TODO(FW-2832): type
const getElementChildren = (el) => {
    return el.children != null ? el.children : el.childNodes;
};
const isSanitizerEnabled = () => {
    var _a;
    const win = window;
    const config = (_a = win === null || win === void 0 ? void 0 : win.Ionic) === null || _a === void 0 ? void 0 : _a.config;
    if (config) {
        if (config.get) {
            return config.get('sanitizerEnabled', true);
        }
        else {
            return config.sanitizerEnabled === true || config.sanitizerEnabled === undefined;
        }
    }
    return true;
};
const allowedAttributes = ['class', 'id', 'href', 'src', 'name', 'slot'];
const blockedTags = ['script', 'style', 'iframe', 'meta', 'link', 'object', 'embed'];
class IonicSafeString {
    constructor(value) {
        this.value = value;
    }
}

const setupConfig = (config) => {
    const win = window;
    const Ionic = win.Ionic;
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (Ionic && Ionic.config && Ionic.config.constructor.name !== 'Object') {
        return;
    }
    win.Ionic = win.Ionic || {};
    win.Ionic.config = Object.assign(Object.assign({}, win.Ionic.config), config);
    return win.Ionic.config;
};
const getMode = () => {
    var _a;
    const win = window;
    const config = (_a = win === null || win === void 0 ? void 0 : win.Ionic) === null || _a === void 0 ? void 0 : _a.config;
    if (config) {
        if (config.mode) {
            return config.mode;
        }
        else {
            return config.get('mode');
        }
    }
    return 'md';
};
const ENABLE_HTML_CONTENT_DEFAULT = false;

export { ENABLE_HTML_CONTENT_DEFAULT as E, IonicSafeString as I, sanitizeDOMString as a, getMode as g, setupConfig as s };
