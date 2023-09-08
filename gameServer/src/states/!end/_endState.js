module.exports = ({ server }) => ({
  handler: () => {
    //CLEANUP here
    server.stop();
  },
});
