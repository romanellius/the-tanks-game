const isPlainObject = require("lodash.isplainobject");
const forEach = require("lodash.foreach");
const useCircularProtection = require("./circularReferenceProtection");

module.exports = (configObject) => {
  //init
  const { protectFromCircularReferencing } = useCircularProtection();

  const container = {};
  build(container, configObject);

  //private functions
  function validateConfiguration(configObject) {
    if (!isPlainObject(configObject)) {
      throw "IoC Container: 'dependencies.js' must export an object";
    }

    forEach(configObject, (dependency) => {
      if (!isPlainObject(dependency)) {
        throw "IoC Container: each dependency must be an object in 'dependencies.js'";
      }

      if (!dependency.handler) {
        throw "IoC Container: each dependency must have a handler in 'dependencies.js'";
      }

      const { dependencies: relatedDependencies } = dependency;
      if (relatedDependencies) {
        if (!(relatedDependencies instanceof Array)) {
          throw "IoC Container: related dependencies must be boxed in an array in 'dependencies.js'";
        }

        relatedDependencies.forEach((relatedDependency) => {
          if (typeof relatedDependency !== "string") {
            throw "IoC Container: each related dependency must be a string in 'dependencies.js'";
          }

          if (!configObject[relatedDependency]) {
            throw "IoC Container: each related dependency must be presented in 'dependencies.js'";
          }
        });
      }
    });
  }

  function registerDependency(
    container,
    name,
    argDependencies = [],
    handler,
    isSingleton
  ) {
    if (container[name]) {
      throw `IoC Container: Can not register '${name}' dependency: occupied`;
    }

    container[name] = { argDependencies, handler, isSingleton };
  }

  function bindConfiguration(container, configObject) {
    forEach(configObject, (dependency, dependencyName) => {
      const { handler, dependencies, isSingleton } = dependency;

      registerDependency(
        container,
        dependencyName,
        dependencies ?? [],
        handler,
        !!isSingleton
      );
    });
  }

  function build(container, configObject) {
    validateConfiguration(configObject);
    bindConfiguration(container, configObject);
  }

  function resolveDependency(name, props) {
    const dependency = container[name];
    if (!dependency) {
      throw `IoC Container: Dependency '${name}' not found`;
    }

    const { isSingleton, handler, argDependencies, instance } = dependency;
    if (typeof handler !== "function") {
      return handler;
    }

    if (isSingleton && instance) {
      return instance;
    }

    const resolvedArgDependencies = argDependencies.map((argDependency) =>
      resolve(argDependency)
    );
    const newInstance = handler({
      dependencies: resolvedArgDependencies,
      props,
      resolve,
    });

    if (isSingleton) {
      dependency.instance = newInstance;
    }

    return newInstance;
  }

  //public functions
  function register(name, handler, argDependencies = []) {
    registerDependency(container, name, argDependencies, handler, false);
    return this;
  }
  function registerSingleton(name, handler, argDependencies = []) {
    registerDependency(container, name, argDependencies, handler, true);
    return this;
  }

  function resolve(name, ...props) {
    return protectFromCircularReferencing(resolveDependency, name, props);
  }

  return {
    register,
    registerSingleton,
    resolve,
  };
};
