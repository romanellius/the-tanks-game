///EXTENSIONS Binding///

const { getAllFiles } = require("../libs/fileHelper");

module.exports = () => {
  const allConfigHandlers = {};
  const runHandlers = [];

  for (const file of getAllFiles("src/core/extensions")) {
    const { config: configHandlers, run: runHandler } = require(file.absPath);

    Object.assign(allConfigHandlers, configHandlers);
    runHandlers.push(runHandler);
  }

  return {
    configHandlers: allConfigHandlers,
    runHandlers,
  };
};
