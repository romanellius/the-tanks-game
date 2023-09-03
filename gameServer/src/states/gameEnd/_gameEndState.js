module.exports = ({ server }) => ({
  handler: () => {
    server.send(
      JSON.stringify({ action: "gameEnd", stats: "GAME STATISTICS" })
    );
    server.stateTransitionTo("next");
  },
});
