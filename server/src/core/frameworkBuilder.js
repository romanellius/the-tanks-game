///Framework: ABSTRACT BUILDER and EXTENSIONS Support///

module.exports = (
  server,
  extensions,
  { makeChainable, wrapWithErrorHandler }
) => {
  const {
    onRunExtensions,
    onRun,
    run,
    bindEndpoint,
    bindRouter,
    addErrorHandler,
  } = server;

  const bindRunHandlers = (runHandlers, onRun) => {
    wrapWithErrorHandler(runHandlers, (error) => {
      throw `Run: Extension can not be started: ${error}`;
    });
    onRun(runHandlers);
  };

  const bindConfigHandlers = (target, configHandlers) => {
    wrapWithErrorHandler(configHandlers, (error) => {
      throw `Build: Extension can not be configured: ${error}`;
    });
    makeChainable(configHandlers);

    Object.assign(target, configHandlers);
  };

  return {
    build: (doSupportExtensions = true) => {
      const props = { onRun, bindEndpoint, addErrorHandler };
      makeChainable(props);

      if (doSupportExtensions) {
        const { getRunHandlers, getConfigHandlers } = extensions;

        const runHandlers = getRunHandlers();
        const configHandlers = getConfigHandlers();

        bindRunHandlers(runHandlers, onRunExtensions);
        bindConfigHandlers(props, configHandlers);
      }

      return {
        run,
        bindRouter,

        ...props,
      };
    },
  };
};
