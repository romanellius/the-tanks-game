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
const { makeChainable } = require("../../../shared").utils.functionHelper;
const useContext = require("./useContext");

//init
const states = {};

let initState;
let currState;
let currentStateId = 0;

let stateRouter;
let stateContext;

//private functions
const isRun = () => !!currState;

const safeTransitionTo = (nextInput) => isRun() && transitionTo(nextInput);

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

const getStateConfig = () => {
  const stateConfigJson = getFile("stateConfig.json");
  const parsedStateConfig = attempt(JSON.parse, stateConfigJson);
  return !isError(parsedStateConfig) ? parsedStateConfig : {};
};

const getStateHandlers = (absPath, serverInterface, isFinalState, refs) => {
  const { handler, disposeHandler } = require(absPath)({
    server: serverInterface,
    context: stateContext,
    refs,
  });

  return {
    handler,
    disposeHandler: !isFinalState
      ? disposeHandler
      : () => {
          throw `StateMachine: "disposeHandler" is not allowed: final state`;
        },
  };
};

const getStateDataFromFolderStructure = (
  serverInterface,
  stateFolders,
  refs
) => {
  const stateFilePattern = /^_[^_\.]*\.js$/;

  return stateFolders.reduce((stateData, { name, absPath }) => {
    const fileAbsPath = getMatchingFileAbsPath(absPath, stateFilePattern);
    if (fileAbsPath) {
      const isFinal = name.startsWith("!");
      const { handler, disposeHandler } = getStateHandlers(
        fileAbsPath,
        serverInterface,
        isFinal,
        refs
      );

      stateData.push({
        name,
        handler,
        disposeHandler,
        isFinal,
      });
    }

    return stateData;
  }, []);
};

const getStateDataFromFileStructure = (serverInterface, path, refs) => {
  return getAllFiles(path).map((file) => {
    const isFinal = file.name.startsWith("!");
    const { handler, disposeHandler } = getStateHandlers(
      file.absPath,
      serverInterface,
      isFinal,
      refs
    );

    return {
      name: getFileNameWithNoExtension(file.name),
      handler,
      disposeHandler,
      isFinal,
    };
  });
};

const getStateData = (serverInterface, refs) => {
  const path = "states";
  const nestedFolders = getFolders(path);

  return nestedFolders.length === 0
    ? getStateDataFromFileStructure(serverInterface, path, refs)
    : getStateDataFromFolderStructure(serverInterface, nestedFolders, refs);
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

    eachFromStateIsValid &&= stateName.startsWith("!")
      ? !state
      : isPlainObject(state);
    if (!eachFromStateIsValid) return false;

    forEach(state, (toState) => {
      eachToStateExists &&= toState in stateConfig;
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
  stateData.forEach(({ name, handler, disposeHandler, isFinal }) => {
    states[name] = Object.assign(states[name] ?? {}, {
      handler,
      disposeHandler,
      isFinal,
    });
  });
};

const invokeHandler = (stateName) => {
  const { handler, isFinal } = states[stateName];
  const { bindEndpoint, addErrorHandler } = stateRouter;

  const stateId = ++currentStateId;
  const protectFromInactiveState = (handler, errorMessage) => {
    if (stateId < currentStateId) {
      throw errorMessage;
    }
    return handler;
  };

  const stateRouterInterface = {
    bindEndpoint: !isFinal
      ? protectFromInactiveState(
          bindEndpoint,
          `StateMachine: "router" is not accessible: state is not active anymore`
        )
      : () => {
          throw `StateMachine: "bindEndpoint" method is not accessible: final state`;
        },
    addErrorHandler: !isFinal
      ? protectFromInactiveState(
          addErrorHandler,
          `StateMachine: "router" is not accessible: state is not active anymore`
        )
      : () => {
          throw `StateMachine: "addErrorHandler" method is not accessible: final state`;
        },
  };

  const transitionTo = !isFinal
    ? protectFromInactiveState(
        safeTransitionTo,
        `StateMachine: method "stateTransitionTo" is not accessible: state is not active anymore`
      )
    : () => {
        throw `StateMachine: "stateTransitionTo" method is not accessible: final state`;
      };

  try {
    handler({
      router: makeChainable(stateRouterInterface),
      stateTransitionTo: transitionTo,
    });
  } catch (error) {
    throw `State Machine: "${stateName}" handler can not be proceed: ${error}`;
  }
};

const invokeDisposeHandler = (state) => {
  const { disposeHandler } = states[state];
  try {
    disposeHandler && disposeHandler();
  } catch (error) {
    throw `State Machine: "${state}" dispose handler can not be proceed: ${error}`;
  }
};

//main functions
const build = (
  { bindRouter },
  serverInterface,
  refs,
  routerPattern = /^\/api/
) => {
  if (Object.keys(states).length) {
    throw "State Machine: Already has been built";
  }

  registerStateRouter(bindRouter, routerPattern);
  registerStateContext();

  const stateData = getStateData(serverInterface, refs);
  const stateConfig = getStateConfig();
  validateConfiguration(stateConfig, stateData);

  bindStateConditions(stateConfig);
  bindStateHandlers(stateData);
};

const transitionTo = (nextInput) => {
  if (!isRun() || !states[currState].conditions[nextInput]) {
    console.error(
      `StateMachine: Can not transit to the next state using ${"next"} symbol`
    );
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

module.exports = (server, refs, routerPattern) => {
  const { builder: serverBuilder, interface: serverInterface } = server;
  build(serverBuilder, serverInterface, refs, routerPattern);

  return () => initState && run(initState);
};
