/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */
import { proxyCustomElement, HTMLElement, createEvent } from '@stencil/core/internal/client';
import { c as componentOnReady, p as debounce } from './helpers.js';
import { a as printIonError, p as printIonWarning } from './index4.js';

const ROUTER_INTENT_NONE = 'root';
const ROUTER_INTENT_FORWARD = 'forward';
const ROUTER_INTENT_BACK = 'back';

/** Join the non empty segments with "/". */
const generatePath = (segments) => {
    const path = segments.filter((s) => s.length > 0).join('/');
    return '/' + path;
};
const generateUrl = (segments, useHash, queryString) => {
    let url = generatePath(segments);
    if (useHash) {
        url = '#' + url;
    }
    if (queryString !== undefined) {
        url += '?' + queryString;
    }
    return url;
};
const writeSegments = (history, root, useHash, segments, direction, state, queryString) => {
    const url = generateUrl([...parsePath(root).segments, ...segments], useHash, queryString);
    if (direction === ROUTER_INTENT_FORWARD) {
        history.pushState(state, '', url);
    }
    else {
        history.replaceState(state, '', url);
    }
};
/**
 * Transforms a chain to a list of segments.
 *
 * Notes:
 * - parameter segments of the form :param are replaced with their value,
 * - null is returned when a value is missing for any parameter segment.
 */
const chainToSegments = (chain) => {
    const segments = [];
    for (const route of chain) {
        for (const segment of route.segments) {
            if (segment[0] === ':') {
                // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
                const param = route.params && route.params[segment.slice(1)];
                if (!param) {
                    return null;
                }
                segments.push(param);
            }
            else if (segment !== '') {
                segments.push(segment);
            }
        }
    }
    return segments;
};
/**
 * Removes the prefix segments from the path segments.
 *
 * Return:
 * - null when the path segments do not start with the passed prefix,
 * - the path segments after the prefix otherwise.
 */
const removePrefix = (prefix, segments) => {
    if (prefix.length > segments.length) {
        return null;
    }
    if (prefix.length <= 1 && prefix[0] === '') {
        return segments;
    }
    for (let i = 0; i < prefix.length; i++) {
        if (prefix[i] !== segments[i]) {
            return null;
        }
    }
    if (segments.length === prefix.length) {
        return [''];
    }
    return segments.slice(prefix.length);
};
const readSegments = (loc, root, useHash) => {
    const prefix = parsePath(root).segments;
    const pathname = useHash ? loc.hash.slice(1) : loc.pathname;
    const segments = parsePath(pathname).segments;
    return removePrefix(prefix, segments);
};
/**
 * Parses the path to:
 * - segments an array of '/' separated parts,
 * - queryString (undefined when no query string).
 */
const parsePath = (path) => {
    let segments = [''];
    let queryString;
    if (path != null) {
        const qsStart = path.indexOf('?');
        if (qsStart > -1) {
            queryString = path.substring(qsStart + 1);
            path = path.substring(0, qsStart);
        }
        segments = path
            .split('/')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        if (segments.length === 0) {
            segments = [''];
        }
    }
    return { segments, queryString };
};

const printRoutes = (routes) => {
    console.group(`[ion-core] ROUTES[${routes.length}]`);
    for (const chain of routes) {
        const segments = [];
        chain.forEach((r) => segments.push(...r.segments));
        const ids = chain.map((r) => r.id);
        console.debug(`%c ${generatePath(segments)}`, 'font-weight: bold; padding-left: 20px', '=>\t', `(${ids.join(', ')})`);
    }
    console.groupEnd();
};
const printRedirects = (redirects) => {
    console.group(`[ion-core] REDIRECTS[${redirects.length}]`);
    for (const redirect of redirects) {
        if (redirect.to) {
            console.debug('FROM: ', `$c ${generatePath(redirect.from)}`, 'font-weight: bold', ' TO: ', `$c ${generatePath(redirect.to.segments)}`, 'font-weight: bold');
        }
    }
    console.groupEnd();
};

/**
 * Activates the passed route chain.
 *
 * There must be exactly one outlet per route entry in the chain.
 *
 * The methods calls setRouteId on each of the outlet with the corresponding route entry in the chain.
 * setRouteId will create or select the view in the outlet.
 */
