///Framework: EXTENSIONS Support and MODULES (Timers)///

module.exports = (
  server,
  timers,
  { makeChainable, wrapWithErrorHandler },
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

  const props = { onRun, bindEndpoint, addErrorHandler, useExtension };
  makeChainable(props);

  const { setTimeout, setInterval, clearTimeout, clearInterval } = timers;
  props.timers = {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
  };

  //private functions
  function useExtension(extensionHandler, refs, ...props) {
    wrapWithErrorHandler([extensionHandler], (error) => {
      throw `Build: Extension can not be initialized: ${error}`;
    });
    const runHandler = extensionHandler(server, timers, refs, ...props);

    wrapWithErrorHandler([runHandler], (error) => {
      throw `Run: Extension can not be started: ${error}`;
    });
    onRunExtensions([runHandler]);
  }

  return {
    bindRouter,
    ...props,

    run: () => run(config),
  };
};
