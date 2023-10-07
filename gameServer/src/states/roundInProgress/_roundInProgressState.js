const endpoints = {
  update: "/update",
};

let localWorldState;

const tickRate = 1;
const tickInterval = 1_000 / tickRate;
const roundLimitTime = 3_500; //30_000;
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
  }

  return isCaptured;
};

const checkKill = (address, position) => {
  const enemyPosition = localWorldState.players.get(
    localWorldState.players.get(address).enemy
  ).position;

  const isKilled = getDistance(position, enemyPosition) <= 0.5;
  if (isKilled) {
    localWorldState.killer = address;
  }

  return isKilled;
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
      const isCaptured = checkCapture(address, newPosition);
      if (isCaptured) return true;
    }

    fire && createProjectile(address, player.position, player.direction);
  });

  localWorldState.projectiles.forEach((projectile, id) => {
    const { x, y } = projectile.position;

    const newPosition = moveProjectile(id, x, y, projectile.move);
    const isKilled = checkKill(projectile.address, newPosition);
    if (isKilled) return true;
  });

  clientsData.clear();
  return false;
};

module.exports = (framework) => {
  const {
    context: { use: useContext, update: updateContext },
    server,
    timers: { setInterval, setTimeout },
    refs: { resolveDependency },
  } = framework;

  const stringifyWithMap = resolveDependency("helpers/stringifyWithMap");
  const flattenAddress = resolveDependency("helpers/flattenAddress");

  return {
    handler: ({ router, stateTransitionTo }) => {
      const { worldState } = useContext();
      localWorldState = worldState;

      router.bindEndpoint(endpoints.update, ({ data, remote }) => {
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

      setInterval(() => {
        const isGameOver = updateWorld();

        server.broadcast(
          stringifyWithMap({
            action: "state",
            state: localWorldState,
          })
        );

        if (isGameOver) {
          stateTransitionTo("next");
        }
      }, tickInterval);

      //FIXME: uncomment after tests
      // setTimeout(() => {
      //   localWorldState.timeIsOver = true;
      //   stateTransitionTo("next");
      // }, roundLimitTime);
    },

    disposeHandler: () => {
      updateContext({ worldState: localWorldState });
    },
  };
};
