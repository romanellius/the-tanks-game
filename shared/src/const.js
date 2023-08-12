module.exports = {
  SERVER_CONFIG: {
    ip: "0.0.0.0",
    port: 4444,
    type: "udp4",
  },

  MTU: {
    mtuRecommendedSize: 508,
    mtuSizeWarning: "ERROR: Package body size is above the limit [>508 bytes]",
  },
};
