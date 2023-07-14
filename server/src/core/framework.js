///Framework: ABSTRACTION and EXTENSIONS Support///

module.exports = (server, extensions) => {
  const { onRun, run, bindEndpoint, bindRouter } = server;
  const { getConfigHandlers, getRunHandlers } = extensions;

  const props = getConfigHandlers();
  const runHandlers = getRunHandlers();

  runHandlers.forEach((runHandler) => {
    onRun(runHandler);
  });

  return {
    run,
    //TODO: create: "function wrapper (handler,...props) { handler(...props); return this; }" in Helper file
    //      and use it: "wrapper(onRun, callback, isCritical)"
    onRun: function (callback, isCritical) {
      onRun(callback, isCritical);
      return this;
    },

    bindRouter,
    bindEndpoint: function (route, handler) {
      bindEndpoint(route, handler);
      return this;
    },
    ...props,
  };
};
