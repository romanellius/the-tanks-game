module.exports = {
  //function dependencies
  //frameworks
  "core/framework": {
    path: "./src/core/framework",
    handler: (path, server, extensions) => require(path)(server, extensions),
    dependencies: ["core/server/server", "core/useExtensions"],
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
    handler: (path) => require(path)(),
  },
  "core/server/initCallbacks": {
    path: "./src/core/server/initCallbacks",
    handler: (path) => require(path)(),
  },
  //router
  "core/server/router": {
    path: "./src/core/server/router",
    handler: (path, rootPattern) => require(path)(rootPattern),
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
};
