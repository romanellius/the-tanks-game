module.exports = {
  theFramework: {
    path: "../../theFramework",
    handler: (path) => require(path),
  },

  "helpers/stringifyWithMap": {
    path: "./utils/jsonHelper",
    handler: (path) => require(path).stringifyWithMapDataType,
  },
  "helpers/flattenAddress": {
    path: "../../shared",
    handler: (path) => require(path).utils.addressHelper.toString,
  },
};
