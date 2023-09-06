const iocConfig = require("./iocConfig");
const { resolve } = require("../../theIocContainer")(iocConfig);

module.exports = (config) => resolve("core/framework", config);
