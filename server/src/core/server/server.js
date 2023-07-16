///SERVER///

const { resolve } = require("../../libs/iocContainer");

module.exports = (
  socket,
  clients,
  defaultRouter,
  initCallbacks,
  socketConfig
) => {
  //init
  const routers = [defaultRouter];

  //private functions
  const bindEndpointToRouter = (router, route, handler) =>
    router.bind(route, handler);

  const onMessageReceived = (buffer, remote) => {
    /*buffer.length > mtuRecommendedSize
          ? console.warn(
            `${flattenAddress(remote)}> ${mtuSizeWarning}`
          )
          : console.log(
            `${flattenAddress(remote)}> ${buffer.toString()}`
          );*/

    try {
      const data = JSON.parse(buffer.toString());

      if (
        !data?.action ||
        !routers.reduce(
          (isPathResolved, router) =>
            router.invoke(data, remote) || isPathResolved,
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
      socket.send(message, address.port, address.ip, (error) => {
        callback && callback(error);

        error && socket.terminate();
      });
    }
  };

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
  //"route" must start with ["/](static pattern) or [/\/](RegExp pattern)
  const bindEndpoint = (route, handler) =>
    bindEndpointToRouter(defaultRouter, route, handler);

  const run = () => {
    socket
      .onReceive(onMessageReceived)
      .onRun(() =>
        initCallbacks.onRun.invoke({
          address: socketConfig,
        })
      )
      .onError()
      .onTerminate()
      .run(socketConfig);
  };
  const onRun = (callback) => initCallbacks.onRun.add(callback);
  const onRunExtensions = (callbacks) =>
    initCallbacks.onRun.addExtensions(callbacks);

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
    onRunExtensions,
  };
};
