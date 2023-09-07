module.exports = {
  theFramework: {
    handler: ({ props }) => require("../../theFramework")(...props),
  },

  config: {
    handler: () => require("../../shared").constants.SERVER_CONFIG,
    isSingleton: true,
  },
};
