module.exports = {
  theFramework: {
    handler: (_, config) => require("../../theFramework")(config),
  },

  config: {
    handler: () => require("../../shared").constants.SERVER_CONFIG,
    isSingleton: true,
  },
};
