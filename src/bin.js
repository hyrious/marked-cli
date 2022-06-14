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

  // /, /index.html -> indexHTML
  if (["/", "/index.html"].includes(url.pathname) || url.pathname === "/@/index.html") {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(fs.readFileSync(indexHTML, "utf8"));
  }

  // Built-in assets.
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
    // try resolving markdown file
    let path = resolve(url.searchParams.get("path") || "/");
    if (path.endsWith(".md")) {
      res.once("close", watch(path, send_update.bind(null, res, path)));
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write(`data: 0\n\n`);
      // Send first update.
      send_update(res, path);
    } else {
      res.statusCode = 404;
      res.end();
    }
  }

  // /path.md -> /path.md
  // /path    -> /path/README.md
  else {
    let path = resolve(url.pathname);
    if (path && path.endsWith(".md")) {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(fs.readFileSync(indexHTML, "utf8"));
    } else if (path) {
      res.writeHead(200, { "content-type": lookup(path) || "text/plain" });
      fs.createReadStream(path).pipe(res, { end: true });
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
  try {
    let content = fs.readFileSync(path, "utf8");
    res.write(`data: ${JSON.stringify(content)}\n\n`);
  } catch {
    // In case of file being deleted, do force reload.
    res.write(`data: 2\n\n`);
  }
}

// This function will be called at least twice for each markdown file.
// I don't care the performance :)
function resolve(path) {
  path = path.replace(/^\//, "");
  if (path.startsWith("@")) return null;
  path = path.replace(/\/$/, "");

  // exact match
  if (path) {
    const exist = fs.existsSync(path);
    if (exist && fs.statSync(path).isFile()) return path;
    // is folder
    if (exist) return resolve(path + "/README.md");
  }

  // no path, search for README.md in root folder
  else if (fs.existsSync("README.md")) {
    return "README.md";
  }

  return null;
}
