module.exports = {
  theFramework: {
    handler: () => require("../../theFramework"),
  },

  "helpers/stringifyWithMap": {
    handler: () => require("./utils/jsonHelper").stringifyWithMapDataType,
    isSingleton: true,
  },
  "helpers/flattenAddress": {
    handler: () => require("../../shared").utils.addressHelper.toString,
    isSingleton: true,
  },
};
