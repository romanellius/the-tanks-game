///EXTENSIONS Binding///

const { getFolders, getMatchingFileAbsPath } = require("../libs/fileHelper");

module.exports = () => {
  const allConfigHandlers = {};
  const runHandlers = [];

  const extensionFilePattern = /^_[^_\.]*\.js$/;

  for (const { absPath } of getFolders("./src/core/extensions")) {
    const fileAbsPath = getMatchingFileAbsPath(absPath, extensionFilePattern);
    if (fileAbsPath) {
      const { config: configHandlers, run: runHandler } = require(fileAbsPath);

      Object.assign(allConfigHandlers, configHandlers);
      runHandlers.push(runHandler);
    }
  }

  return {
    configHandlers: allConfigHandlers,
    runHandlers,
  };
};
