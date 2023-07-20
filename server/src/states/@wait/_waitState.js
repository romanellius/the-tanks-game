const endpoints = {
  join: "/join",
  leave: "/leave",
};

module.exports = (server) => {
  return {
    handler: (stateRouter) => {
      server.clearClients();

      stateRouter.bindEndpoint(endpoints.join, (_, remote) => {
        server.connectClient(
          remote,
          () =>
            server.getClientCount() === 2 && server.stateTransitionTo("next")
        );
      });

      stateRouter.bindEndpoint(endpoints.leave, (_, remote) => {
        server.disconnectClient(remote);
      });
    },

    disposeHandler: () => {},
  };
};
