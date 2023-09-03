module.exports = {
  "core/framework": {
    handler: (server, extensions, functionHelper) =>
      require("./core/framework")(server, extensions, functionHelper),
    dependencies: [
      "core/server/server",
      "core/useExtensions",
      "helpers/functionHelper",
    ],
  },
  "core/useExtensions": {
    handler: (server, fileHelper) =>
      require("./core/useExtensions")(server, fileHelper),
    dependencies: ["core/server/server", "helpers/fileHelper"],
  },
  "core/server/server": {
    handler: (protocol, clients, router, callbacks, functionHelper, config) =>
      require("./core/server/server")(
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
    handler: (flattenAddress) =>
      require("./core/server/clients")(flattenAddress),
    dependencies: ["helpers/flattenAddress"],
  },
  "core/server/initCallbacks": {
    handler: () => require("./core/server/initCallbacks")(),
  },
  "core/server/router": {
    handler: (isRoutePatternDynamic, rootPattern) =>
      require("./core/server/router")(isRoutePatternDynamic, rootPattern),
    dependencies: ["helpers/isRoutePatternDynamic"],
  },
  "core/server/protocols/udp": {
    handler: (config) => require("./core/server/protocols/udp")(config),
    dependencies: ["config"],
  },

  "helpers/functionHelper": {
    handler: () => require("./utils/functionHelper"),
  },
  "helpers/isRoutePatternDynamic": {
    handler: () => require("./utils/regexpHelper").isRegExp,
  },
  "helpers/fileHelper": {
    handler: () => require("../../shared").utils.fileHelper,
  },
  "helpers/flattenAddress": {
    handler: () => require("../../shared").utils.addressHelper.toString,
  },

  config: {
    handler: () => require("../../shared").constants.SERVER_CONFIG,
  },
};
