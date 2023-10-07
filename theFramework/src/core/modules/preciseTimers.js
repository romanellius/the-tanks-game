//constants
const msInSec = 1e3;
const nanoInMilliseconds = 1e6;
const minTimeoutDelay = msInSec / 60;

//init
let nextLoopId;
let isNextLoopImmediate;

let currTimerId = 0;
const timers = new Map();

//private functions
const getCurrTime = () => {
  const time = process.hrtime.bigint();
  return Number(time) / nanoInMilliseconds;
};

const invokeTimerHandlers = () => {
  for (const [id, timer] of timers) {
    const { prevTime, delay, handler, params, isTimeout } = timer;

    const currTime = getCurrTime();
    const deltaTime = currTime - prevTime;

    if (delay <= deltaTime) {
      try {
        handler(deltaTime, ...params);
      } catch (error) {
        throw `Timers: ${
          isTimeout ? "Timeout" : "Interval"
        } with delay ${delay.toFixed(2)}ms throws error: ${error}`;
      }

      isTimeout ? timers.delete(id) : (timer.prevTime = currTime);
    }
  }
};

const isNextLoopIterationImmediate = () => {
  const currTime = getCurrTime();
  for (const { prevTime, delay } of timers.values()) {
    if (currTime - prevTime >= delay - minTimeoutDelay) {
      return true;
    }
  }
  return false;
};

const doLoop = () => {
  invokeTimerHandlers();

  if (timers.size === 0) return;

  isNextLoopImmediate = isNextLoopIterationImmediate();
  nextLoopId = isNextLoopImmediate ? setImmediate(doLoop) : setTimeout(doLoop);
};

const tryStartLoop = () => {
  const doLoopCanBeStarted = timers.size === 1;
  if (doLoopCanBeStarted) {
    doLoop();
  }
  return doLoopCanBeStarted;
};

const tryStopLoop = () => {
  const doLoopCanBeStopped = timers.size === 0;
  const doLoopTimerCanBeStopped = doLoopCanBeStopped && nextLoopId;
  if (doLoopTimerCanBeStopped) {
    isNextLoopImmediate ? clearImmediate(nextLoopId) : clearTimeout(nextLoopId);

    nextLoopId = null;
    currTimerId = 0;
  }
  return doLoopCanBeStopped;
};

//public functions
const setTimer = (handler, delay, params, isTimeout) => {
  timers.set(currTimerId, {
    prevTime: getCurrTime(),
    delay,
    handler,
    params,
    isTimeout,
  });

  tryStartLoop();
  return currTimerId++;
};

const removeTimer = (id) => {
  const isTimerRemoved = timers.delete(id);

  tryStopLoop();
  return isTimerRemoved;
};

const clear = () => {
  timers.clear();
  tryStopLoop();
};

module.exports = {
  setInterval: (handler, delay, ...params) => setTimer(handler, delay, params),
  clearInterval: (id) => removeTimer(id),

  setTimeout: (handler, delay, ...params) =>
    setTimer(handler, delay, params, true),
  clearTimeout: (id) => removeTimer(id),

  clear,
};
