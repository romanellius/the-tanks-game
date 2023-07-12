///Message ROUTING///

// [ ] 1. add middleware logic (for: log, parse, error, rate limit) - it's close to routing but could have next() inside the body to 'pass the control' to the next handler;
// [ ]   1.0. also, multiple callbacks on one pattern
// [ ]   1.1. also, add the "next" method to props and call it to move to the next matching handler
// [ ]   1.2. also, middleware should share the same queue with routes;
// [ ] 2. add "error handling" using routing mechanism (call bindRoute(*) after all other bindings in each state) ?

module.exports = (staticRouter, dynamicRouter, rootPattern) => {
  //TODO: add logic to "bind" and "unbind" functions to get full path before working with "newRouter": "/" + "path" + "route".
  //      "RegEx" + "string" ref: https://masteringjs.io/tutorials/fundamentals/concat-regexp

  //init
  const {
    doStaticRouteExist,
    getStaticRoute,
    addStaticRoute,
    removeStaticRoute,
    removeAllStaticRoutes,
  } = staticRouter;

  const {
    doDynamicRouteExist,
    getDynamicRoute,
    getDynamicRouteByPath,
    addDynamicRoute,
    removeDynamicRoute,
    removeAllDynamicRoutes,
  } = dynamicRouter;

  //private functions
  const isRoutePatternDynamic = (pattern) => pattern instanceof RegExp;

  const tryToggleRoute = (pattern, doEnable) => {
    const route = isRoutePatternDynamic(pattern)
      ? getDynamicRoute(pattern)
      : getStaticRoute(pattern);

    route && (route.isEnabled = doEnable);
    return !!route;
  };

  const tryInvokeRoute = (route, data, remote) => {
    const canInvokeRoute = route?.isEnabled && route.handler;
    canInvokeRoute && route.handler(data, remote);
    return !!canInvokeRoute;
  };

  //public functions
  const tryBind = (pattern, handler) => {
    const [routeExistHandler, routeAddHandler] = isRoutePatternDynamic(pattern)
      ? [doDynamicRouteExist, addDynamicRoute]
      : [doStaticRouteExist, addStaticRoute];

    const doRouteExist = routeExistHandler(pattern);
    !doRouteExist && routeAddHandler(pattern, handler);

    return !doRouteExist;
  };

  const unbind = (pattern) => {
    isRoutePatternDynamic(pattern)
      ? removeDynamicRoute(pattern)
      : removeStaticRoute(pattern);
  };
  const unbindAll = () => {
    removeAllStaticRoutes();
    removeAllDynamicRoutes();
  };
  const tryEnable = (pattern) => tryToggleRoute(true);
  const tryDisable = (pattern) => tryToggleRoute(false);

  const has = (pattern) =>
    doStaticRouteExist(pattern) || doDynamicRouteExist(pattern);
  const hasEnabled = (pattern) =>
    !!getStaticRoute(pattern)?.isEnabled ||
    !!getDynamicRoute(pattern)?.isEnabled;

  const tryInvoke = (path, data, remote) => {
    const staticRoute = getStaticRoute(path);
    if (staticRoute) return tryInvokeRoute(staticRoute, data, remote);

    //if path does not match any "static" pattern, try "dynamic" patterns
    const dynamicRoute = getDynamicRouteByPath(path);
    return tryInvokeRoute(dynamicRoute, data, remote);
  };

  return {
    tryBind,
    unbind,
    unbindAll,

    // tryEnable,
    // tryDisable,

    // has,
    // hasEnabled,

    tryInvoke,
  };
};
