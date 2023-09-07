module.exports = ({ stateTransitionTo, server }) => ({
  handler: () => {
    server.send(
      JSON.stringify({ action: "gameEnd", stats: "GAME STATISTICS" })
    );
    stateTransitionTo("next");
  },
});
