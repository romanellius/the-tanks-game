/// Shareable Between States CONTEXT ///

const isPlainObject = require("lodash.isplainobject");
const { createClone } = require("../utils/objectHelper");

module.exports = () => {
  //init
  const context = {};

  //private functions
  const processNames = (spreadNames) => {
    //[ ["var1", "var2"] ]
    if (Array.isArray(spreadNames[0])) {
      return spreadNames[0];
    }

    //[ { var1, var2 } ]
    if (isPlainObject(spreadNames[0])) {
      return Object.keys(spreadNames[0]);
    }

    //[ "var1", "var2" ]
    if (typeof spreadNames[0] === "string") {
      return spreadNames;
    }

    return [];
  };

  const pickExistingProperties = (target, source) =>
    source.filter((value) => target.hasOwnProperty(value));
  const omitExistingProperties = (target, source) =>
    source.filter((value) => !target.hasOwnProperty(value));

  const getPropertyNames = (object) => {
    const objPropertyNames = isPlainObject(object) && Object.keys(object);
    if (!objPropertyNames || !objPropertyNames.length) {
      throw `State Machine: Context: Invalid object "${JSON.stringify(
        object ?? {}
      )}": incorrect format`;
    }

    return objPropertyNames;
  };

  //public functions
  const has = (...names) => {
    names = processNames(names);
    if (!names.length) {
      throw "State Machine: Context: Can not iterate empty list: incorrect format";
    }

    const notExistingNames = omitExistingProperties(context, names);
    //returns 'true' if all names exist, 'array of not existing names' otherwise
    return notExistingNames.length ? notExistingNames : true;
  };

  const add = (object) => {
    const objPropertyNames = getPropertyNames(object);

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

    const notExistingKeys = omitExistingProperties(context, objPropertyNames);
    if (notExistingKeys.length) {
      throw `State Machine: Context: Can not update "${JSON.stringify(
        notExistingKeys
      )}": do not exist`;
    }

    Object.assign(context, object);
  };

  const remove = (...names) => {
    names = processNames(names);
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
    add,
    update,
    remove,
    use,
  };
};
