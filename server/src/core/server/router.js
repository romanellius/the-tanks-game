///Message ROUTING///

//TODO: replace with resolve()
const { isRegExp: isRoutePatternDynamic } = require("../../utils/regexpHelper");

// [ ]  add "error handling" using routing mechanism (call bindRoute(*) after all other bindings in each state)?
//      [https://expressjs.com/en/guide/error-handling.html]

module.exports = (rootPattern) => {
  //init
  const routes = [];

  //private functions
  const formatPath = (path) =>
    typeof path === "string" && !path.startsWith("/") ? `/${path}` : path;

  const getSubPathIndex = (path, rootPattern) => {
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

  const getRelativePath = (absPath, rootPattern) => {
    if (!absPath) return null;

    const normalizedAbsPath = formatPath(absPath);
    const subPathIndex = getSubPathIndex(normalizedAbsPath, rootPattern);
    if (subPathIndex === 0) return null;

    let relPath = normalizedAbsPath.slice(subPathIndex);
    return formatPath(relPath);
  };

  function* generatorGetRouteHandlers(routes, path) {
    for (const route of routes) {
      if (
        isRoutePatternDynamic(route.pattern)
          ? route.pattern.test(path)
          : route.pattern === path
      ) {
        yield route.handler;
      }
    }
  }

  //public functions
  const bind = (pattern = "/", handler) => {
    if (typeof handler !== "function") {
      throw `Error: Route "${pattern}" can not be bound: handler is not a function`;
    }

    routes.push({ pattern, handler });
  };

  const unbindAll = () => {
    routes.length = 0;
  };

  const resolveHandlers = (path) => {
    const relPath = getRelativePath(path, rootPattern);
    if (!relPath) return generatorGetRouteHandlers([]);

    return generatorGetRouteHandlers(routes, relPath);
  };

  return {
    bind,
    unbindAll,
    resolveHandlers,
  };
};
