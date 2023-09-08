module.exports = {
  theFramework: {
    handler: ({ props }) => require("../../theFramework")(...props),
  },

  "helpers/flattenAddress": {
    handler: () => require("../../shared").utils.addressHelper.toString,
    isSingleton: true,
  },
  "helpers/stringifyWithMap": {
    handler: () => require("./utils/jsonHelper").stringifyWithMapDataType,
    isSingleton: true,
  },

  config: {
    handler: () => require("../../shared").constants.SERVER_CONFIG,
    isSingleton: true,
  },
};
