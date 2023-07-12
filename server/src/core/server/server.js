///SERVER///

const { resolve } = require("../../libs/iocContainer");

module.exports = (socket, clients, defaultRouter, callbacks, socketConfig) => {
  //init
  const routers = [defaultRouter];

  //public functions
  //"socket.send" OVERRIDDEN
  const send = (message, callback) => {
    for (const { address } of clients.getAll()) {
      socket.send(message, address.port, address.ip, callback);
    }
  };

  const tryBindEndpoint = (route, handler) => {
    const isBound = defaultRouter.tryBind(route, handler);

    if (!isBound) {
      console.error(`Error: Route "${route}" is not valid: occupied`);
      socket.terminate();
    }
  };
  const unbindEndpoint = (route) => defaultRouter.unbind(route);

  const run = () => {
    socket
      .onRun(() =>
        callbacks.onRun.invoke({
          address: socketConfig,
        })
      )
      .onReceive((buffer, remote) => {
        /*buffer.length > mtuRecommendedSize
          ? console.warn(
            `${remote.address.toString()}:${remote.port}> ${mtuSizeWarning}`
          )
          : console.log(
            `${remote.address.toString()}:${remote.port}> ${buffer.toString()}`
          );*/

        try {
          const data = JSON.parse(buffer.toString());

          //ensure data.action starts with "/"
          if (
            data?.action &&
            typeof data.action === "string" &&
            !data.action.startsWith("/")
          ) {
            data.action = `/${data.action}`;
          }

          if (
            !routers.some((router) =>
              router.tryInvoke(data?.action, data, remote)
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
      })
      .run(socketConfig);
  };
  const onRun = (callback, isCritical = false) =>
    callbacks.onRun.add(callback, isCritical);

  const bindRouter = (rootPattern) => {
    const newRouter = resolve("core/server/router", rootPattern);
    routers.push(newRouter);

    //testing routers
    // {
    //   const routers = {
    //     withStaticRootPattern: {},
    //     withDynamicRootPattern: [],
    //   };

    //   if (isPatternDynamic(rootPattern)) {
    //     routers.withDynamicRootPattern.push(newRouter);
    //   } else {
    //     if (!routers.withStaticRootPattern[rootPattern]) {
    //       routers.withStaticRootPattern[rootPattern] = [];
    //     }
    //     routers.withStaticRootPattern[rootPattern].push(newRouter);
    //   }

    //   //
    // }

    //TODO: reuse these two functions' code (bind, unbind)
    return {
      tryBindEndpoint: (route, handler) => {
        const isBound = newRouter.tryBind(route, handler);

        if (!isBound) {
          console.error(`Error: Route "${route}" is not valid: occupied`);
          socket.terminate();
        }
      },
      unbindEndpoint: (route) => newRouter.unbind(route),
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

    send,

    tryBindEndpoint,
    unbindEndpoint,

    run,
    onRun,

    bindRouter,
  };
};
