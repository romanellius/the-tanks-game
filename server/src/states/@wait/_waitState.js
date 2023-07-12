const endpoints = {
  join: "/join",
  leave: "/leave",
  test: /^\/api\/v1\/[a-zA-Z0-9]*user[a-zA-Z0-9]*\/?\d*$/i,
};

// TODO: business logic does not need access to such methods as: run, onRun, etc..
module.exports = (server) => {
  const stateRouter = server.getStateRouter();

  return {
    handler: () => {
      server.clearClients();

      stateRouter.tryBindEndpoint(endpoints.join, (_, remote) => {
        server.connectClient(
          remote,
          () =>
            server.getClientCount() === 2 && server.stateTransitionTo("next")
        );
      });

      stateRouter.tryBindEndpoint(endpoints.leave, (_, remote) => {
        server.disconnectClient(remote);
      });

      server.tryBindEndpoint(endpoints.test, () =>
        console.log("TEST ENDPOINT INVOKED")
      );
    },

    disposeHandler: () => {
      server.unbindEndpoint(endpoints.test);
    },
  };
};
