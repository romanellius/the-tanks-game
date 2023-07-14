const endpoints = {
  join: "/join",
  leave: "/leave",
};

// TODO: business logic does not need access to such methods as: run, onRun, bindEndpoint and etc..
module.exports = (server) => {
  const stateRouter = server.getStateRouter();

  return {
    handler: () => {
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
