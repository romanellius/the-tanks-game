const times = require("lodash.times");
const forEach = require("lodash.foreach");

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

  const map = times(size, () => Array(size).fill(""));
  forEach(mapConfig, (value, key) => {
    const [i, j] = key.split(":");
    map[i][j] = value;
  });

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
    round: roundNumber++ % 2,
    map,
    flag,
    players,
    projectiles: new Map(),
  };
};

module.exports = (framework) => {
  const {
    context,
    server,
    refs: { resolveDependency },
  } = framework;

  const stringifyWithMap = resolveDependency("helpers/stringifyWithMap");

  return {
    handler: ({ stateTransitionTo }) => {
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
        if (!stateTransitionTo("next")) {
          throw "State 'round_start': can not transit to the next state";
        }
      }, roundStartDelay);
    },
  };
};
