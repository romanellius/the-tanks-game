///CLIENTS Handling///

module.exports = () => {
  const connectedClients = new Map();

  const getCount = () => connectedClients.size;
  const getKeys = () => [...connectedClients.keys()];
  const getValues = () => connectedClients.values();
  const addClient = (remote, callback) => {
    connectedClients.size < 2 &&
      connectedClients.set(
        // FIXME: remove with concatenation?
        JSON.stringify({
          ip: remote.address.toString(),
          port: remote.port,
        }),
        { address: { ip: remote.address.toString(), port: remote.port } }
      );

    callback && callback();
  };
  const removeClient = (remote, callback) => {
    connectedClients.delete(
      JSON.stringify({
        ip: remote.address.toString(),
        port: remote.port,
      })
    );

    callback && callback();
  };
  /*const updateClient = (remote) => {
        connectedClients.has(
          JSON.stringify({
            ip: remote.address.toString(),
            port: remote.port,
          })
        ) &&
          connectedClients.set(
            JSON.stringify({
              ip: remote.address.toString(),
              port: remote.port,
            }),
            new Date()
          );
    },*/
  const clearClients = () => {
    connectedClients.clear();
  };

  return {
    getAllIds: getKeys,
    getAll: getValues,
    getCount,

    connect: addClient,
    disconnect: removeClient,

    clearAll: clearClients,
  };
};
