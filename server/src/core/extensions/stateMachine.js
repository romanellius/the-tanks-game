///"STATE MACHINE" Supports Two "State STRUCTURES": FOLDERS and FILES///

const {
  getFolders,
  getMatchingFileAbsPath,
  getAllFiles,
  getFile,
  getFileNameWithNoExtension,
} = require("../../libs/fileHelper");

const { resolve } = require("../../libs/iocContainer");
const server = resolve("core/server/server");

//init
const states = {};

let initState;
let currState;

let stateRouter;

//private functions
const getStateConfig = () => {
  const stateConfigJson = getFile("./src/stateConfig.json");
  return JSON.parse(stateConfigJson);
};

const getStateDataFromFolderStructure = (stateFolders) => {
  const stateFilePattern = /^_[^_\.]*\.js$/;

  return stateFolders.reduce((stateData, { name, absPath }) => {
    const fileAbsPath = getMatchingFileAbsPath(absPath, stateFilePattern);
    if (fileAbsPath) {
      const { handler, disposeHandler } = require(fileAbsPath)(server);
      stateData.push({
        name,
        handler,
        disposeHandler,
      });
    }

    return stateData;
  }, []);
};

const getStateDataFromFileStructure = (path) => {
  const stateData = [];

  for (const file of getAllFiles(path)) {
    const { handler, disposeHandler } = require(file.absPath)(server);

    stateData.push({
      name: getFileNameWithNoExtension(file.name),
      handler,
      disposeHandler,
    });
  }

  return stateData;
};

const getStateData = () => {
  const path = "./src/states";

  const nestedFolders = getFolders(path);
  return nestedFolders.length === 0
    ? getStateDataFromFileStructure(path)
    : getStateDataFromFolderStructure(nestedFolders);
};

const validateConfiguration = (stateConfig, stateData) => {
  let initStatesCount = 0;
  let eachFromStateIsValid = true;
  let eachToStateExists = true;
  let eachStateHasHandler = true;

  const stateHandlers = {};
  stateData.forEach(({ name, handler, disposeHandler }) => {
    stateHandlers[name] = {
      handler,
      disposeHandler,
    };
  });

  for (const stateName in stateConfig) {
    stateName.startsWith("@") && initStatesCount++;

    eachFromStateIsValid &&= typeof stateConfig[stateName] === "object";
    if (!eachFromStateIsValid) break;

    for (const input in stateConfig[stateName]) {
      eachToStateExists &&= stateConfig[stateConfig[stateName][input]];
    }

    eachStateHasHandler &&=
      stateHandlers[stateName] && !!stateHandlers[stateName].handler;
  }

  const exceptions = [
    initStatesCount !== 1 &&
      `StateMachine: initial state must be only one: found ${initStatesCount} initial states`,
    !eachFromStateIsValid &&
      "StateMachine: states in 'states.json' must be objects",
    !eachToStateExists &&
      "StateMachine: at least one 'stateTo' in 'states.json' doesn't exist",
    !eachStateHasHandler &&
      "StateMachine: each state must have corresponding state and handler in 'states/'",
  ].filter(Boolean);

  if (exceptions.length) {
    throw exceptions;
  }
};

const bindStateConditions = (stateConfig) => {
  for (const stateName in stateConfig) {
    stateName.startsWith("@") && (initState = stateName);

    states[stateName] = Object.assign(states[stateName] ?? {}, {
      conditions: stateConfig[stateName],
    });
  }
};

const bindStateHandlers = (stateData) => {
  stateData.forEach(({ name, handler, disposeHandler }) => {
    states[name] = Object.assign(states[name] ?? {}, {
      handler,
      disposeHandler,
    });
  });
};

const registerStateRouter = (path) => {
  if (stateRouter) {
    throw "StateMachine: Router already has been registered";
  }

  stateRouter = server.bindRouter(path);
};

//public functions
const build = (routerPattern = /^\/api\/states/) => {
  if (Object.keys(states).length) {
    throw "StateMachine: State machine already has been built";
  }

  const stateConfig = getStateConfig();
  const stateData = getStateData();
  validateConfiguration(stateConfig, stateData);

  bindStateConditions(stateConfig);
  bindStateHandlers(stateData);

  registerStateRouter(routerPattern);
};

const transitionTo = (nextInput) => {
  if (!isRun() || !states[currState].conditions[nextInput]) {
    return false;
  }

  stateRouter.unbindAllEndpoints();

  states[currState].disposeHandler && states[currState].disposeHandler();
  currState = states[currState].conditions[nextInput];

  console.log(
    "State Machine:",
    `"${currState}"${currState === "gameEnd" ? "\n" : ""}`
  );
  states[currState].handler();

  return true;
};

const isRun = () => !!currState;

const run = (state) => {
  if (isRun()) {
    throw "StateMachine: State machine already has been started";
  }

  currState = state;
  console.log("State Machine:", `"${currState}"`);
  states[currState].handler();
};

module.exports = {
  configHandlers: [
    {
      name: "useStateMachine",
      func: function (routerPattern) {
        build(routerPattern);
        return this;
      },
    },
  ],
  runtimeHandlers: [
    {
      name: "stateTransitionTo",
      func: (nextInput) => isRun() && transitionTo(nextInput),
    },
    {
      name: "getStateRouter",
      func: () => stateRouter,
    },
  ],
  run: () => initState && run(initState),
};
