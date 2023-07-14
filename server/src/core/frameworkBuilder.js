///Framework: ABSTRACT BUILDER and EXTENSIONS Support///

module.exports = (server, extensions, makeChainable) => {
  const { onRun, run, bindEndpoint, bindRouter } = server;
  const { getConfigHandlers, getRunHandlers } = extensions;

  const props = getConfigHandlers();
  const runHandlers = getRunHandlers();

  runHandlers.forEach((runHandler) => {
    onRun(runHandler);
  });

  return {
    run,
    bindRouter,
    ...makeChainable({ onRun, bindEndpoint }),

    ...props,
  };
};
