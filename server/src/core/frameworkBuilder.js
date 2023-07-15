///Framework: ABSTRACT BUILDER and EXTENSIONS Support///

module.exports = (server, extensions, makeChainable) => {
  const { onRun, run, bindEndpoint, bindRouter } = server;
  const { getConfigHandlers, getRunHandlers } = extensions;

  const runHandlers = getRunHandlers();
  onRun(runHandlers);

  const props = getConfigHandlers();

  return {
    run,
    bindRouter,
    ...makeChainable({ onRun, bindEndpoint }),

    ...props,
  };
};
