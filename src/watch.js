import fs from "fs";

const watchers = new Map();

export function watch(path, cb) {
  if (!watchers.has(path)) {
    let callbacks = new Set();
    let fn = debounce(() => callbacks.forEach(cb => cb()));
    let watcher = fs.watch(path, fn);
    watchers.set(path, { watcher, callbacks });
  }
  let { callbacks } = watchers.get(path);
  callbacks.add(cb);
  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0) {
      watchers.get(path).watcher.close();
      watchers.delete(path);
    }
  };
}

export function unwatch_all() {
  watchers.forEach(({ watcher }) => watcher.close());
  watchers.clear();
}

function debounce(fn) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, 100, ...arguments);
  };
}
