///Framework: ABSTRACT BUILDER and EXTENSIONS Support///

module.exports = (server, extensions, makeChainable) => {
  const { onRunExtensions, onRun, run, bindEndpoint, bindRouter } = server;
  const { getConfigHandlers, getRunHandlers } = extensions;

  const runHandlers = getRunHandlers();
  onRunExtensions(runHandlers);

  const props = getConfigHandlers();

  return {
    run,
    bindRouter,
    ...makeChainable({ onRun, bindEndpoint }),

    ...props,
  };
};
