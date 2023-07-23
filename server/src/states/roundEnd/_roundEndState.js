const roundEndDelay = 1_000; //3_000;

module.exports = (framework) => {
  const {
    context: { use: useContext, remove: removeContext },
    server,
  } = framework;

  return {
    handler: () => {
      const { worldState } = useContext();

      server.send(
        JSON.stringify({
          action: "roundOnEnd",
          stats: `ROUND STATISTICS: ${
            worldState.timeIsOver ? "time is over" : "time is not over"
          }`,
        })
      );

      setTimeout(() => {
        if (worldState.round === 2) {
          removeContext({ worldState });
          server.stateTransitionTo("next");
        } else {
          server.stateTransitionTo("prev");
        }
      }, roundEndDelay);
    },
  };
};
