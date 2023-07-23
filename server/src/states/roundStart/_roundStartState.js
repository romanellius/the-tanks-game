let roundNumber = 0;
const roundStartDelay = 1_000; //3_000;

const generateWorld = (server) => {
  const playerAddresses = server.getClientIds();
  const size = 5;
  const maxBrickHealth = 100;
  const mapConfig = {
    "0:3": { type: "brick", health: maxBrickHealth },
    "1:1": { type: "forest" },
    "1:2": { type: "concrete" },
    "1:3": { type: "forest" },
    "2:1": { type: "brick", health: maxBrickHealth },
    "2:3": { type: "brick", health: maxBrickHealth },
    "3:1": { type: "forest" },
    "3:2": { type: "concrete" },
    "3:3": { type: "forest" },
    "4:1": { type: "brick", health: maxBrickHealth },
  };

  const map = [...Array(size)].map((_) => Array(size).fill(""));
  for (const [key, value] of Object.entries(mapConfig)) {
    const [i, j] = key.split(":");
    map[i][j] = value;
  }

  const flag = { x: 2, y: 2 };

  const players = new Map([
    [
      playerAddresses[0],
      {
        enemy: playerAddresses[1],
        position: { x: 0, y: 2 },
        direction: "down",
      },
    ],
    [
      playerAddresses[1],
      {
        enemy: playerAddresses[0],
        position: { x: 4, y: 2 },
        direction: "up",
      },
    ],
  ]);

  return {
    round: roundNumber++ % 3,
    map,
    flag,
    players,
    projectiles: new Map(),
  };
};

module.exports = (framework) => {
  const { iocContainer, context, server } = framework;
  const stringifyWithMap = iocContainer.resolve("helpers/stringifyWithMap");

  return {
    handler: () => {
      const worldState = generateWorld(server);
      if (context.has({ worldState }) === true) {
        context.update({ worldState });
      } else {
        context.add({ worldState });
      }

      server.send(
        stringifyWithMap({
          action: "roundOnRun",
          state: worldState,
        })
      );

      setTimeout(() => {
        server.stateTransitionTo("next");
      }, roundStartDelay);
    },
  };
};
