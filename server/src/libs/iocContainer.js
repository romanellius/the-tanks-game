///IOC CONTAINER///

const { resolvePath } = require("./fileHelper");
const { isObject } = require("./objectHelper");
const configObject = require("../iocConfig");

//init
const container = {};
build(container, configObject);

//private functions
function validateConfiguration(configObject) {
  if (!isObject(configObject)) {
    throw "IoC Container: 'dependencies.js' must export an object";
  }

  for (const dependencyName in configObject) {
    const dependency = configObject[dependencyName];
    if (!isObject(dependency)) {
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
  }
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
  for (const dependencyName in configObject) {
    const { handler, dependencies, isSingleton, path } =
      configObject[dependencyName];

    let newHandler = handler;
    if (typeof handler === "function") {
      newHandler = (...props) => handler(resolvePath(path), ...props);
    }

    registerDependency(
      container,
      dependencyName,
      dependencies ?? [],
      newHandler,
      !!isSingleton
    );
  }
}

function build(container, configObject) {
  validateConfiguration(configObject);
  bindConfiguration(container, configObject);
}

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
  const dependency = container[name];
  if (!dependency) {
    throw `IoC Container: Dependency '${name}' not found`;
  }

  const { isSingleton, handler, argDependencies, instance } = dependency;
  if (typeof handler !== "function") return handler;

  if (isSingleton && instance) {
    return instance;
  }

  const resolvedArgDependencies = argDependencies.map((argDependency) =>
    resolve(argDependency)
  );
  const newInstance = handler(...resolvedArgDependencies, ...props);
  if (isSingleton) {
    dependency.instance = newInstance;
  }

  return newInstance;
};

module.exports = {
  register,
  registerSingleton,
  resolve,
};