const writeNavState = async (root, chain, direction, index, changed = false, animation) => {
    try {
        // find next navigation outlet in the DOM
        const outlet = searchNavNode(root);
        // make sure we can continue interacting the DOM, otherwise abort
        if (index >= chain.length || !outlet) {
            return changed;
        }
        await new Promise((resolve) => componentOnReady(outlet, resolve));
        const route = chain[index];
        const result = await outlet.setRouteId(route.id, route.params, direction, animation);
        // if the outlet changed the page, reset navigation to neutral (no direction)
        // this means nested outlets will not animate
        if (result.changed) {
            direction = ROUTER_INTENT_NONE;
            changed = true;
        }
        // recursively set nested outlets
        changed = await writeNavState(result.element, chain, direction, index + 1, changed, animation);
        // once all nested outlets are visible let's make the parent visible too,
        // using markVisible prevents flickering
        if (result.markVisible) {
            await result.markVisible();
        }
        return changed;
    }
    catch (e) {
        printIonError('[ion-router] - Exception in writeNavState:', e);
        return false;
    }
};
/**
 * Recursively walks the outlet in the DOM.
 *
 * The function returns a list of RouteID corresponding to each of the outlet and the last outlet without a RouteID.
 */
const readNavState = async (root) => {
    const ids = [];
    let outlet;
    let node = root;
    // eslint-disable-next-line no-cond-assign
    while ((outlet = searchNavNode(node))) {
        const id = await outlet.getRouteId();
        if (id) {
            node = id.element;
            id.element = undefined;
            ids.push(id);
        }
        else {
            break;
        }
    }
    return { ids, outlet };
};
const waitUntilNavNode = () => {
    if (searchNavNode(document.body)) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        window.addEventListener('ionNavWillLoad', () => resolve(), { once: true });
    });
};
/** Selector for all the outlets supported by the router. */
const OUTLET_SELECTOR = ':not([no-router]) ion-nav, :not([no-router]) ion-tabs, :not([no-router]) ion-router-outlet';
const searchNavNode = (root) => {
    if (!root) {
        return undefined;
    }
    if (root.matches(OUTLET_SELECTOR)) {
        return root;
    }
    const outlet = root.querySelector(OUTLET_SELECTOR);
    return outlet !== null && outlet !== void 0 ? outlet : undefined;
};

/**
 * Returns whether the given redirect matches the given path segments.
 *
 * A redirect matches when the segments of the path and redirect.from are equal.
 * Note that segments are only checked until redirect.from contains a '*' which matches any path segment.
 * The path ['some', 'path', 'to', 'page'] matches both ['some', 'path', 'to', 'page'] and ['some', 'path', '*'].
 */
const matchesRedirect = (segments, redirect) => {
    const { from, to } = redirect;
    if (to === undefined) {
        return false;
    }
    if (from.length > segments.length) {
        return false;
    }
    for (let i = 0; i < from.length; i++) {
        const expected = from[i];
        if (expected === '*') {
            return true;
        }
        if (expected !== segments[i]) {
            return false;
        }
    }
    return from.length === segments.length;
};
/** Returns the first redirect matching the path segments or undefined when no match found. */
const findRouteRedirect = (segments, redirects) => {
    return redirects.find((redirect) => matchesRedirect(segments, redirect));
};
const matchesIDs = (ids, chain) => {
    const len = Math.min(ids.length, chain.length);
    let score = 0;
    for (let i = 0; i < len; i++) {
        const routeId = ids[i];
        const routeChain = chain[i];
        // Skip results where the route id does not match the chain at the same index
        if (routeId.id.toLowerCase() !== routeChain.id) {
            break;
        }
        if (routeId.params) {
            const routeIdParams = Object.keys(routeId.params);
            // Only compare routes with the chain that have the same number of parameters.
            if (routeIdParams.length === routeChain.segments.length) {
                // Maps the route's params into a path based on the path variable names,
                // to compare against the route chain format.
                //
                // Before:
                // ```ts
                // {
                //  params: {
                //    s1: 'a',
                //    s2: 'b'
                //  }
                // }
                // ```
                //
                // After:
                // ```ts
                // [':s1',':s2']
                // ```
                //
                const pathWithParams = routeIdParams.map((key) => `:${key}`);
                for (let j = 0; j < pathWithParams.length; j++) {
                    // Skip results where the path variable is not a match
                    if (pathWithParams[j].toLowerCase() !== routeChain.segments[j]) {
                        break;
                    }
                    // Weight path matches for the same index higher.
                    score++;
                }
            }
        }
        // Weight id matches
        score++;
    }
    return score;
};
/**
 * Matches the segments against the chain.
 *
 * Returns:
 * - null when there is no match,
 * - a chain with the params properties updated with the parameter segments on match.
 */
