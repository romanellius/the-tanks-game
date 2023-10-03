const cloneDeep = require("lodash.clonedeep");
const isPlainObject = require("lodash.isplainobject");

//private functions
const isObjectValidForCloning = (value) =>
  value && typeof value === "object" && typeof value !== "function";

const cloningReadOnlyProxyHandler = {
  get(target, prop) {
    const value = target[prop];

    if (isObjectValidForCloning(value)) {
      return cloneDeep(value);
    }

    return value;
  },
  set() {
    throw "Cannot assign to read only property";
  },
  deleteProperty() {
    throw "Cannot delete read only property";
  },
  defineProperty() {
    throw "Cannot define property on a read only object";
  },
  preventExtensions() {
    throw "Cannot prevent extensions on a read only object";
  },
  setPrototypeOf() {
    throw "Cannot set prototype of a read only object";
  },
  isExtensible() {
    return false;
  },
  getOwnPropertyDescriptor(target, prop) {
    const descriptor = Object.getOwnPropertyDescriptor(target, prop);
    if (descriptor) {
      descriptor.configurable = false;
    }

    return descriptor;
  },
};

//public functions
const createSafeClone = (object) =>
  new Proxy(object, cloningReadOnlyProxyHandler);

const processSpreadValues = (spreadValues) => {
  const [firstSpreadValue] = spreadValues;
  //[ ["var1", "var2"] ]
  if (Array.isArray(firstSpreadValue)) {
    return firstSpreadValue;
  }
  //[ { var1, var2 } ]
  if (isPlainObject(firstSpreadValue)) {
    return Object.keys(firstSpreadValue);
  }
  //[ "var1", "var2" ]
  return spreadValues;
};

const getPropertyNames = (object) =>
  isPlainObject(object) && Object.keys(object);

module.exports = {
  createClone: createSafeClone,
  processSpreadValues,
  getPropertyNames,
};
