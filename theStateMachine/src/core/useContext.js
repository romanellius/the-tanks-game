/// Shareable Between States CONTEXT ///

const {
  getPropertyNames,
  processSpreadValues,
  createClone,
} = require("../utils/objectHelper");

module.exports = () => {
  //init
  const context = {};

  //private functions
  const pickExistingProperties = (target, source) =>
    source.filter((value) => target.hasOwnProperty(value));
  const omitExistingProperties = (target, source) =>
    source.filter((value) => !target.hasOwnProperty(value));

  const getNotExistingProperties = (names) => {
    names = processSpreadValues(names);
    if (!names.length) {
      throw "State Machine: Context: Can not iterate empty list: incorrect format";
    }

    return omitExistingProperties(context, names);
  };

  //public functions
  const has = (...names) => {
    const notExistingNames = getNotExistingProperties(names);
    return !notExistingNames.length;
  };

  const filterNotExisting = (...names) => {
    const notExistingNames = getNotExistingProperties(names);
    //returns 'false' if all names exist, 'array of not existing names' otherwise
    return notExistingNames.length ? notExistingNames : false;
  };

  const add = (object) => {
    const objPropertyNames = getPropertyNames(object);
    if (!objPropertyNames || !objPropertyNames.length) {
      throw `State Machine: Context: Invalid object "${JSON.stringify(
        object ?? {}
      )}": incorrect format`;
    }

    const existingKeys = pickExistingProperties(context, objPropertyNames);
    if (existingKeys.length) {
      throw `State Machine: Context: Can not add "${JSON.stringify(
        existingKeys
      )}": do exist`;
    }

    Object.assign(context, object);
  };

  const update = (object) => {
    const objPropertyNames = getPropertyNames(object);
    if (!objPropertyNames || !objPropertyNames.length) {
      throw `State Machine: Context: Invalid object "${JSON.stringify(
        object ?? {}
      )}": incorrect format`;
    }

    const notExistingKeys = omitExistingProperties(context, objPropertyNames);
    if (notExistingKeys.length) {
      throw `State Machine: Context: Can not update "${JSON.stringify(
        notExistingKeys
      )}": do not exist`;
    }

    Object.assign(context, object);
  };

  const remove = (...names) => {
    names = processSpreadValues(names);
    if (!names.length) {
      throw "State Machine: Context: Can not remove empty list: incorrect format";
    }

    const notExistingNames = omitExistingProperties(context, names);
    if (notExistingNames.length) {
      throw `State Machine: Context: Can not remove "${JSON.stringify(
        notExistingNames
      )}": do not exist`;
    }

    names.forEach((name) => delete context[name]);
  };

  const use = () => createClone(context);

  return {
    has,
    filter: filterNotExisting,
    add,
    update,
    remove,
    use,
  };
};
