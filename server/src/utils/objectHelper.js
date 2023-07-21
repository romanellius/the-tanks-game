///OBJECT Helper///

const isObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value !== "function"
  );
};

module.exports = {
  isObject,
};
