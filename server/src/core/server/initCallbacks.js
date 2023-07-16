///CALLBACKS Handling///

module.exports = () => {
  const allCallbacks = {
    onRun: { main: [], extensions: [] },
    /*ticks: [],*/
  };

  return {
    onRun: {
      invoke: (config) => {
        const { main, extensions } = allCallbacks.onRun;
        main.concat(extensions).forEach((callback) => callback(config));
      },
      /*callbacks.ticks.forEach(({ interval, handler }) =>
        setInterval(handler, interval)
      );*/
      add: (callback) => {
        allCallbacks.onRun.main.push(callback);
      },
      addExtensions: (callbacks) => {
        callbacks.forEach((callback) =>
          allCallbacks.onRun.extensions.push(callback)
        );
      },
      /*const addTick = (interval, handler) => {
        callbacks.ticks.push({ interval, handler });
      },*/
    },
  };
};
