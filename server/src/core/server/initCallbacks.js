///CALLBACKS Handling///

module.exports = () => {
  const callbacks = {
    onRun: [],
    /*ticks: [],*/
  };

  return {
    onRun: {
      invoke: (config) =>
        callbacks.onRun.forEach((callback) => callback(config)),
      /*callbacks.ticks.forEach(({ interval, handler }) =>
      setInterval(handler, interval)
    );*/
      add: (callback, isCritical) => {
        isCritical
          ? callbacks.onRun.unshift(callback)
          : callbacks.onRun.push(callback);
      },
      addAll: (initCallbacks) => {
        initCallbacks.forEach((callback) => callbacks.onRun.push(callback));
      },
      /*const addTick = (interval, handler) => {
      callbacks.ticks.push({ interval, handler });
    },*/
    },
  };
};
