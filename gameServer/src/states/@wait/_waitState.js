const dns = require("dns");

const endpoints = {
  join: "/join",
  leave: "/leave",
  end: "/end",
};

module.exports = ({ server }) => {
  return {
    handler: ({ router, stateTransitionTo }) => {
      server.clearClients();

      router.addErrorHandler((error, { data }) => {
        console.error(
          `Error: Route ${data?.action} throws error:\n${error?.stack}`
        );
      });

      router.bindEndpoint(endpoints.join, ({ remote }) => {
        server.connectClient(remote, () => {
          server.getClientCount() === 2 && stateTransitionTo("next");
        });
      });

      router.bindEndpoint(endpoints.leave, ({ remote }) => {
        server.disconnectClient(remote);
      });

      router.bindEndpoint(endpoints.end, ({ remote }) => {
        const lookupOptions = {
          family: 4,
        };

        dns.lookup(remote.address, lookupOptions, (error, resolvedAddress) => {
          if (error) {
            console.warn(
              `State '@wait': can not resolve "${remote.address}" address: ${error}`
            );
          }

          resolvedAddress ??= remote.address;
          resolvedAddress === "127.0.0.1" && stateTransitionTo("final");
        });
      });
    },

    disposeHandler: () => {},
  };
};
