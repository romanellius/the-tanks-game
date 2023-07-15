///EXTENSIONS Binding///

const { getAllFiles } = require("../libs/fileHelper");

const bindExtensions = () => {
  const allConfigHandlers = {};
  const runHandlers = [];

  for (const file of getAllFiles("src/core/extensions")) {
    const { config: configHandlers, run: runHandler } = require(file.absPath);

    Object.assign(allConfigHandlers, configHandlers);
    runHandlers.push(runHandler);
  }

  return {
    getConfigHandlers: () => allConfigHandlers,
    getRunHandlers: () => runHandlers,
  };
};

module.exports = bindExtensions;