const matchesSegments = (segments, chain) => {
    const inputSegments = new RouterSegments(segments);
    let matchesDefault = false;
    let allparams;
    for (let i = 0; i < chain.length; i++) {
        const chainSegments = chain[i].segments;
        if (chainSegments[0] === '') {
            matchesDefault = true;
        }
        else {
            for (const segment of chainSegments) {
                const data = inputSegments.next();
                // data param
                if (segment[0] === ':') {
                    if (data === '') {
                        return null;
                    }
                    allparams = allparams || [];
                    const params = allparams[i] || (allparams[i] = {});
                    params[segment.slice(1)] = data;
                }
                else if (data !== segment) {
                    return null;
                }
            }
            matchesDefault = false;
        }
    }
    const matches = matchesDefault ? matchesDefault === (inputSegments.next() === '') : true;
    if (!matches) {
        return null;
    }
    if (allparams) {
        return chain.map((route, i) => ({
            id: route.id,
            segments: route.segments,
            params: mergeParams(route.params, allparams[i]),
            beforeEnter: route.beforeEnter,
            beforeLeave: route.beforeLeave,
        }));
    }
    return chain;
};
/**
 * Merges the route parameter objects.
 * Returns undefined when both parameters are undefined.
 */
const mergeParams = (a, b) => {
    return a || b ? Object.assign(Object.assign({}, a), b) : undefined;
};
/**
 * Finds the best match for the ids in the chains.
 *
 * Returns the best match or null when no match is found.
 * When a chain is returned the parameters are updated from the RouteIDs.
 * That is they contain both the componentProps of the <ion-route> and the parameter segment.
 */
const findChainForIDs = (ids, chains) => {
    let match = null;
    let maxMatches = 0;
    for (const chain of chains) {
        const score = matchesIDs(ids, chain);
        if (score > maxMatches) {
            match = chain;
            maxMatches = score;
        }
    }
    if (match) {
        return match.map((route, i) => {
            var _a;
            return ({
                id: route.id,
                segments: route.segments,
                params: mergeParams(route.params, (_a = ids[i]) === null || _a === void 0 ? void 0 : _a.params),
            });
        });
    }
    return null;
};
/**
 * Finds the best match for the segments in the chains.
 *
 * Returns the best match or null when no match is found.
 * When a chain is returned the parameters are updated from the segments.
 * That is they contain both the componentProps of the <ion-route> and the parameter segments.
 */
const findChainForSegments = (segments, chains) => {
    let match = null;
    let bestScore = 0;
    for (const chain of chains) {
        const matchedChain = matchesSegments(segments, chain);
        if (matchedChain !== null) {
            const score = computePriority(matchedChain);
            if (score > bestScore) {
                bestScore = score;
                match = matchedChain;
            }
        }
    }
    return match;
};
/**
 * Computes the priority of a chain.
 *
 * Parameter segments are given a lower priority over fixed segments.
 *
 * Considering the following 2 chains matching the path /path/to/page:
 * - /path/to/:where
 * - /path/to/page
 *
 * The second one will be given a higher priority because "page" is a fixed segment (vs ":where", a parameter segment).
 */
const computePriority = (chain) => {
    let score = 1;
    let level = 1;
    for (const route of chain) {
        for (const segment of route.segments) {
            if (segment[0] === ':') {
                score += Math.pow(1, level);
            }
            else if (segment !== '') {
                score += Math.pow(2, level);
            }
            level++;
        }
    }
    return score;
};
class RouterSegments {
    constructor(segments) {
        this.segments = segments.slice();
    }
    next() {
        if (this.segments.length > 0) {
            return this.segments.shift();
        }
        return '';
    }
}

