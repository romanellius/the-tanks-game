const dns = require("dns");

const endpoints = {
  join: "/join",
  leave: "/leave",
  end: "/end",
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
        server.connectClient(remote, () => {
          //FIXME: move stateTransitionTo from module's parameters to handler's parameters
          // (disposeHandler do not need to make state transitions)

          //TODO: should stateTransitionTo be hidden inside of the code
          // - maybe move it out to the stateConfig file
          // - or move it to the same level as handler and disposeHandler
          // { on 'condition' -> 'state transition' using 'input' symbol }
          if (server.getClientCount() === 2) {
            if (!stateTransitionTo("next")) {
              throw "State '@wait': can not transit to the next state";
            }

            //these should throw an exception
            // router.bindEndpoint();
            // stateTransitionTo();
          }
        });
      });

      router.bindEndpoint(endpoints.leave, ({ remote }) => {
        server.disconnectClient(remote);
      });

      router.bindEndpoint(endpoints.end, ({ remote }) => {
        dns.lookup(remote.address, (error, resolvedAddress) => {
          if (error) {
            console.warn(
              `State '@wait': can not resolve "${remote.address}" address: ${error}`
            );
          }

          if (
            //check for ipv6 too?
            resolvedAddress === "127.0.0.1" ||
            remote.address === "127.0.0.1"
          ) {
            if (!stateTransitionTo("prev")) {
              throw "State '@wait': can not transit to the final state";
            }
          }
        });
      });
    },

    disposeHandler: () => {},
  };
};
