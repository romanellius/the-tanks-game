///EXTENSIONS Binding///

const { getAllFiles } = require("../libs/fileHelper");

const bindExtensions = () => {
  const allConfigHandlers = {};
  const allRuntimeHandlers = {};
  const runHandlers = [];

  for (const file of getAllFiles("src/core/extensions")) {
    const {
      configHandlers,
      runtimeHandlers,
      run: runHandler,
    } = require(file.absPath);

    runHandlers.push(runHandler);

    configHandlers.forEach((handler) => {
      allConfigHandlers[handler.name] = handler.func;
    });

    runtimeHandlers.forEach((handler) => {
      allRuntimeHandlers[handler.name] = handler.func;
    });
  }

  return {
    getConfigHandlers: () => allConfigHandlers,
    getRuntimeHandlers: () => allRuntimeHandlers,
    getRunHandlers: () => runHandlers,
  };
};

module.exports = bindExtensions;
