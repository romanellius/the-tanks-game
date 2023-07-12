///STATIC Routes///

module.exports = () => {
  const routes = new Map();

  const doRouteExist = (pattern) => routes.has(pattern);
  const getRoute = (path) => routes.get(path);
  const addRoute = (pattern, handler) => {
    routes.set(pattern, { handler, isEnabled: true });
  };
  const removeRoute = (pattern) => {
    routes.delete(pattern);
  };
  const removeAllRoutes = () => routes.clear();

  return {
    doStaticRouteExist: doRouteExist,
    getStaticRoute: getRoute,
    addStaticRoute: addRoute,
    removeStaticRoute: removeRoute,
    removeAllStaticRoutes: removeAllRoutes,
  };
};
