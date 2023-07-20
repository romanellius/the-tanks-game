const roundEndDelay = 1_000; //3_000;

module.exports = (server) => ({
  handler: () => {
    server.send(
      JSON.stringify({ action: "roundOnEnd", stats: "ROUND STATISTICS" })
    );

    setTimeout(() => {
      server.stateTransitionTo(
        global._worldState.round === 2 ? "next" : "prev"
      );
    }, roundEndDelay);
  },
});
