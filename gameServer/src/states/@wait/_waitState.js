const endpoints = {
  join: "/join",
  leave: "/leave",
};

module.exports = ({ stateTransitionTo, server }) => {
  return {
    handler: (router) => {
      server.clearClients();

      router.addErrorHandler((error, { data }) => {
        console.error(
          `Error: Route ${data?.action} throws error:\n${error?.stack}`
        );
      });

      router.bindEndpoint(endpoints.join, ({ remote }) => {
        server.connectClient(
          remote,
          () =>
            //TODO: should stateTransitionTo be hidden inside of the code
            // - maybe move it out to the stateConfig file
            // - or move it to the same level as handler and disposeHandler
            server.getClientCount() === 2 && stateTransitionTo("next")
        );
      });

      router.bindEndpoint(endpoints.leave, ({ remote }) => {
        server.disconnectClient(remote);
      });
    },

    disposeHandler: () => {},
  };
};
