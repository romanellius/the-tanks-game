module.exports = ({ server }) => ({
  handler: ({ stateTransitionTo }) => {
    server.send(
      JSON.stringify({ action: "gameEnd", stats: "GAME STATISTICS" })
    );

    stateTransitionTo("next");
  },
});
