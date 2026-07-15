// Frame driver built on requestAnimationFrame. Calls onTick at a fixed logical
// rate (independent of the display refresh rate) so effects animate at a stable
// speed. onTick returns false when the effect is finished.

/**
 * @param {() => boolean} onTick - advance one logical frame; return false when done.
 * @param {{ fps?: number }} [config]
 * @returns {{ finished: Promise<void>, cancel: () => void }}
 */
export function createLoop(onTick, config = {}) {
  const interval = 1000 / (config.fps || 30);
  let raf = null;
  let last = 0;
  let acc = 0;
  let cancelled = false;
  let resolveFinished;

  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  function frame(now) {
    if (cancelled) {
      return;
    }
    if (last === 0) {
      last = now;
    }
    acc += now - last;
    last = now;

    let keepGoing = true;
    // Cap the number of catch-up ticks so a background tab that was throttled
    // does not fast-forward through the whole animation on return.
    let guard = 0;
    while (acc >= interval && keepGoing && guard < 5) {
      acc -= interval;
      guard += 1;
      keepGoing = onTick();
    }

    if (keepGoing) {
      raf = requestAnimationFrame(frame);
    } else {
      resolveFinished();
    }
  }

  raf = requestAnimationFrame(frame);

  return {
    finished,
    cancel() {
      if (cancelled) {
        return;
      }
      cancelled = true;
      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
      resolveFinished();
    },
  };
}
