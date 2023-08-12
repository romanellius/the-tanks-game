///FUNCTION Helper///

const makeChainable = (functionObject) => {
  for (const name in functionObject) {
    if (typeof functionObject[name] === "function") {
      const func = functionObject[name];

      functionObject[name] = function (...props) {
        func(...props);
        return this;
      };
    }
  }

  return functionObject;
};

const wrapWithErrorHandler = (functionObject, errorHandler) => {
  if (typeof errorHandler !== "function") {
    throw `Cannot wrap the function with handler "${JSON.stringify(
      errorHandler
    )}"`;
  }

  for (const name in functionObject) {
    if (typeof functionObject[name] === "function") {
      const func = functionObject[name];

      functionObject[name] = (...props) => {
        try {
          func(...props);
        } catch (error) {
          errorHandler(error);
        }
      };
    }
  }

  return functionObject;
};

module.exports = {
  makeChainable,
  wrapWithErrorHandler,
};
