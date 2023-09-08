///Framework: EXTENSION Support///

module.exports = (server, { makeChainable, wrapWithErrorHandler }, config) => {
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

  //private functions
  function useExtension(extensionHandler, refs, ...props) {
    wrapWithErrorHandler([extensionHandler], (error) => {
      throw `Build: Extension can not be initialized: ${error}`;
    });
    const runHandler = extensionHandler(server, refs, ...props);

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
