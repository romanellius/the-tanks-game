///"STATE MACHINE" Supports Two "State STRUCTURES": FOLDERS and FILES///

const attempt = require("lodash.attempt");
const isError = require("lodash.iserror");
const forEach = require("lodash.foreach");
const isPlainObject = require("lodash.isplainobject");
const compact = require("lodash.compact");
const {
  getFolders,
  getMatchingFileAbsPath,
  getAllFiles,
  getFile,
  getFileNameWithNoExtension,
} = require("../utils/fileHelper");
const useContext = require("./useContext");

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

  stateContext = useContext();
};

const registerStateRouter = (addRouter, path) => {
  if (stateRouter) {
    throw "State Machine: Router: Already has been registered";
  }

  stateRouter = addRouter(path);
};

const bindServerProps = (serverInterface) => {
  Object.assign(serverInterface, runtimeServerProps);
};

const getStateConfig = () => {
  const stateConfigJson = getFile("stateConfig.json");
  const parsedStateConfig = attempt(JSON.parse, stateConfigJson);
  return !isError(parsedStateConfig) ? parsedStateConfig : {};
};

const getStateHandlers = (absPath, serverInterface) => {
  const { handler, disposeHandler } = require(absPath)({
    server: serverInterface,
    context: stateContext,
  });

  return { handler, disposeHandler };
};

const getStateDataFromFolderStructure = (serverInterface, stateFolders) => {
  const stateFilePattern = /^_[^_\.]*\.js$/;

  return stateFolders.reduce((stateData, { name, absPath }) => {
    const fileAbsPath = getMatchingFileAbsPath(absPath, stateFilePattern);
    if (fileAbsPath) {
      const { handler, disposeHandler } = getStateHandlers(
        fileAbsPath,
        serverInterface
      );

      stateData.push({
        name,
        handler,
        disposeHandler,
      });
    }

    return stateData;
  }, []);
};

const getStateDataFromFileStructure = (serverInterface, path) => {
  return getAllFiles(path).map((file) => {
    const { handler, disposeHandler } = getStateHandlers(
      file.absPath,
      serverInterface
    );

    return {
      name: getFileNameWithNoExtension(file.name),
      handler,
      disposeHandler,
    };
  });
};

const getStateData = (serverInterface) => {
  const path = "states";
  const nestedFolders = getFolders(path);

  return nestedFolders.length === 0
    ? getStateDataFromFileStructure(serverInterface, path)
    : getStateDataFromFolderStructure(serverInterface, nestedFolders);
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

  forEach(stateConfig, (state, stateName) => {
    stateName.startsWith("@") && initStatesCount++;

    eachFromStateIsValid &&= isPlainObject(state);
    if (!eachFromStateIsValid) return false;

    forEach(state, (toState) => {
      eachToStateExists &&= !!stateConfig[toState];
    });

    eachStateHasHandler &&= !!stateHandlers[stateName]?.handler;
  });

  const exceptions = compact([
    initStatesCount !== 1 &&
      `StateMachine: initial state must be only one: found ${initStatesCount} initial states`,
    !eachFromStateIsValid &&
      "StateMachine: states in 'states.json' must be objects",
    !eachToStateExists &&
      "StateMachine: at least one 'stateTo' in 'states.json' doesn't exist",
    !eachStateHasHandler &&
      "StateMachine: each state must have corresponding state and handler in 'states/'",
  ]);

  if (exceptions.length) {
    throw exceptions;
  }
};

const bindStateConditions = (stateConfig) => {
  forEach(stateConfig, (state, stateName) => {
    if (stateName.startsWith("@")) {
      initState = stateName;
    }

    states[stateName] = Object.assign(states[stateName] ?? {}, {
      conditions: state,
    });
  });
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
const build = ({ bindRouter }, serverInterface, routerPattern = /^\/api/) => {
  if (Object.keys(states).length) {
    throw "State Machine: Already has been built";
  }

  registerStateRouter(bindRouter, routerPattern);
  registerStateContext();

  bindServerProps(serverInterface);

  const stateData = getStateData(serverInterface);
  const stateConfig = getStateConfig();
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

module.exports = (server, routerPattern) => {
  const { builder: serverBuilder, interface: serverInterface } = server;
  build(serverBuilder, serverInterface, routerPattern);

  return () => initState && run(initState);
};
