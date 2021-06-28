#!/usr/bin/env node
import fs from "fs";
import http from "http";

const indexHTML = new URL("index.html", import.meta.url);
const args = process.argv.slice(2);

if (args.includes("--help")) {
    console.log("usage: marked-cli README.md");
    process.exit(0);
}

const source = args[args.length - 1];
if (!fs.existsSync(source)) {
    console.error("file not found:", source);
    process.exit(1);
}

/** @type {Set<http.ServerResponse>} */
const clients = new Set();

fs.watchFile(source, { interval: 100 }, async () => {
    const text = await fs.promises.readFile(source, "utf-8");
    for (const client of clients) {
        client.write(`data: ${JSON.stringify(text)}\n\n`);
    }
})

http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/__source') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        res.write(`data: ${JSON.stringify(await fs.promises.readFile(source, "utf-8"))}\n\n`);
        return clients.add(res);
    }
    if (['/', '/index.html'].includes(url.pathname)) {
        res.writeHead(200).end(await fs.promises.readFile(indexHTML, "utf-8"));
    } else {
        res.writeHead(404).end("Not found");
    }
}).listen(5000, () => {
    console.log("serving http://localhost:5000");
});
