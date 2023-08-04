///"STATE MACHINE" Supports Two "State STRUCTURES": FOLDERS and FILES///

const {
  getFolders,
  getMatchingFileAbsPath,
  getAllFiles,
  getFile,
  getFileNameWithNoExtension,
} = require("../../../libs/fileHelper");
const { isObject } = require("../../../libs/objectHelper");
const iocContainer = require("../../../libs/iocContainer");

const createContext = require("./context");

const { resolve } = iocContainer;
const server = resolve("core/server/server");
const frameworkInterface = resolve("core/frameworkInterface");

//init
const states = {};

let initState;
let currState;

let stateRouter;
let stateContext;

const runtimeServerProps = {
  stateTransitionTo: safeTransitionTo,
};

//private functions
const isRun = () => !!currState;

function safeTransitionTo(nextInput) {
  isRun() && transitionTo(nextInput);
}

const registerStateContext = () => {
  if (stateContext) {
    throw "State Machine: Context: Already has been registered";
  }

  stateContext = createContext();
};

const registerStateRouter = (path) => {
  if (stateRouter) {
    throw "State Machine: Router: Already has been registered";
  }

  stateRouter = server.bindRouter(path);
};

const bindServerProps = () => {
  for (const propName in runtimeServerProps) {
    frameworkInterface[propName] = runtimeServerProps[propName];
  }
};

const getStateConfig = () => {
  const stateConfigJson = getFile("./src/stateConfig.json");
  return JSON.parse(stateConfigJson);
};

const getStateDataFromFolderStructure = (stateFolders) => {
  const stateFilePattern = /^_[^_\.]*\.js$/;

  return stateFolders.reduce((stateData, { name, absPath }) => {
    const fileAbsPath = getMatchingFileAbsPath(absPath, stateFilePattern);
    if (fileAbsPath) {
      const { handler, disposeHandler } = require(fileAbsPath)({
        server: frameworkInterface,
        iocContainer,
        context: stateContext,
      });

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
    const { handler, disposeHandler } = require(file.absPath)({
      server: frameworkInterface,
      iocContainer,
      context: stateContext,
    });

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

    eachFromStateIsValid &&= isObject(stateConfig[stateName]);
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

const invokeHandler = (state) => {
  const { bindEndpoint, addErrorHandler } = stateRouter;
  const stateRouterInterface = { bindEndpoint, addErrorHandler };

  try {
    states[state].handler(stateRouterInterface);
  } catch (error) {
    throw `State Machine: "${state}" handler can not be proceed: ${error}`;
  }
};

const invokeDisposeHandler = (state) => {
  try {
    states[state].disposeHandler && states[state].disposeHandler();
  } catch (error) {
    throw `State Machine: "${state}" dispose handler can not be proceed: ${error}`;
  }
};

//main functions
const build = (routerPattern = /^\/api/) => {
  if (Object.keys(states).length) {
    throw "State Machine: Already has been built";
  }

  registerStateContext();
  registerStateRouter(routerPattern);
  bindServerProps();

  const stateConfig = getStateConfig();
  const stateData = getStateData();
  validateConfiguration(stateConfig, stateData);

  bindStateConditions(stateConfig);
  bindStateHandlers(stateData);
};

const transitionTo = (nextInput) => {
  if (!isRun() || !states[currState].conditions[nextInput]) {
    return false;
  }

  stateRouter.reset();
  invokeDisposeHandler(currState);

  currState = states[currState].conditions[nextInput];
  console.log(
    `State Machine: State "${currState}"${currState === "gameEnd" ? "\n" : ""}`
  );

  invokeHandler(currState);
  return true;
};

const run = (state) => {
  if (isRun()) {
    throw "State Machine: Already has been started";
  }

  currState = state;
  console.log(`State Machine: State "${currState}"`);
  invokeHandler(currState);
};

module.exports = {
  config: {
    useStateMachine: build,
  },
  run: () => initState && run(initState),
};
