import fs from "node:fs";
import cp from "node:child_process";

const subVer = process.argv[2] || "0";

const saved = fs.readFileSync("package.json", "utf8");
const pkg = JSON.parse(saved);
pkg.files.push("index.vscode.html");
let ver = pkg.version.split(".");
ver[2] = parseInt(ver[2]) + 1;
pkg.version = ver.join(".") + "-vscode." + subVer;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
cp.spawnSync(npm, ["run", "build"], { stdio: "inherit" });
const vsce = process.platform === "win32" ? "vsce.cmd" : "vsce";
cp.spawnSync(vsce, ["publish", "--tag", "vscode"], { stdio: "inherit" });

fs.writeFileSync("package.json", saved);
