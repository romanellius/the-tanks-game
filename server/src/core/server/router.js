///Message ROUTING///

//TODO: replace with resolve()
const { isRegExp: isRoutePatternDynamic } = require("../../utils/regexpHelper");

// [ ] 1. add middleware logic (for: log, parse, error, rate limit) - it's close to routing but could have next() inside the body to 'pass the control' to the next handler;
// [ ]   1.0. also, multiple callbacks on one pattern
// [ ]   1.1. also, add the "next" method to props and call it to move to the next matching handler
// [ ]   1.2. also, middleware should share the same queue with routes;
// [ ] 2. add "error handling" using routing mechanism (call bindRoute(*) after all other bindings in each state) ?

module.exports = (staticRouter, dynamicRouter, rootPattern) => {
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
  const formatRoutePath = (path) =>
    typeof path === "string" && !path.startsWith("/") ? `/${path}` : path;

  const getSubPathIndex = (path) => {
    let matchLength = 0;
    if (isRoutePatternDynamic(rootPattern)) {
      const matches = rootPattern.exec(path);
      if (matches) {
        matchLength = matches[0].length;
      }
    } else {
      if (path.startsWith(rootPattern)) {
        matchLength = rootPattern.length;
      }
    }
    return matchLength;
  };

  const tryInvokeRoute = (route, data, remote) => {
    const canInvokeRoute = route?.isEnabled && route.handler;
    canInvokeRoute && route.handler(data, remote);
    return !!canInvokeRoute;
  };

  const tryInvokeSubRoute = (path, data, remote) => {
    const staticRoute = getStaticRoute(path);
    if (staticRoute) return tryInvokeRoute(staticRoute, data, remote);

    //if path does not match any "static" pattern, try "dynamic" patterns
    const dynamicRoute = getDynamicRouteByPath(path);
    return tryInvokeRoute(dynamicRoute, data, remote);
  };

  const tryToggleRoute = (pattern, doEnable) => {
    const route = isRoutePatternDynamic(pattern)
      ? getDynamicRoute(pattern)
      : getStaticRoute(pattern);

    route && (route.isEnabled = doEnable);
    return !!route;
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

  const tryInvoke = (data, remote) => {
    if (!data?.action) return false;

    data.action = formatRoutePath(data.action);
    const pathStartingIndex = getSubPathIndex(data.action);

    return (
      pathStartingIndex > 0 &&
      tryInvokeSubRoute(
        formatRoutePath(data.action.slice(pathStartingIndex)),
        data,
        remote
      )
    );
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
