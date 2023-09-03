module.exports = {
  "core/framework": {
    path: "./core/framework",
    handler: (path, server, extensions, functionHelper) =>
      require(path)(server, extensions, functionHelper),
    dependencies: [
      "core/server/server",
      "core/useExtensions",
      "helpers/functionHelper",
    ],
  },
  "core/useExtensions": {
    path: "./core/useExtensions",
    handler: (path, server, fileHelper) => require(path)(server, fileHelper),
    dependencies: ["core/server/server", "helpers/fileHelper"],
  },
  "core/server/server": {
    path: "./core/server/server",
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
    path: "./core/server/clients",
    handler: (path, flattenAddress) => require(path)(flattenAddress),
    dependencies: ["helpers/flattenAddress"],
  },
  "core/server/initCallbacks": {
    path: "./core/server/initCallbacks",
    handler: (path) => require(path)(),
  },
  "core/server/router": {
    path: "./core/server/router",
    handler: (path, isRoutePatternDynamic, rootPattern) =>
      require(path)(isRoutePatternDynamic, rootPattern),
    dependencies: ["helpers/isRoutePatternDynamic"],
  },
  "core/server/protocols/udp": {
    path: "./core/server/protocols/udp",
    handler: (path, config) => require(path)(config),
    dependencies: ["config"],
  },

  "helpers/functionHelper": {
    path: "./utils/functionHelper",
    handler: (path) => require(path),
  },
  "helpers/isRoutePatternDynamic": {
    path: "./utils/regexpHelper",
    handler: (path) => require(path).isRegExp,
  },
  "helpers/fileHelper": {
    path: "../../shared",
    handler: (path) => require(path).utils.fileHelper,
  },
  "helpers/flattenAddress": {
    path: "../../shared",
    handler: (path) => require(path).utils.addressHelper.toString,
  },

  config: {
    path: "../../shared",
    handler: (path) => require(path).constants.SERVER_CONFIG,
  },
};
