const endpoints = {
  join: "/join",
  leave: "/leave",
};

module.exports = ({ server }) => {
  return {
    handler: (router) => {
      server.clearClients();

      router.addErrorHandler((error, data) => {
        console.error(
          `Error: Route ${data?.action} throws error:\n${error?.stack}`
        );
      });

      router.bindEndpoint(endpoints.join, (_, remote) => {
        server.connectClient(
          remote,
          () =>
            //TODO: should stateTransitionTo be hidden inside of the code
            // - maybe move it out to the stateConfig file
            // - or move it to the same level as handler and disposeHandler
            server.getClientCount() === 2 && server.stateTransitionTo("next")
        );
      });

      router.bindEndpoint(endpoints.leave, (_, remote) => {
        server.disconnectClient(remote);
      });
    },

    disposeHandler: () => {},
  };
};

//TODO: start here when others are fixed
