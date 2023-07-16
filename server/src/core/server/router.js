///Message ROUTING///

//TODO: "Error Handling" for Endpoints and States:
//        next(!undefined and !"router") - skip routes/routers while "error handling" middleware is found
//        default and user-defined error handlers
//        try ... catch each routeHandler calling and call next(error) on exception
//        define error-handlers middleware LAST or separate method for error-handling

module.exports = (isRoutePatternDynamic, rootPattern) => {
  //init
  const routes = [];

  rootPattern = normalizePattern(rootPattern);

  //private functions
  function normalizePattern(pattern, isRootPattern) {
    if (
      !pattern ||
      pattern === "" ||
      (isRoutePatternDynamic(pattern) &&
        (pattern.source === /()/.source || pattern.source === /(?:)/.source))
    ) {
      pattern = isRootPattern ? /^\// : /\//;
    }

    return pattern;
  }

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

  function* genGetRouteHandlers(routes, path) {
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

  const resolveHandlers = (path) => {
    const relPath = getRelativePath(path, rootPattern);
    if (!relPath) return genGetRouteHandlers([]);

    return genGetRouteHandlers(routes, relPath);
  };

  //public functions
  const bind = (pattern, handler) => {
    if (typeof handler !== "function") {
      throw `Error: Route "${pattern}" can not be bound: handler is not a function`;
    }

    pattern = normalizePattern(pattern);
    routes.push({ pattern, handler });
  };
  const unbindAll = () => {
    routes.length = 0;
  };
  const invoke = (data, remote) => {
    const genHandlers = resolveHandlers(data?.action);

    let resolvedCount = 0;
    const invokeNextHandler = (doSkip = false) => {
      const handlerResult = genHandlers.next();

      const doInvokeNextHandler = !doSkip && !handlerResult.done;
      if (doInvokeNextHandler) {
        const handler = handlerResult.value;
        handler(data, remote, invokeNextHandler);

        resolvedCount++;
      }
    };
    invokeNextHandler();

    return resolvedCount > 0;
  };

  return {
    bind,
    unbindAll,
    invoke,
  };
};
