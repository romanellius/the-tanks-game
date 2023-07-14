///EXTENSIONS Binding///

const { getAllFiles } = require("../libs/fileHelper");

const bindExtensions = () => {
  const allConfigHandlers = {};
  const runHandlers = [];

  for (const file of getAllFiles("src/core/extensions")) {
    const { configHandlers, run: runHandler } = require(file.absPath);

    configHandlers.forEach((handler) => {
      allConfigHandlers[handler.name] = handler.func;
    });

    runHandlers.push(runHandler);
  }

  return {
    getConfigHandlers: () => allConfigHandlers,
    getRunHandlers: () => runHandlers,
  };
};

module.exports = bindExtensions;
