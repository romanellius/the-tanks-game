///ENTRY POINT///

const iocConfig = require("./iocConfig");
const theStateMachine = require("../../theStateMachine");
const { resolve } = require("../../theIocContainer")(iocConfig);

const config = resolve("config");
const app = resolve("theFramework", config);

app
  .onRun(({ address }) => {
    const { ip, port, type } = address;
    console.log(`Server running on ${ip}:${port} (${type})\n`);
  })
  .useExtension(theStateMachine, /^\/api/)
  .bindEndpoint(/^\//, ({ data }, next) => {
    console.log(`Logger: ${data?.action}`);
    next();
  })
  .addErrorHandler((error, { data }) => {
    console.error(`Error: Route ${data?.action} throws error: ${error}`);
  });

//request not handled properly
app
  .bindRouter(/^\//)
  .bindEndpoint(null, ({ data }) => {
    console.error(`Warning: Route ${data?.action} is not handled`);
  })
  .addErrorHandler((error, _, next) => {
    next(error);
  });

app.run();

/*.bindRoute("ping", (_, remote) => {
  server.updateClient(remote);
})*/
/*.tick(1_000, () => {
  const buffer = Buffer.from("tick");
  server.clients.forEach((_, key) => {
    const { ip, port } = JSON.parse(key);
    server.send(buffer, port, ip, (error) => {
      if (error) {
        return server.close();
      }
      console.log(`${ip}:${port}< ${buffer.toString()}`);
    });
  });
})*/
/*.tick(10_000, () => {
  server.clients.forEach((value, key) => {
    new Date() - value >= 30_000 && server.clients.delete(key);
  });
})*/
