module.exports = (server) => ({
  handler: () => {
    server.send(
      JSON.stringify({ action: "gameEnd", stats: "GAME STATISTICS" }),
      (error) => {
        error && console.error(`Error: ${error}`);
      }
    );
    server.stateTransitionTo("next");
  },
});
