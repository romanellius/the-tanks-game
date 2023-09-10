const forEach = require("lodash.foreach");

const makeChainable = (functionObject) => {
  forEach(functionObject, (func, name) => {
    if (typeof func === "function") {
      functionObject[name] = function (...props) {
        func(...props);
        return this;
      };
    }
  });
  return functionObject;
};

const wrapWithErrorHandler = (functionObject, errorHandler) => {
  if (typeof errorHandler !== "function") {
    throw `Cannot wrap the function with handler "${JSON.stringify(
      errorHandler
    )}"`;
  }

  forEach(functionObject, (func, name) => {
    if (typeof func === "function") {
      functionObject[name] = function (...props) {
        try {
          func(...props);
        } catch (error) {
          errorHandler(error);
        }
      };
    }
  });

  return functionObject;
};

module.exports = {
  makeChainable,
  wrapWithErrorHandler,
};
