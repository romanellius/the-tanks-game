const roundEndDelay = 3_000;

module.exports = (server) => ({
  handler: () => {
    server.send(
      JSON.stringify({ action: "roundOnEnd", stats: "ROUND STATISTICS" }),
      (error) => {
        error && console.error(`Error: ${error}`);
      }
    );

    setTimeout(() => {
      server.stateTransitionTo(
        global._worldState.round === 2 ? "next" : "prev"
      );
    }, roundEndDelay);
  },
});