const readProp = (el, prop) => {
    if (prop in el) {
        return el[prop];
    }
    if (el.hasAttribute(prop)) {
        return el.getAttribute(prop);
    }
    return null;
};
/**
 * Extracts the redirects (that is <ion-route-redirect> elements inside the root).
 *
 * The redirects are returned as a list of RouteRedirect.
 */
const readRedirects = (root) => {
    return Array.from(root.children)
        .filter((el) => el.tagName === 'ION-ROUTE-REDIRECT')
        .map((el) => {
        const to = readProp(el, 'to');
        return {
            from: parsePath(readProp(el, 'from')).segments,
            to: to == null ? undefined : parsePath(to),
        };
    });
};
/**
 * Extracts all the routes (that is <ion-route> elements inside the root).
 *
 * The routes are returned as a list of chains - the flattened tree.
 */
const readRoutes = (root) => {
    return flattenRouterTree(readRouteNodes(root));
};
/**
 * Reads the route nodes as a tree modeled after the DOM tree of <ion-route> elements.
 *
 * Note: routes without a component are ignored together with their children.
 */
const readRouteNodes = (node) => {
    return Array.from(node.children)
        .filter((el) => el.tagName === 'ION-ROUTE' && el.component)
        .map((el) => {
        const component = readProp(el, 'component');
        return {
            segments: parsePath(readProp(el, 'url')).segments,
            id: component.toLowerCase(),
            params: el.componentProps,
            beforeLeave: el.beforeLeave,
            beforeEnter: el.beforeEnter,
            children: readRouteNodes(el),
        };
    });
};
/**
 * Flattens a RouterTree in a list of chains.
 *
 * Each chain represents a path from the root node to a terminal node.
 */
const flattenRouterTree = (nodes) => {
    const chains = [];
    for (const node of nodes) {
        flattenNode([], chains, node);
    }
    return chains;
};
/** Flattens a route node recursively and push each branch to the chains list. */
const flattenNode = (chain, chains, node) => {
    chain = [
        ...chain,
        {
            id: node.id,
            segments: node.segments,
            params: node.params,
            beforeLeave: node.beforeLeave,
            beforeEnter: node.beforeEnter,
        },
    ];
    if (node.children.length === 0) {
        chains.push(chain);
        return;
    }
    for (const child of node.children) {
        flattenNode(chain, chains, child);
    }
};

