///EXTENSIONS Binding///

const { getFolders, getMatchingFileAbsPath } = require("../libs/fileHelper");

module.exports = (server) => {
  const allConfigHandlers = {};
  const runHandlers = [];

  const extensionFilePattern = /^_[^_\.]*\.js$/;

  for (const { absPath } of getFolders("./src/extensions")) {
    const fileAbsPath = getMatchingFileAbsPath(absPath, extensionFilePattern);
    if (fileAbsPath) {
      const { config: configHandlers, run: runHandler } =
        require(fileAbsPath)(server);

      Object.assign(allConfigHandlers, configHandlers);
      runHandlers.push(runHandler);
    }
  }

  return {
    configHandlers: allConfigHandlers,
    runHandlers,
  };
};
