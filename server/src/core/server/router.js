///Message ROUTING///

//TODO: "Error Handling" for States ==> basic try-catch inside of the StateMachine extension

module.exports = (isRoutePatternDynamic, pattern) => {
  //init
  const routes = [],
    errorHandlers = [];

  pattern = normalizePattern(pattern);

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
    const relPath = getRelativePath(path, pattern);
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

  const reset = () => {
    routes.length = errorHandlers.length = 0;
  };

  const invoke = (data, remote) => {
    let isInvocationChainFinished = true;
    const genHandlers = resolveHandlers(data?.action);

    const invokeNextHandler = (doSkip = false) => {
      const handlerResult = genHandlers.next();

      const doInvokeNextHandler = !doSkip && !handlerResult.done;
      if (doInvokeNextHandler) {
        const handler = handlerResult.value;
        handler(data, remote, invokeNextHandler);
      } else {
        isInvocationChainFinished = false;
      }
    };
    invokeNextHandler();

    return !isInvocationChainFinished;
  };

  const addErrorHandler = (handler) => {
    if (typeof handler !== "function") {
      throw `Error: Error handler "${handler}" can not be set: handler is not a function`;
    }

    errorHandlers.push(handler);
  };

  const handleError = (error, data, remote) => {
    let isInvocationChainFinished = true;
    let errorHandlerIndex = 0;

    const invokeNextErrorHandler = (error) => {
      if (errorHandlerIndex < errorHandlers.length) {
        try {
          errorHandlers[errorHandlerIndex++](
            error,
            data,
            remote,
            invokeNextErrorHandler
          );
        } catch (error) {
          invokeNextErrorHandler(error);
        }
      } else {
        isInvocationChainFinished = false;
      }
    };
    invokeNextErrorHandler(error);

    return !isInvocationChainFinished;
  };

  return {
    bind,
    invoke,

    onError: addErrorHandler,
    error: handleError,

    reset,
  };
};
