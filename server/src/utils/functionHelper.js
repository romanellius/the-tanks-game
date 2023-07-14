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

module.exports = {
  makeChainable,
};
