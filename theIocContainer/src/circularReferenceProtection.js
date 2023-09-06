module.exports = () => {
  const dependencies = new Set();

  const add = (value) => {
    if (dependencies.has(value)) {
      throw `IoC Container: Can not resolve '${value}' dependency: circular referencing detected`;
    }
    dependencies.add(value);
  };

  const remove = (value) => {
    dependencies.delete(value);
  };

  return {
    addDependencyToCircularProtection: add,
    removeDependencyFromCircularProtection: remove,
  };
};
