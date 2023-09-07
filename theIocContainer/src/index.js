const isPlainObject = require("lodash.isplainobject");
const forEach = require("lodash.foreach");
const useCircularProtection = require("./circularReferenceProtection");

//private functions
const validateConfiguration = (configObject) => {
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
};

const registerDependency = (
  container,
  name,
  argDependencies = [],
  handler,
  isSingleton
) => {
  if (container[name]) {
    throw `IoC Container: Can not register '${name}' dependency: occupied`;
  }

  container[name] = { argDependencies, handler, isSingleton };
};

const bindConfiguration = (container, configObject) => {
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
};

const build = (container, configObject) => {
  validateConfiguration(configObject);
  bindConfiguration(container, configObject);
};

module.exports = (configObject) => {
  const container = {};
  build(container, configObject);

  const {
    addDependencyToCircularProtection,
    removeDependencyFromCircularProtection,
  } = useCircularProtection();

  //public functions
  const register = function (name, handler, argDependencies = []) {
    registerDependency(container, name, argDependencies, handler, false);
    return this;
  };
  const registerSingleton = function (name, handler, argDependencies = []) {
    registerDependency(container, name, argDependencies, handler, true);
    return this;
  };

  const resolve = (name, ...props) => {
    addDependencyToCircularProtection(name);

    const dependency = container[name];
    if (!dependency) {
      throw `IoC Container: Dependency '${name}' not found`;
    }

    const { isSingleton, handler, argDependencies, instance } = dependency;
    if (typeof handler !== "function") {
      removeDependencyFromCircularProtection(name);
      return handler;
    }

    if (isSingleton && instance) {
      removeDependencyFromCircularProtection(name);
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

    removeDependencyFromCircularProtection(name);
    return newInstance;
  };

  return {
    register,
    registerSingleton,
    resolve,
  };
};
