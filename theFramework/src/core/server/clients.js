///CLIENTS Handling///

module.exports = (flattenAddress) => {
  const connectedClients = new Map();

  const getCount = () => connectedClients.size;
  const getKeys = () => [...connectedClients.keys()];
  const getValues = () => connectedClients.values();
  const addClient = (remote, callback) => {
    const address = flattenAddress(remote);
    const doAddressExist = connectedClients.has(address);

    if (!doAddressExist) {
      connectedClients.set(address, {
        address: { ip: remote.address.toString(), port: remote.port },
      });
    }

    callback && callback(doAddressExist);
  };
  const removeClient = (remote, callback) => {
    const address = flattenAddress(remote);
    const doAddressExist = connectedClients.has(address);

    if (doAddressExist) {
      connectedClients.delete(address);
    }

    callback && callback(!doAddressExist);
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
