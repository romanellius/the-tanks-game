///SERVER///

const { resolve } = require("../../libs/iocContainer");

module.exports = (socket, clients, defaultRouter, callbacks, socketConfig) => {
  //init
  const routers = [defaultRouter];

  //private functions
  const bindEndpointToRouter = (router, route, handler) =>
    router.bind(route, handler);

  const resolveRoutes = (router, data, remote) => {
    const genRouterHandlers = router.resolveHandlers(data?.action);
    let resolvedCount = 0;

    const invokeNextRouteHandler = (doSkipRouter = false) => {
      const routerHandlerResult = genRouterHandlers.next();

      if (!doSkipRouter && !routerHandlerResult.done) {
        const handler = routerHandlerResult.value;
        handler(data, remote, invokeNextRouteHandler);

        resolvedCount++;
      }
    };
    invokeNextRouteHandler();

    return resolvedCount > 0;
  };

  const onMessageReceived = (buffer, remote) => {
    /*buffer.length > mtuRecommendedSize
          ? console.warn(
            `${remote.address.toString()}:${remote.port}> ${mtuSizeWarning}`
          )
          : console.log(
            `${remote.address.toString()}:${remote.port}> ${buffer.toString()}`
          );*/

    try {
      const data = JSON.parse(buffer.toString());

      if (
        !data?.action ||
        !routers.reduce(
          (isRouteResolved, router) =>
            resolveRoutes(router, data, remote) || isRouteResolved,
          false
        )
      ) {
        throw `Router: Can not get route "${data?.action}": does not exist`;
      }
    } catch (error) {
      console.error(`Error: ${error}`);

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
    }
  };

  //public functions
  //"socket.send" OVERRIDDEN
  const sendMessage = (message, callback) => {
    for (const { address } of clients.getAll()) {
      socket.send(message, address.port, address.ip, callback);
    }
  };

  const bindEndpoint = (route, handler) =>
    bindEndpointToRouter(defaultRouter, route, handler);

  const run = () => {
    socket
      .onRun(() =>
        callbacks.onRun.invoke({
          address: socketConfig,
        })
      )
      .onReceive(onMessageReceived)
      .run(socketConfig);
  };
  const onRun = (callback, isCritical = false) =>
    callbacks.onRun.add(callback, isCritical);

  //"rootPattern" must start with ["/](static pattern) or [/^\/](RegExp pattern)
  const bindRouter = (rootPattern) => {
    const newRouter = resolve("core/server/router", rootPattern);
    routers.push(newRouter);

    return {
      bindEndpoint: (route, handler) =>
        bindEndpointToRouter(newRouter, route, handler),
      unbindAllEndpoints: () => newRouter.unbindAll(),
    };
  };

  return {
    getClientIds: clients.getAllIds,
    getClients: clients.getAll,
    getClientCount: clients.getCount,
    connectClient: clients.connect,
    disconnectClient: clients.disconnect,
    clearClients: clients.clearAll,

    send: sendMessage,

    bindRouter,
    bindEndpoint,

    run,
    onRun,
  };
};
