import fs from "node:fs";
import cp from "node:child_process";

/** @type {import('node:child_process').ChildProcess} */
let child = null;

let watcher = fs.watch("./src", debounce(refresh));
refresh();

process.on("SIGTERM", quit);
process.on("SIGINT", quit);

function quit() {
  watcher.close();
  child && child.kill();
}

function refresh() {
  cp.spawnSync("node", ["scripts/build.js"], { env: { ...process.env, NODE_ENV: "development" } });
  console.log(`rebuilt at ${new Date().toLocaleTimeString()}`);
  child && child.kill();
  child = cp.spawn("node", ["bin.js"], { stdio: "inherit" });
  child.on("exit", code => {
    console.log("child process exited with code", code);
  });
}

function debounce(fn) {
  let timer = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(fn, 100, ...arguments);
  };
}
