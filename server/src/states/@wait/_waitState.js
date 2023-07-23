const endpoints = {
  join: "/join",
  leave: "/leave",
};

module.exports = ({ server }) => {
  return {
    handler: (router) => {
      server.clearClients();

      router.bindEndpoint(endpoints.join, (_, remote) => {
        server.connectClient(
          remote,
          () =>
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
