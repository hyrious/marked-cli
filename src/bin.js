#!/usr/bin/env node
import fs from "fs";
import path from "path";
import http from "http";
import { lookup } from "mrmime";
import { unwatch_all, watch } from "./watch";
import { name, version } from "../package.json";
import { repo } from "./git";

let arg1 = process.argv[2];
if (["--version", "-v"].includes(arg1)) {
  console.log(`${name}, ${version}`);
  process.exit(0);
}
if (["--help", "-h"].includes(arg1)) {
  console.log(`
  Description
    Preview markdown files, update the browser on change.

  Usage
    $ marked-cli [root]
`);
  process.exit(0);
}

// Get base dir from arg1.
let cwd = process.cwd();
let index_file = "README.md";
if (arg1 && fs.existsSync(arg1)) {
  if (fs.statSync(arg1).isDirectory()) cwd = arg1;
  else {
    cwd = path.dirname(arg1);
    index_file = path.basename(arg1);
  }
}

let current_repo = repo(cwd);

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
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.write(`data: 0\n\n`);
    if (current_repo) {
      res.write(`data: ${JSON.stringify({ repo: current_repo })}\n\n`);
    }
    // try resolving markdown file
    let file = resolve(decodeURIComponent(url.searchParams.get("path") || "/"));
    if (file && file.endsWith(".md")) {
      res.once("close", watch(path.join(cwd, file), send_update.bind(null, res, file)));
      // Send first update.
      send_update(res, file);
    } else {
      res.write(`data: "404 not found"\n\n`);
      res.once("close", res.end.bind(res));
    }
  }

  // /path.md -> /path.md
  // /path    -> /path/README.md
  else {
    let p = resolve(decodeURIComponent(url.pathname));
    if (p && p.endsWith(".md")) {
      // If in the browser it is not point to exactly the markdown file,
      // tell the browser to redirect to the file correctly.
      // Otherwise relative links in that file will be broken.
      if (!url.pathname.endsWith(".md")) {
        res.writeHead(302, { location: "/" + p });
        res.end();
      } else {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(fs.readFileSync(indexHTML, "utf8"));
      }
    } else if (p) {
      let realpath = path.join(cwd, p);
      let contentType = lookup(realpath) || "text/plain";
      if (realpath.endsWith(".ts")) {
        contentType = "text/typescript";
      }
      res.writeHead(200, { "content-type": contentType });
      fs.createReadStream(realpath).pipe(res, { end: true });
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

function send_update(res, file) {
  try {
    let content = fs.readFileSync(path.join(cwd, file), "utf8");
    res.write(`data: ${JSON.stringify(content)}\n\n`);
  } catch {
    // In case of file being deleted, do force reload.
    res.write(`data: 2\n\n`);
  }
}

// This function will be called at least twice for each markdown file.
// I don't care the performance :)
function resolve(file) {
  file = file.replace(/^\//, "");
  if (file.startsWith("@")) return null;
  file = file.replace(/\/$/, "");

  // exact match
  if (file) {
    const realpath = path.join(cwd, file);
    const exist = fs.existsSync(realpath);
    if (exist && fs.statSync(realpath).isFile()) return file;
    // is folder
    if (exist) return resolve(file + "/README.md");
  }

  // no path, search for README.md in root folder
  else if (fs.existsSync(path.join(cwd, index_file))) {
    return index_file;
  }

  return null;
}
