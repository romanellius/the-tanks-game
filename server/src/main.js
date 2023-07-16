///ENTRY POINT///

const { resolve } = require("./libs/iocContainer");
const app = resolve("core/frameworkBuilder");

app
  .onRun(({ address }) => {
    const { ip, port, type } = address;
    console.log(`Server running on ${ip}:${port} (${type})\n`);
  })
  .useStateMachine(/^\/api/)
  .bindEndpoint(/^\//, (data, _, next) => {
    console.log(`Logger: ${data?.action}`);
    next();
  })
  .run();

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
