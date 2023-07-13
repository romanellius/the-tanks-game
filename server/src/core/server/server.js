///SERVER///

const { resolve } = require("../../libs/iocContainer");

module.exports = (socket, clients, defaultRouter, callbacks, socketConfig) => {
  //init
  const routers = [defaultRouter];

  //private functions
  const tryBindEndpointToRouter = (router, route, handler) => {
    const isBound = router.tryBind(route, handler);

    if (!isBound) {
      console.error(`Error: Route "${route}" is not valid: occupied`);
      socket.terminate();
    }
  };
  const unbindEndpointFromRouter = (router, route) => router.unbind(route);

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
        !routers.some((router) => router.tryInvoke(data, remote))
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

  const tryBindEndpoint = (route, handler) =>
    tryBindEndpointToRouter(defaultRouter, route, handler);
  const unbindEndpoint = (route) =>
    unbindEndpointFromRouter(defaultRouter, route);

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

  const bindRouter = (rootPattern) => {
    const newRouter = resolve("core/server/router", rootPattern);
    routers.push(newRouter);

    return {
      tryBindEndpoint: (route, handler) =>
        tryBindEndpointToRouter(newRouter, route, handler),
      unbindEndpoint: (route) => unbindEndpointFromRouter(newRouter, route),
      unbindAllEndpoints: () => newRouter.unbindAll(),
    };
  };

  return {
    //getAddress: socket.getAddress,

    getClientIds: clients.getAllIds,
    getClients: clients.getAll,
    getClientCount: clients.getCount,
    connectClient: clients.connect,
    disconnectClient: clients.disconnect,
    clearClients: clients.clearAll,

    send: sendMessage,

    tryBindEndpoint,
    unbindEndpoint,

    run,
    onRun,

    bindRouter,
  };
};
