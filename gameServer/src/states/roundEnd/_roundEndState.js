const roundEndDelay = 1_000; //3_000;

module.exports = (framework) => {
  const {
    context: { use: useContext, remove: removeContext },
    server,
  } = framework;

  return {
    handler: ({ stateTransitionTo }) => {
      const { worldState } = useContext();

      server.broadcast(
        JSON.stringify({
          action: "roundOnEnd",
          stats: `ROUND STATISTICS: ${
            worldState.timeIsOver ? "time is over" : "time is not over"
          }`,
        })
      );

      setTimeout(() => {
        if (worldState.round === 1) {
          removeContext({ worldState });
          stateTransitionTo("next");
        } else {
          stateTransitionTo("prev");
        }
      }, roundEndDelay);
    },
  };
};
