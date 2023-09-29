module.exports = () => {
  //init
  const dependencies = new Set();

  //private functions
  const add = (value) => {
    if (dependencies.has(value)) {
      throw `IoC Container: Can not resolve '${value}' dependency: circular referencing detected`;
    }
    dependencies.add(value);
  };

  const remove = (value) => {
    dependencies.delete(value);
  };

  //public functions
  const protect = (handler, value, props) => {
    add(value);
    const result = handler(value, props);

    remove(value);
    return result;
  };

  return {
    protectFromCircularReferencing: protect,
  };
};
