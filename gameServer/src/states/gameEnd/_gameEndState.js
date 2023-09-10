module.exports = ({ server }) => ({
  handler: ({ stateTransitionTo }) => {
    server.send(
      JSON.stringify({ action: "gameEnd", stats: "GAME STATISTICS" })
    );

    if (!stateTransitionTo("next")) {
      throw "State 'game_end': can not transit to the next state";
    }
  },
});
