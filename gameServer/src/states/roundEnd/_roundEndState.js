const roundEndDelay = 1_000; //3_000;

module.exports = (framework) => {
  const {
    context: { use: useContext, remove: removeContext },
    server,
    stateTransitionTo,
  } = framework;

  return {
    handler: () => {
      stateTransitionTo = (input) => {
        if (!stateTransitionTo(input)) {
          throw "State 'round_end': can not transit to the next state";
        }
      };

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
