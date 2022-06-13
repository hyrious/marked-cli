#!/usr/bin/env node
import fs from "fs";
import http from "http";
import { lookup } from "mrmime";
import { unwatch_all, watch } from "./watch";

const indexHTML = new URL("index.html", import.meta.url);
const indexJS = new URL("index.js", import.meta.url);
const indexCSS = new URL("style.css", import.meta.url);

const server = http.createServer((req, res) => {
  let url = new URL(req.url, `http://${req.headers.host}`);
  // /, /index.html, /README.md are redirect to the indexHTML
  if (["/", "/index.html"].includes(url.pathname)) {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(fs.readFileSync(indexHTML, "utf8"));
  }
  // Use our style.css and client (index.js)
  else if (url.pathname === "/@/style.css") {
    res.writeHead(200, { "content-type": "text/css" });
    res.end(fs.readFileSync(indexCSS, "utf8"));
  } else if (url.pathname === "/@/index.js") {
    res.writeHead(200, { "content-type": "text/javascript" });
    res.end(fs.readFileSync(indexJS, "utf8"));
  }
  // Here comes the interesting part, we watch the file from event sources
  // by reading the "path" param of the url.
  // When the event source is closed, we also close the file watch if needed.
  else if (url.pathname === "/@/source") {
    let path = url.searchParams.get("path");
    if (typeof path !== "string" || !path.endsWith(".md")) {
      path = guess_index_markdown(path);
    }
    if (path) {
      path = path.slice(1);
      res.on("close", watch(path, send_update.bind(null, res, path)));
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write(`data: 0\n\n`);
      // Send first update.
      send_update(res, path);
    } else {
      res.statusCode = 404;
      res.end();
    }
  } else {
    let path = url.pathname.slice(1);
    if (fs.existsSync(path) && fs.statSync(path).isFile()) {
      if (path.endsWith(".md")) {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(fs.readFileSync(indexHTML, "utf8"));
      } else {
        res.writeHead(200, { "content-type": lookup(path) || "text/plain" });
        fs.createReadStream(path).pipe(res, { end: true });
      }
    } else {
      res.statusCode = 404;
      res.end();
    }
  }
});
const destroy = create_destroy(server);
server.listen(5000, () => console.log("serving http://localhost:5000"));

process.on("SIGTERM", quit);
process.on("SIGINT", quit);

function quit() {
  unwatch_all();
  destroy(() => process.exit(0));
}

function create_destroy(server) {
  let connections = Object.create(null);
  server.on("connection", conn => {
    let key = conn.remoteAddress + ":" + conn.remotePort;
    connections[key] = conn;
    conn.on("close", () => delete connections[key]);
  });
  return function (cb) {
    server.close(cb);
    for (let key in connections) {
      connections[key].destroy();
    }
  };
}

function send_update(res, path) {
  let content = fs.readFileSync(path, "utf8");
  res.write(`data: ${JSON.stringify(content)}\n\n`);
}

let guess_cache = new Map();
function guess_index_markdown(path) {
  if (guess_cache.has(path)) {
    return guess_cache.get(path);
  }
  // Only guess README.md at root folder.
  if (fs.existsSync("README.md")) {
    guess_cache.set(path, "/README.md");
    return "/README.md";
  }
  // Otherwise, send 404.
}
