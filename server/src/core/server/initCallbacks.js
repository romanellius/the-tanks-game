///CALLBACKS Handling///

module.exports = () => {
  //init
  const allCallbacks = {
    onRun: { main: [], extensions: [] },
    /*ticks: [],*/
  };

  //public functions
  const invoke = (config) => {
    const { main, extensions } = allCallbacks.onRun;
    const allOnRunCallbacks = main.concat(extensions);

    allOnRunCallbacks.forEach((callback) => callback(config));
    /*allCallbacks.ticks.forEach(({ interval, handler }) =>
      setInterval(handler, interval)
    );*/
  };

  const addDefault = (callback) => {
    allCallbacks.onRun.main.push(callback);
  };

  const addExtensions = (callbacks) => {
    callbacks.forEach((callback) =>
      allCallbacks.onRun.extensions.push(callback)
    );
  };

  /*const addTick = (interval, handler) => {
    allCallbacks.ticks.push({ interval, handler });
  },*/

  return {
    onRun: {
      invoke,
      add: addDefault,
      addExtensions,
    },
  };
};
