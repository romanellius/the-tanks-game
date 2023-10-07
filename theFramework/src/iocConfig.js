module.exports = {
  "core/framework": {
    handler: ({ dependencies, props }) =>
      require("./core/framework")(...dependencies, ...props),
    dependencies: [
      "core/server/server",
      "core/timers",
      "helpers/functionHelper",
    ],
  },
  "core/timers": {
    handler: () => require("./core/modules/preciseTimers"),
    isSingleton: true,
  },
  "core/server/server": {
    handler: ({ dependencies, resolve }) =>
      require("./core/server/server")(...dependencies, resolve),
    dependencies: [
      "core/server/protocols/udp",
      "core/server/clients",
      "core/server/router",
      "core/server/initCallbacks",
      "helpers/functionHelper",
    ],
  },
  "core/server/clients": {
    handler: ({ dependencies }) =>
      require("./core/server/clients")(...dependencies),
    dependencies: ["helpers/flattenAddress"],
  },
  "core/server/initCallbacks": {
    handler: () => require("./core/server/initCallbacks")(),
  },
  "core/server/router": {
    handler: ({ dependencies, props }) =>
      require("./core/server/router")(...dependencies, ...props),
    dependencies: ["helpers/isRoutePatternDynamic"],
  },
  "core/server/protocols/udp": {
    handler: () => require("./core/server/protocols/udp")(),
  },

  "helpers/functionHelper": {
    handler: () => require("../../shared").utils.functionHelper,
    isSingleton: true,
  },
  "helpers/isRoutePatternDynamic": {
    handler: () => require("./utils/regexpHelper").isRegExp,
    isSingleton: true,
  },
  "helpers/flattenAddress": {
    handler: () => require("../../shared").utils.addressHelper.toString,
    isSingleton: true,
  },
};
