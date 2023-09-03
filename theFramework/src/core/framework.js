///Framework: EXTENSION Support///

module.exports = (
  server,
  useExtensions,
  { makeChainable, wrapWithErrorHandler }
) => {
  //init
  const {
    builder: {
      onRunExtensions,
      onRun,
      run,
      bindEndpoint,
      bindRouter,
      addErrorHandler,
    },
  } = server;

  const props = { onRun, bindEndpoint, addErrorHandler };
  makeChainable(props);

  //private functions
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

  const buildExtensions = () => {
    const { runHandlers, configHandlers } = useExtensions(server);

    bindRunHandlers(runHandlers, onRunExtensions);
    bindConfigHandlers(props, configHandlers);
  };

  return {
    build: (doSupportExtensions = true) => {
      doSupportExtensions && buildExtensions();

      return {
        run,
        bindRouter,

        ...props,
      };
    },
  };
};
