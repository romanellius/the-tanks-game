const dns = require("dns");

const endpoints = {
  join: "/join",
  leave: "/leave",
  end: "/end",
};

module.exports = ({ server }) => {
  let serverStopTimerId;

  return {
    handler: ({ router, stateTransitionTo }) => {
      server.clearClients();

      router.addErrorHandler((error, { data }) => {
        console.error(
          `Error: Route ${data?.action} throws error:\n${error?.stack}`
        );
      });

      router.bindEndpoint(endpoints.join, ({ remote }) => {
        if (server.getClientCount() < 2) {
          server.connectClient(remote, (isError) => {
            if (!isError) {
              server.send("You are connected!", remote.address, remote.port);
              server.getClientCount() === 2 && stateTransitionTo("next");
            }
          });
        }
      });

      router.bindEndpoint(endpoints.leave, ({ remote }) => {
        server.disconnectClient(remote, (isError) => {
          if (!isError) {
            server.send("You are disconnected!", remote.address, remote.port);
          }
        });
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

          if ((resolvedAddress ?? remote.address) === "127.0.0.1") {
            server.broadcast("You are disconnected!");

            serverStopTimerId = setTimeout(() => {
              stateTransitionTo("final");
            }, 1_000);
          }
        });
      });
    },

    disposeHandler: () => {
      clearTimeout(serverStopTimerId);
    },
  };
};
