///Framework: ABSTRACT BUILDER and EXTENSIONS Support///

module.exports = (server, extensions, makeChainable) => {
  const {
    onRunExtensions,
    onRun,
    run,
    bindEndpoint,
    bindRouter,
    addErrorHandler,
  } = server;

  return {
    build: (doSupportExtensions = true) => {
      let props = {};

      if (doSupportExtensions) {
        const { getRunHandlers, getConfigHandlers } = extensions;

        const runHandlers = getRunHandlers();
        onRunExtensions(runHandlers);

        props = getConfigHandlers();
      }

      return {
        run,
        bindRouter,
        ...makeChainable({ onRun, bindEndpoint, addErrorHandler }),

        ...props,
      };
    },
  };
};
