///Transport PROTOCOL Interface///

const udp = require("dgram");

module.exports = () => {
  let udpSocket;

  const init = function (socketType) {
    udpSocket = udp.createSocket(socketType);
    return this;
  };

  const getAddress = () => udpSocket.address();
  const send = (data, port, ip, callback) => {
    udpSocket.send(data, port, ip, callback);
  };
  const onReceive = function (callback) {
    udpSocket.on(
      "message",
      (buffer, remote) => callback && callback(buffer, remote)
    );
    return this;
  };

  const run = (port) => {
    udpSocket.bind(port);
  };
  const onRun = function (callback) {
    udpSocket.on("listening", () => callback && callback());
    return this;
  };
  const onError = function (callback) {
    udpSocket.on("error", (error) => {
      callback ? callback(error) : console.error(String(error));
      udpSocket.close();
    });
    return this;
  };

  const terminate = () => {
    udpSocket.close();
  };
  const onTerminate = function (callback) {
    udpSocket.on("close", () =>
      callback ? callback() : console.warn("\nServer stopped")
    );
    return this;
  };

  return {
    init,

    getAddress,
    send,
    onReceive,

    run,
    onRun,
    onError,

    terminate,
    onTerminate,
  };
};
