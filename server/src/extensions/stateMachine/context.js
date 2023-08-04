const { isObject, createClone } =
  require("../../../../shared").utils.objectHelper;

//private functions
const processNames = (names) => {
  //[ ["var1", "var2"] ]
  if (Array.isArray(names[0])) {
    return names[0];
  }
  //[ { var1, var2 } ]
  if (isObject(names[0])) {
    return Object.keys(names[0]);
  }
  //[ "var1", "var2" ]
  return names;
};

const filterProperties = (target, source, checkExistence) => {
  return source.filter(
    (value) => checkExistence === target.hasOwnProperty(value)
  );
};

const getPropertyNames = (object) => {
  const objPropertyNames = isObject(object) && Object.keys(object);
  if (!objPropertyNames || !objPropertyNames.length) {
    throw `State Machine: Context: Invalid object "${JSON.stringify(
      object ?? {}
    )}": incorrect format`;
  }

  return objPropertyNames;
};

module.exports = () => {
  //init
  const context = {};

  //public functions
  const has = (...names) => {
    names = processNames(names);
    if (!names.length) {
      throw "State Machine: Context: Can not iterate empty list: incorrect format";
    }

    const notExistingNames = filterProperties(context, names, false);
    //returns 'true' if all names exist, 'array of not existing names' otherwise
    return notExistingNames.length ? notExistingNames : true;
  };

  const add = (object) => {
    const objPropertyNames = getPropertyNames(object);

    const existingKeys = filterProperties(context, objPropertyNames, true);
    if (existingKeys.length) {
      throw `State Machine: Context: Can not add "${JSON.stringify(
        existingKeys
      )}": do exist`;
    }

    Object.assign(context, object);
  };

  const update = (object) => {
    const objPropertyNames = getPropertyNames(object);

    const notExistingKeys = filterProperties(context, objPropertyNames, false);
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

    const notExistingNames = filterProperties(context, names, false);
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
