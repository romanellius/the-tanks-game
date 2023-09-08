///SERVER///

const attempt = require("lodash.attempt");
const isError = require("lodash.iserror");

module.exports = (
  socket,
  clients,
  defaultRouter,
  initCallbacks,
  { makeChainable },
  resolveDependency
) => {
  //init
  const routers = [defaultRouter];

  const thisServerInterface = {
    getClientIds: clients.getAllIds,
    getClients: clients.getAll,
    getClientCount: clients.getCount,
    connectClient: clients.connect,
    disconnectClient: clients.disconnect,
    clearClients: clients.clearAll,

    send: sendMessage,

    stop,
  };

  //private functions
  const setDefaultErrorHandler = (router) => {
    router.onError((error, data) => {
      console.error(`Error: Route ${data?.action} throws error: ${error}`);
    });
  };

  const deserializeMessage = (buffer) => {
    /*buffer.length > mtuRecommendedSize
          ? console.warn(
            `${flattenAddress(remote)}> ${mtuSizeWarning}`
          )
          : console.log(
            `${flattenAddress(remote)}> ${buffer.toString()}`
          );*/

    try {
      const data = attempt(JSON.parse, buffer.toString());
      if (isError(data) || !data?.action)
        throw "Router: Can not handle empty route";
      return data;
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  };

  const replyMessageNotValid = (socket, buffer, remote) => {
    socket.send(
      `"${buffer.toString()}" is not a valid format of data`,
      remote.port,
      remote.address.toString(),
      (error) => {
        if (error) {
          return socket.terminate();
        }

        console.log(
          `< "${buffer.toString().substring(0, 32)}${
            buffer.toString().length > 32 ? "..." : ""
          }" is not a valid format`
        );
      }
    );
  };

  const resolveMessage = (buffer, remote) => {
    const data = deserializeMessage(buffer);
    if (!data) return replyMessageNotValid(socket, buffer, remote);

    for (const router of routers) {
      try {
        const doInvokeNextRouteHandler = router.invoke(
          data,
          remote,
          thisServerInterface
        );
        if (!doInvokeNextRouteHandler) break;
      } catch (error) {
        const doInvokeNextErrorHandler = router.error(
          error,
          data,
          remote,
          thisServerInterface
        );
        doInvokeNextErrorHandler &&
          router !== defaultRouter &&
          defaultRouter.error(error, data, remote, thisServerInterface);

        break;
      }
    }
  };
  const invokeRunCallbacks = () => {
    const { address: ip, family: type, port } = socket.getAddress();

    initCallbacks.onRun.invoke({
      address: { ip, port, type },
    });
  };

  const initSocket = (socket, onReceive, onRun, { type, port }) => {
    socket
      .init(type)
      .onReceive(onReceive)
      .onRun(onRun)
      .onError()
      .onTerminate()
      .run(port);
  };

  //public functions
  //"socket.send" OVERRIDDEN
  function sendMessage(message, callback) {
    for (const { address } of clients.getAll()) {
      socket.send(message, address.port, address.ip, (error) => {
        callback && callback(error);

        error && socket.terminate();
      });
    }
  }

  //"rootPattern" must start with ["/](static pattern) or [/^\/](RegExp pattern)
  const bindRouter = (rootPattern) => {
    const newRouter = resolveDependency("core/server/router", rootPattern);
    routers.push(newRouter);

    return {
      ...makeChainable({
        bindEndpoint: (route, handler) => newRouter.bind(route, handler),
        reset: () => newRouter.reset(),
        addErrorHandler: (handler) => newRouter.onError(handler),
      }),
    };
  };
  //"route" must start with ["/](static pattern) or [/\/](RegExp pattern)
  const bindEndpoint = (route, handler) => defaultRouter.bind(route, handler);
  const addErrorHandler = (handler) => defaultRouter.onError(handler);

  const run = (config = { type: "udp4" }) => {
    setDefaultErrorHandler(defaultRouter);
    initSocket(socket, resolveMessage, invokeRunCallbacks, config);
  };
  const onRun = (callback) => initCallbacks.onRun.add(callback);
  const onRunExtensions = (callbacks) =>
    initCallbacks.onRun.addExtensions(callbacks);

  function stop() {
    socket.terminate();
  }

  return {
    interface: thisServerInterface,
    builder: {
      bindRouter,
      bindEndpoint,
      addErrorHandler,

      run,
      onRun,
      onRunExtensions,
    },
  };
};
