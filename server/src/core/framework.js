///Framework: ABSTRACTION and EXTENSIONS Support///

module.exports = (server, extensions) => {
  const { onRun, run } = server;
  const { getConfigHandlers, getRuntimeHandlers, getRunHandlers } = extensions;

  const serverProps = getRuntimeHandlers();
  const runHandlers = getRunHandlers();
  const props = getConfigHandlers();

  for (const propName in serverProps) {
    server[propName] = serverProps[propName];
  }

  runHandlers.forEach((runHandler) => {
    onRun(runHandler);
  });

  return {
    onRun: function (callback, isCritical) {
      onRun(callback, isCritical);
      return this;
    },
    run,
    ...props,
  };
};
