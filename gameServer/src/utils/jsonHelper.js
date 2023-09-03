const stringifyWithMapDataType = (value) =>
  JSON.stringify(value, (_, value) => {
    if (value instanceof Map) {
      return {
        dataType: "Map",
        value: [...value],
      };
    } else {
      return value;
    }
  });

module.exports = {
  stringifyWithMapDataType,
};
