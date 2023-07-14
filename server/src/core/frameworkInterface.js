///Framework: INTERFACE ABSTRACTION///

module.exports = (server) => {
  const {
    getClientIds,
    getClients,
    getClientCount,
    connectClient,
    disconnectClient,
    clearClients,
    send,
  } = server;

  return {
    getClientIds,
    getClients,
    getClientCount,
    connectClient,
    disconnectClient,
    clearClients,
    send,
  };
};
