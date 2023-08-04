const flattenAddress = require("../../libs/addressHelper").toString;

let localWorldState;

const tickRate = 1;
const tickInterval = 1_000 / tickRate;
const roundLimitTime = 3_000; //30_000;
let tickId, roundTimerId;
let projectileId = 0;
const damage = 50;

const playerSpeedInCellsPerSecond = 0.25; //max=tickRate
const playerMovePerTick = playerSpeedInCellsPerSecond / tickRate;
const projectileSpeedInCellsPerSecond = 0.5; //max=tickRate && min=playerSpeedInCellsPerSecond
const projectileMovePerTick = projectileSpeedInCellsPerSecond / tickRate;

const clientsData = new Map();

const getDistance = ({ x: x1, y: y1 }, { x: x2, y: y2 }) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

const checkCapture = (address, position) => {
  const isCaptured = getDistance(position, localWorldState.flag) <= 0.5;
  if (isCaptured) {
    localWorldState.captured = address;
    server.stateTransitionTo("next");
  }
};

const checkKill = (address, position) => {
  const isKilled =
    getDistance(
      position,
      localWorldState.players.get(localWorldState.players.get(address).enemy)
        .position
    ) <= 0.5;
  if (isKilled) {
    localWorldState.killer = address;
    server.stateTransitionTo("next");
  }
};

const createProjectile = (address, position, move) => {
  localWorldState.projectiles.set(projectileId++, { address, position, move });
};

const checkProjectileCollision = ({ x, y }) => {
  if (x >= 4.5 || y >= 4.5 || x <= -0.5 || y <= -0.5) {
    return true;
  }

  x = x - Math.floor(x) > Math.ceil(x) - x ? Math.ceil(x) : Math.floor(x);
  y = y - Math.floor(y) > Math.ceil(y) - y ? Math.ceil(y) : Math.floor(y);

  if (localWorldState.map[x][y]) {
    if (localWorldState.map[x][y].type === "brick") {
      if (localWorldState.map[x][y].health - damage <= 0) {
        localWorldState.map[x][y] = "";
      } else {
        localWorldState.map[x][y].health -= damage;
      }
      return true;
    } else {
      return localWorldState.map[x][y].type === "concrete";
    }
  } else {
    return false;
  }
};

const moveProjectile = (id, x, y, move) => {
  const newPosition = { x, y };
  switch (move) {
    case "right": {
      newPosition.y += projectileMovePerTick;
      break;
    }
    case "left": {
      newPosition.y -= projectileMovePerTick;
      break;
    }
    case "top": {
      newPosition.x -= projectileMovePerTick;
      break;
    }
    case "down": {
      newPosition.x += projectileMovePerTick;
      break;
    }
  }

  if (checkProjectileCollision(newPosition)) {
    localWorldState.projectiles.delete(id);
  } else {
    const tempProj = localWorldState.projectiles.get(id);
    tempProj.position = newPosition;
    localWorldState.projectiles.set(id, tempProj);
  }

  return newPosition;
};

const checkPlayerCollision = (oldPos, pos, enemyPos) => {
  if (pos.x > 4 || pos.y > 4 || pos.x < 0 || pos.y < 0) {
    return oldPos;
  }

  if (getDistance(pos, enemyPos) < 1) {
    return oldPos;
  }

  const ceilPos = { x: Math.ceil(pos.x), y: Math.ceil(pos.y) };
  const floorPos = { x: Math.floor(pos.x), y: Math.floor(pos.y) };

  if (
    localWorldState.map[ceilPos.x][ceilPos.y] &&
    localWorldState.map[floorPos.x][floorPos.y]
  ) {
    return oldPos;
  } else if (localWorldState.map[ceilPos.x][ceilPos.y]) {
    return floorPos;
  } else if (localWorldState.map[floorPos.x][floorPos.y]) {
    return ceilPos;
  } else {
    return pos;
  }
};

const movePlayer = (address, enemyAddress, x, y, move) => {
  let newPosition = { x, y };
  switch (move) {
    case "right": {
      newPosition.y += playerMovePerTick;
      break;
    }
    case "left": {
      newPosition.y -= playerMovePerTick;
      break;
    }
    case "up": {
      newPosition.x -= playerMovePerTick;
      break;
    }
    case "down": {
      newPosition.x += playerMovePerTick;
      break;
    }
  }

  newPosition = checkPlayerCollision(
    { x, y },
    newPosition,
    localWorldState.players.get(enemyAddress).position
  );

  localWorldState.players.get(address).position = newPosition;
  return newPosition;
};

const updateWorld = () => {
  localWorldState.players.forEach((player, address) => {
    const { x, y } = player.position;
    const { move, fire } = { ...clientsData.get(address) };

    if (move) {
      player.direction = move;

      const newPosition = movePlayer(address, player.enemy, x, y, move);
      checkCapture(address, newPosition);
    }

    fire && createProjectile(address, player.position, player.direction);
  });

  localWorldState.projectiles.forEach((projectile, id) => {
    const { x, y } = projectile.position;

    const newPosition = moveProjectile(id, x, y, projectile.move);
    checkKill(projectile.address, newPosition);
  });

  clientsData.clear();
};

const endpoints = {
  update: "/update",
};

module.exports = (framework) => {
  const {
    iocContainer: { resolve: resolveDependency },
    context: { use: useContext, update: updateContext },
    server,
  } = framework;

  const stringifyWithMapDataType = resolveDependency(
    "helpers/stringifyWithMap"
  );

  return {
    handler: (router) => {
      const { worldState } = useContext();
      localWorldState = worldState;

      router.bindEndpoint(endpoints.update, (data, remote) => {
        const address = flattenAddress(remote);

        if (clientsData.has(address)) {
          data.move && (clientsData.get(address).move = data.move);
          data.isFire && (clientsData.get(address).fire = data.isFire);
        } else {
          clientsData.set(address, {
            move: data.move,
            fire: data.isFire,
          });
        }
      });

      tickId = setInterval(() => {
        updateWorld();

        server.send(
          stringifyWithMapDataType({
            action: "state",
            state: localWorldState,
          })
        );
      }, tickInterval);

      roundTimerId = setTimeout(() => {
        localWorldState.timeIsOver = true;
        server.stateTransitionTo("next");
      }, roundLimitTime);
    },

    disposeHandler: () => {
      clearInterval(tickId);
      clearTimeout(roundTimerId);

      updateContext({ worldState: localWorldState });
    },
  };
};
