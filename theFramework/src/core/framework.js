///Framework: EXTENSION Support///

module.exports = (
  server,
  useExtensions,
  { makeChainable, wrapWithErrorHandler },
  doSupportExtensions,
  config
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

  doSupportExtensions && buildExtensions();

  //private functions
  function bindRunHandlers(runHandlers, onRun) {
    wrapWithErrorHandler(runHandlers, (error) => {
      throw `Run: Extension can not be started: ${error}`;
    });
    onRun(runHandlers);
  }

  function bindConfigHandlers(target, configHandlers) {
    wrapWithErrorHandler(configHandlers, (error) => {
      throw `Build: Extension can not be configured: ${error}`;
    });
    makeChainable(configHandlers);

    Object.assign(target, configHandlers);
  }

  function buildExtensions() {
    const { runHandlers, configHandlers } = useExtensions(server);

    bindRunHandlers(runHandlers, onRunExtensions);
    bindConfigHandlers(props, configHandlers);
  }

  return {
    bindRouter,
    ...props,

    run: () => run(config),
  };
};
