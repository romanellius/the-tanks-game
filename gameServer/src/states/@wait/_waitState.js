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
    },

    disposeHandler: () => {},
  };
};

//FIXME: add final state