const Router = /*@__PURE__*/ proxyCustomElement(class Router extends HTMLElement {
    constructor() {
        super();
        this.__registerHost();
        this.ionRouteWillChange = createEvent(this, "ionRouteWillChange", 7);
        this.ionRouteDidChange = createEvent(this, "ionRouteDidChange", 7);
        this.previousPath = null;
        this.busy = false;
        this.state = 0;
        this.lastState = 0;
        /**
         * The root path to use when matching URLs. By default, this is set to "/", but you can specify
         * an alternate prefix for all URL paths.
         */
        this.root = '/';
        /**
         * The router can work in two "modes":
         * - With hash: `/index.html#/path/to/page`
         * - Without hash: `/path/to/page`
         *
         * Using one or another might depend in the requirements of your app and/or where it's deployed.
         *
         * Usually "hash-less" navigation works better for SEO and it's more user friendly too, but it might
         * requires additional server-side configuration in order to properly work.
         *
         * On the other side hash-navigation is much easier to deploy, it even works over the file protocol.
         *
         * By default, this property is `true`, change to `false` to allow hash-less URLs.
         */
        this.useHash = true;
    }
    async componentWillLoad() {
        await waitUntilNavNode();
        const canProceed = await this.runGuards(this.getSegments());
        if (canProceed !== true) {
            if (typeof canProceed === 'object') {
                const { redirect } = canProceed;
                const path = parsePath(redirect);
                this.setSegments(path.segments, ROUTER_INTENT_NONE, path.queryString);
                await this.writeNavStateRoot(path.segments, ROUTER_INTENT_NONE);
            }
        }
        else {
            await this.onRoutesChanged();
        }
    }
    componentDidLoad() {
        window.addEventListener('ionRouteRedirectChanged', debounce(this.onRedirectChanged.bind(this), 10));
        window.addEventListener('ionRouteDataChanged', debounce(this.onRoutesChanged.bind(this), 100));
    }
    async onPopState() {
        const direction = this.historyDirection();
        let segments = this.getSegments();
        const canProceed = await this.runGuards(segments);
        if (canProceed !== true) {
            if (typeof canProceed === 'object') {
                segments = parsePath(canProceed.redirect).segments;
            }
            else {
                return false;
            }
        }
        return this.writeNavStateRoot(segments, direction);
    }
    onBackButton(ev) {
        ev.detail.register(0, (processNextHandler) => {
            this.back();
            processNextHandler();
        });
    }
    /** @internal */
    async canTransition() {
        const canProceed = await this.runGuards();
        if (canProceed !== true) {
            if (typeof canProceed === 'object') {
                return canProceed.redirect;
            }
            else {
                return false;
            }
        }
        return true;
    }
    /**
     * Navigate to the specified path.
     *
     * @param path The path to navigate to.
     * @param direction The direction of the animation. Defaults to `"forward"`.
     */
    async push(path, direction = 'forward', animation) {
        var _a;
        if (path.startsWith('.')) {
            const currentPath = (_a = this.previousPath) !== null && _a !== void 0 ? _a : '/';
            // Convert currentPath to an URL by pre-pending a protocol and a host to resolve the relative path.
            const url = new URL(path, `https://host/${currentPath}`);
            path = url.pathname + url.search;
        }
        let parsedPath = parsePath(path);
        const canProceed = await this.runGuards(parsedPath.segments);
        if (canProceed !== true) {
            if (typeof canProceed === 'object') {
                parsedPath = parsePath(canProceed.redirect);
            }
            else {
                return false;
            }
        }
        this.setSegments(parsedPath.segments, direction, parsedPath.queryString);
        return this.writeNavStateRoot(parsedPath.segments, direction, animation);
    }
    /** Go back to previous page in the window.history. */
    back() {
        window.history.back();
        return Promise.resolve(this.waitPromise);
    }
    /** @internal */
    async printDebug() {
        printRoutes(readRoutes(this.el));
        printRedirects(readRedirects(this.el));
    }
    /** @internal */
    async navChanged(direction) {
        if (this.busy) {
            printIonWarning('[ion-router] - Router is busy, navChanged was cancelled.');
            return false;
        }
        const { ids, outlet } = await readNavState(window.document.body);
        const routes = readRoutes(this.el);
        const chain = findChainForIDs(ids, routes);
        if (!chain) {
            printIonWarning('[ion-router] - No matching URL for', ids.map((i) => i.id));
            return false;
        }
        const segments = chainToSegments(chain);
        if (!segments) {
            printIonWarning('[ion-router] - Router could not match path because some required param is missing.');
            return false;
        }
        this.setSegments(segments, direction);
        await this.safeWriteNavState(outlet, chain, ROUTER_INTENT_NONE, segments, null, ids.length);
        return true;
    }
    /** This handler gets called when a `ion-route-redirect` component is added to the DOM or if the from or to property of such node changes. */
    onRedirectChanged() {
        const segments = this.getSegments();
        if (segments && findRouteRedirect(segments, readRedirects(this.el))) {
            this.writeNavStateRoot(segments, ROUTER_INTENT_NONE);
        }
    }
    /** This handler gets called when a `ion-route` component is added to the DOM or if the from or to property of such node changes. */
    onRoutesChanged() {
        return this.writeNavStateRoot(this.getSegments(), ROUTER_INTENT_NONE);
    }
    historyDirection() {
        var _a;
        const win = window;
        if (win.history.state === null) {
            this.state++;
            win.history.replaceState(this.state, win.document.title, (_a = win.document.location) === null || _a === void 0 ? void 0 : _a.href);
        }
        const state = win.history.state;
        const lastState = this.lastState;
        this.lastState = state;
        if (state > lastState || (state >= lastState && lastState > 0)) {
            return ROUTER_INTENT_FORWARD;
        }
        if (state < lastState) {
            return ROUTER_INTENT_BACK;
        }
        return ROUTER_INTENT_NONE;
    }
    async writeNavStateRoot(segments, direction, animation) {
        if (!segments) {
            printIonError('[ion-router] - URL is not part of the routing set.');
            return false;
        }
        // lookup redirect rule
        const redirects = readRedirects(this.el);
        const redirect = findRouteRedirect(segments, redirects);
        let redirectFrom = null;
        if (redirect) {
            const { segments: toSegments, queryString } = redirect.to;
            this.setSegments(toSegments, direction, queryString);
            redirectFrom = redirect.from;
            segments = toSegments;
        }
        // lookup route chain
        const routes = readRoutes(this.el);
        const chain = findChainForSegments(segments, routes);
        if (!chain) {
            printIonError('[ion-router] - The path does not match any route.');
            return false;
        }
        // write DOM give
        return this.safeWriteNavState(document.body, chain, direction, segments, redirectFrom, 0, animation);
    }
    async safeWriteNavState(node, chain, direction, segments, redirectFrom, index = 0, animation) {
        const unlock = await this.lock();
        let changed = false;
        try {
            changed = await this.writeNavState(node, chain, direction, segments, redirectFrom, index, animation);
        }
        catch (e) {
            printIonError('[ion-router] - Exception in safeWriteNavState:', e);
        }
        unlock();
        return changed;
    }
    async lock() {
        const p = this.waitPromise;
        let resolve;
        this.waitPromise = new Promise((r) => (resolve = r));
        if (p !== undefined) {
            await p;
        }
        return resolve;
    }
    /**
     * Executes the beforeLeave hook of the source route and the beforeEnter hook of the target route if they exist.
     *
     * When the beforeLeave hook does not return true (to allow navigating) then that value is returned early and the beforeEnter is executed.
     * Otherwise the beforeEnterHook hook of the target route is executed.
     */
    async runGuards(to = this.getSegments(), from) {
        if (from === undefined) {
            from = parsePath(this.previousPath).segments;
        }
        if (!to || !from) {
            return true;
        }
        const routes = readRoutes(this.el);
        const fromChain = findChainForSegments(from, routes);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        const beforeLeaveHook = fromChain && fromChain[fromChain.length - 1].beforeLeave;
        const canLeave = beforeLeaveHook ? await beforeLeaveHook() : true;
        if (canLeave === false || typeof canLeave === 'object') {
            return canLeave;
        }
        const toChain = findChainForSegments(to, routes);
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
        const beforeEnterHook = toChain && toChain[toChain.length - 1].beforeEnter;
        return beforeEnterHook ? beforeEnterHook() : true;
    }
    async writeNavState(node, chain, direction, segments, redirectFrom, index = 0, animation) {
        if (this.busy) {
            printIonWarning('[ion-router] - Router is busy, transition was cancelled.');
            return false;
        }
        this.busy = true;
        // generate route event and emit will change
        const routeEvent = this.routeChangeEvent(segments, redirectFrom);
        if (routeEvent) {
            this.ionRouteWillChange.emit(routeEvent);
        }
        const changed = await writeNavState(node, chain, direction, index, false, animation);
        this.busy = false;
        // emit did change
        if (routeEvent) {
            this.ionRouteDidChange.emit(routeEvent);
        }
        return changed;
    }
    setSegments(segments, direction, queryString) {
        this.state++;
        writeSegments(window.history, this.root, this.useHash, segments, direction, this.state, queryString);
    }
    getSegments() {
        return readSegments(window.location, this.root, this.useHash);
    }
    routeChangeEvent(toSegments, redirectFromSegments) {
        const from = this.previousPath;
        const to = generatePath(toSegments);
        this.previousPath = to;
        if (to === from) {
            return null;
        }
        const redirectedFrom = redirectFromSegments ? generatePath(redirectFromSegments) : null;
        return {
            from,
            redirectedFrom,
            to,
        };
    }
    get el() { return this; }
}, [0, "ion-router", {
        "root": [1],
        "useHash": [4, "use-hash"],
        "canTransition": [64],
        "push": [64],
        "back": [64],
        "printDebug": [64],
        "navChanged": [64]
    }, [[8, "popstate", "onPopState"], [4, "ionBackButton", "onBackButton"]]]);
function defineCustomElement$1() {
    if (typeof customElements === "undefined") {
        return;
    }
    const components = ["ion-router"];
    components.forEach(tagName => { switch (tagName) {
        case "ion-router":
            if (!customElements.get(tagName)) {
                customElements.define(tagName, Router);
            }
            break;
    } });
}

const IonRouter = Router;
const defineCustomElement = defineCustomElement$1;

export { IonRouter, defineCustomElement };
