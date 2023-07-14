module.exports = {
  //function dependencies
  //frameworks
  "core/frameworkInterface": {
    path: "./src/core/frameworkInterface",
    handler: (path, server) => require(path)(server),
    dependencies: ["core/server/server"],
    // isSingleton: true,
  },
  "core/frameworkBuilder": {
    path: "./src/core/frameworkBuilder",
    handler: (path, server, extensions, makeChainable) =>
      require(path)(server, extensions, makeChainable),
    dependencies: [
      "core/server/server",
      "core/useExtensions",
      "helpers/makeFunctionChainable",
    ],
    // isSingleton: true,
  },
  "core/useExtensions": {
    path: "./src/core/useExtensions",
    handler: (path) => require(path)(),
  },

  //servers
  "core/server/server": {
    path: "./src/core/server/server",
    handler: (path, protocol, clients, router, callbacks, config) =>
      require(path)(protocol, clients, router, callbacks, config),
    dependencies: [
      "core/server/protocols/udp",
      "core/server/clients",
      "core/server/router",
      "core/server/initCallbacks",
      "config",
    ],
    isSingleton: true,
  },
  "core/server/clients": {
    path: "./src/core/server/clients",
    handler: (path, flattenAddress) => require(path)(flattenAddress),
    dependencies: ["helpers/flattenAddress"],
  },
  "core/server/initCallbacks": {
    path: "./src/core/server/initCallbacks",
    handler: (path) => require(path)(),
  },
  //router
  "core/server/router": {
    path: "./src/core/server/router",
    handler: (path, isRoutePatternDynamic, rootPattern) =>
      require(path)(isRoutePatternDynamic, rootPattern),
    dependencies: ["helpers/isRoutePatternDynamic"],
  },

  //protocols
  "core/server/protocols/udp": {
    path: "./src/core/server/protocols/udp",
    handler: (path, config) => require(path)(config),
    dependencies: ["config"],
  },

  //non-function dependencies
  //constants
  config: {
    path: "../shared/src/const",
    handler: (path) => require(path).SERVER_CONFIG,
  },

  //utils
  "helpers/flattenAddress": {
    path: "./src/utils/addressHelper",
    handler: (path) => require(path).toString,
  },
  "helpers/makeFunctionChainable": {
    path: "./src/utils/functionHelper",
    handler: (path) => require(path).makeChainable,
  },
  "helpers/isRoutePatternDynamic": {
    path: "./src/utils/regexpHelper",
    handler: (path) => require(path).isRegExp,
  },
};
