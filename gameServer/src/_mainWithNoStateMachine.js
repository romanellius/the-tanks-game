///ENTRY POINT///

const { resolve } = require("./libs/iocContainer");

const flattenAddress = resolve("helpers/flattenAddress");
const appBuilder = resolve("theFramework");
const app = appBuilder.build(false);

app
  .onRun(({ address }) => {
    const { ip, port, type } = address;
    console.log(`Server running on ${ip}:${port} (${type})\n`);
  })
  //invokes on J,T,*
  .bindEndpoint("", ({ data, remote }, next, server) => {
    console.log(`Root logger: ${data?.action}`);
    server.connectClient(remote);

    next();
  })
  .addErrorHandler((error, { data }, next) => {
    console.error(
      `Root error: Route ${data?.action} throws error:\n${error?.stack}`
    );
    next(error);
  });

//invokes on J,T
app.bindRouter(/^\/api\//).bindEndpoint(null, ({ data }, next) => {
  console.log(`API logger: ${data?.action}`);
  next();
});

//invokes only on J
app
  .bindRouter("/api/join")
  .bindEndpoint(/(?:)/, ({ data }, next) => {
    console.log(`STATE logger: ${data?.action}`);
    next();
  })
  .addErrorHandler((error, { data }) => {
    console.error(
      `STATE error: Route ${data?.action} throws error:\n${error?.stack}`
    );
  });

//invokes on J,T,*
app
  .bindRouter(/^\/.*/)
  .bindEndpoint(/\/.*/, ({ remote }, _, server) => {
    server.send(`Hello, ${flattenAddress(remote)}!`, (error) =>
      error
        ? console.error(`Error: Message not sent to ${flattenAddress(remote)}`)
        : console.log(`Message sent to ${flattenAddress(remote)}`)
    );
    server.disconnectClient(remote);
  })
  .addErrorHandler((error, { data }, _, server) => {
    _ = server.getClientCount();
    console.error(
      `Error: Route ${data?.action} throws error:\n${error?.stack}`
    );
  });

//request not handled properly
app.bindRouter(/^\//).bindEndpoint(null, ({ data }) => {
  console.error(`Warning: Route ${data?.action} is not handled`);
});

app.run();
