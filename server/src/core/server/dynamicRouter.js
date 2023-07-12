///DYNAMIC Routes///

module.exports = () => {
  const routes = [];

  //private functions
  const getRouteIndex = (pattern) =>
    routes.findIndex((route) => route.pattern.source === pattern.source);

  //public functions
  const doRouteExist = (pattern) =>
    routes.some((route) => route.pattern.source === pattern.source);
  const getRoute = (pattern) =>
    routes.find((route) => route.pattern.source === pattern.source);
  const getRouteByPath = (path) =>
    routes.find((route) => route.pattern.test(path));
  const addRoute = (pattern, handler) => {
    routes.push({ pattern, handler, isEnabled: true });
  };
  const removeRoute = (pattern) => {
    const routeIndex = getRouteIndex(pattern);
    routeIndex !== -1 && routes.splice(routeIndex, 1);
  };
  const removeAllRoutes = () => {
    routes.length = 0;
  };

  return {
    doDynamicRouteExist: doRouteExist,
    getDynamicRoute: getRoute,
    getDynamicRouteByPath: getRouteByPath,
    addDynamicRoute: addRoute,
    removeDynamicRoute: removeRoute,
    removeAllDynamicRoutes: removeAllRoutes,
  };
};
