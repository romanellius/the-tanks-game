///ENTRY POINT///

const iocConfig = require("./iocConfig");
const { resolve } = require("../../theIocContainer")(iocConfig);

const flattenAddress = resolve("helpers/flattenAddress");

const config = resolve("config");
const app = resolve("theFramework", config);

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

//second framework instance
const app2 = resolve("theFramework", {
  port: 5555,
  type: "udp4",
});

app2
  .onRun(({ address }) => {
    const { ip, port, type } = address;
    console.log(`Server2 running on ${ip}:${port} (${type})\n`);
  })
  .bindEndpoint(null, ({ data }) => {
    console.log(`Logger2: ${data?.action}`);
  })
  .addErrorHandler((error, { data }) => {
    console.error(`Error2: Route ${data?.action} throws error: ${error}`);
  })
  .run();
