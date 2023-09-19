module.exports = ({ server }) => ({
  handler: ({ stateTransitionTo }) => {
    server.broadcast(
      JSON.stringify({ action: "gameEnd", stats: "GAME STATISTICS" })
    );

    server.broadcast("You are disconnected!");

    stateTransitionTo("next");
  },
});
