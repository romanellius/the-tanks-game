module.exports = {
  // internal
  //- function dependencies
  //-- framework
  "core/frameworkInterface": {
    path: "./src/core/frameworkInterface",
    handler: (path, server) => require(path)(server),
    dependencies: ["core/server/server"],
  },
  "core/frameworkBuilder": {
    path: "./src/core/frameworkBuilder",
    handler: (path, server, extensions, functionHelper) =>
      require(path)(server, extensions, functionHelper),
    dependencies: [
      "core/server/server",
      "core/useExtensions",
      "helpers/functionHelper",
    ],
  },
  "core/useExtensions": {
    path: "./src/core/useExtensions",
    handler: (path) => require(path)(),
  },

  //-- server
  "core/server/server": {
    path: "./src/core/server/server",
    handler: (
      path,
      protocol,
      clients,
      router,
      callbacks,
      functionHelper,
      config
    ) =>
      require(path)(
        protocol,
        clients,
        router,
        callbacks,
        functionHelper,
        config
      ),
    dependencies: [
      "core/server/protocols/udp",
      "core/server/clients",
      "core/server/router",
      "core/server/initCallbacks",
      "helpers/functionHelper",
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
  "core/server/router": {
    path: "./src/core/server/router",
    handler: (path, isRoutePatternDynamic, rootPattern) =>
      require(path)(isRoutePatternDynamic, rootPattern),
    dependencies: ["helpers/isRoutePatternDynamic"],
  },

  //-- protocols
  "core/server/protocols/udp": {
    path: "./src/core/server/protocols/udp",
    handler: (path, config) => require(path)(config),
    dependencies: ["config"],
  },

  //- non-function dependencies
  //-- utils
  "helpers/isRoutePatternDynamic": {
    path: "./src/utils/regexpHelper",
    handler: (path) => require(path).isRegExp,
  },
  "helpers/functionHelper": {
    path: "./src/utils/functionHelper",
    handler: (path) => require(path),
  },

  // business logic
  //- non-function dependencies
  //-- utils
  "helpers/stringifyWithMap": {
    path: "./src/utils/jsonHelper",
    handler: (path) => require(path).stringifyWithMapDataType,
  },

  //-- constants
  config: {
    path: "../shared/src/const",
    handler: (path) => require(path).SERVER_CONFIG,
  },
};
