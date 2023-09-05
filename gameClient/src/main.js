const udp = require("dgram");
const { Buffer } = require("buffer");
const { port: defaultPort, type } =
  require("../../shared").constants.SERVER_CONFIG;

const port = process.argv[2];
console.log(port);

const client = udp.createSocket(type);

client.on("connect", () => {
  //unblocks process from exiting
  client.unref();

  const { port, address } = client.remoteAddress();
  console.log(`Client connected to ${address}:${port}\n`);

  console.log(`Map example:\n
--------|◄►|▓▓▓▓---- 
--------|▼▼|▓▓▓▓---- 0
--------|▼▼|▓▓▓▓---- 0
--------|▼▼|▓▓▓▓---- 
----####████####---- 
----#  #████#  #---- 1
----#  #████#  #---- 1
----####████####---- 
----▓▓▓▓    ▓▓▓▓---- 
----▓▓▓▓ $$ ▓▓▓▓---- 2
----▓▓▓▓ $$ ▓▓▓▓---- 2
----▓▓▓▓    ▓▓▓▓---- 
----####████####---- 
----#  #████#  #---- 3
----#  #████#  #---- 3
----####████####/\\|| 
---<=▓▓▓|▲▲|----||\\/ 
---<=▓▓▓|▲▲|-------- 4
---=>▓▓▓|▲▲|-------- 4
---=>▓▓▓|◄►|-------- 

 00  11  22  33  44
\n`);

  /*
  ///
  /**
  * Do stuff and exit the process
  * @param {NodeJS.SignalsListener} signal
  */
  /*
  function exitHandler(options, exitCode) {
    client.send(
      Buffer.from(JSON.stringify({ action: "disconnect" })),
      (error) => {
        client.disconnect();
      }
    );
  }
  //app is closing
  process.on("exit", exitHandler({ cleanup: true }));
  //catches ctrl+c event
  process.on("SIGINT", exitHandler({ exit: true }));
  process.on('SIGTERM', exitHandler({ exit: true }))
  process.on('SIGQUIT', exitHandler({ exit: true }))
  // catches "kill pid"
  process.on("SIGUSR1", exitHandler({ exit: true }));
  // catches "kill pid"
  process.on("SIGUSR2", exitHandler({ exit: true }));
  //catches uncaught exceptions
  process.on("uncaughtException", (error, origin) => exitHandler({ error, exit: true }));
  */

  /*
  ///
  const buffer = Buffer.from(JSON.stringify({ action: "connect" }));
  client.send(buffer, (error) => {
    if (error) {
      return client.close();
    }
    console.log(`< ${buffer.toString()}`);
  });
  */

  ///
  const stdin = process.openStdin();
  stdin.addListener("data", (data) => {
    const input = data.toString().trim();

    let move = "";
    let isFire = false;
    let action = "update";

    switch (input) {
      case "u":
        move = "up";
        break;
      case "d":
        move = "down";
        break;
      case "l":
        move = "left";
        break;
      case "r":
        move = "right";
        break;
      case "f":
        isFire = true;
        break;
      case "j":
        action = "api/join";
        break;
      case "t":
        action = "api/test";
        break;
      default:
        return;
    }

    const buffer = Buffer.from(JSON.stringify({ action, move, isFire }));
    client.send(buffer, (error) => {
      if (error) {
        return client.close();
      }
      console.log(`< ${buffer.toString()}\n`);
    });
  });

  /*
  ///
  setInterval(ping, 30_000);
  function ping() {
    const buffer = Buffer.from(JSON.stringify({ action: "ping" }));
    client.send(buffer, (error) => {
      if (error) {
        return client.close();
      }
      console.log(`< ${buffer.toString()}`);
    });
  }
  */
});

client.on("error", (error) => {
  console.error(`Error: ${error}`);
  client.close();
});

client.on("message", (buffer, remote) => {
  /*buffer.length > mtu_recommended_size
    ? console.warn(mtu_size_warning)
    : console.log(`> ${buffer.toString()}`);*/

  console.log(`> ${buffer.toString()}\n`);

  /*
  JSON.parse(string, (_, value) => {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  });
  */
});

client.connect(port ?? defaultPort);

//wait for active world state
//remember own inputs
//send inputs on own tick event
//wait for changing world state
//update GUI
