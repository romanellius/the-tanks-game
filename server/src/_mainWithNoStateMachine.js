///ENTRY POINT///

const { resolve } = require("./libs/iocContainer");

const app = resolve("core/frameworkBuilder");
const flattenAddress = resolve("helpers/flattenAddress");

app
  .onRun(({ address }) => {
    const { ip, port, type } = address;
    console.log(`Server running on ${ip}:${port} (${type})\n`);
  })
  //invokes on J,T
  .bindEndpoint("", (data, remote, next) => {
    console.log(`Root logger: ${data?.action}`);

    const server = resolve("core/frameworkInterface");
    server.connectClient(remote);

    next();
  });

//invokes on J,T
const apiRouter = app.bindRouter(/^\/api\//);
apiRouter.bindEndpoint(null, (data, _, next) => {
  console.log(`API logger: ${data?.action}`);
  next();
});

//invokes only on J
const stateRouter = app.bindRouter("/api/join");
stateRouter.bindEndpoint(/(?:)/, (data, _, next) => {
  console.log(`STATE logger: ${data?.action}`);
  next();
});

//invokes on J,T
app
  .bindEndpoint(undefined, (_, remote) => {
    const server = resolve("core/frameworkInterface");
    server.send(`Hello, ${flattenAddress(remote)}!`, (error) =>
      error
        ? console.error(`Error: Message not sent to ${flattenAddress(remote)}`)
        : console.log(`Message sent to ${flattenAddress(remote)}`)
    );
    server.disconnectClient(remote);
  })
  .run();
