const { resolve } = require("./libs/iocContainer");

module.exports = (config, doSupportExtensions = true) => {
  return resolve("core/framework", doSupportExtensions, config);
};
