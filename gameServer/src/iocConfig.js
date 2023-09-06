module.exports = {
  theFramework: {
    handler: () => require("../../theFramework"),
  },
  theStateMachine: {
    handler: () => require("../../theStateMachine"),
  },

  config: {
    handler: () => require("../../shared").constants.SERVER_CONFIG,
    isSingleton: true,
  },
};
