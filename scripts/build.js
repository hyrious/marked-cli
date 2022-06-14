import fs from "node:fs";
import path from "node:path";
import prettyBytes from "pretty-bytes";
import esbuild from "esbuild";

let dev = process.env.NODE_ENV === "development";

let timeStart = performance.now();

// Bundle KaTeX Fonts.
{
  let src = path.resolve("node_modules/katex/dist/katex.css");
  let css = fs.readFileSync(src, "utf8");
  css = css.replace(/src: url\(.*;/g, match => {
    let i = match.indexOf("woff2") + 5 + 1;
    let src = match.slice(0, i) + ";";
    let dist = src.replace("url(fonts/", "url(katex/dist/fonts/");
    return dist;
  });
  fs.mkdirSync("./src/temp", { recursive: true });
  fs.writeFileSync("./src/temp/katex.css", css);
}

// Build hljs styles.
{
  let src1 = path.resolve("node_modules/@highlightjs/cdn-assets/styles/github.min.css");
  let src2 = path.resolve("node_modules/@highlightjs/cdn-assets/styles/github-dark.min.css");
  let css1 = fs.readFileSync(src1, "utf8");
  let css2 = fs.readFileSync(src2, "utf8");
  let css = css1 + "@media(prefers-color-scheme:dark){" + css2 + "}";
  fs.writeFileSync("./src/temp/hljs.css", css);
}

let js = esbuild.build({
  entryPoints: ["./src/index.js"],
  bundle: true,
  minify: !dev,
  mangleProps: /_$/,
  reserveProps: /^__.*__$/,
  format: "esm",
  target: "chrome86", // cent browser
  outfile: "./index.js",
  metafile: true,
});

let css = esbuild.build({
  entryPoints: ["./src/style.css"],
  bundle: true,
  minify: !dev,
  target: "chrome86",
  loader: {
    ".woff2": "dataurl",
  },
  outfile: "./style.css",
  metafile: true,
});

let bin = esbuild.build({
  entryPoints: ["./src/bin.js"],
  bundle: true,
  minify: !dev,
  mangleProps: /_$/,
  reserveProps: /^__.*__$/,
  platform: "node",
  format: "esm",
  target: "node16.15.1", // LTS
  outfile: "./bin.js",
  metafile: true,
});

await Promise.allSettled([bin, js, css]).catch(() => process.exit(1));

let elapsed = performance.now() - timeStart;

let [file_width, size_width] = [0, 0];
let file_with_size = ["./index.js", "./style.css", "./bin.js"].map(file => {
  file_width = Math.max(file_width, file.length);
  let real_size = fs.statSync(file).size;
  let [size, unit] = prettyBytes(real_size, { binary: true }).split(" ");
  size_width = Math.max(size_width, size.length);
  return [file, size, unit, real_size];
});
const compare = (a, b) => -(a < b ? -1 : a > b ? 1 : 0);
file_with_size.sort((a, b) => compare(a[3], b[3]));
console.log();
file_with_size.forEach(([file, size, unit]) => {
  file = file.replace("./", "  ");
  console.log(`${file.padEnd(file_width)}  ${size.padStart(size_width)} ${unit}`);
});
console.log();
console.log(`Finished in ${((elapsed * 100) | 0) / 100}ms.`);

let files = await Promise.all([bin, js, css]).then(r => r.map(e => e.metafile));
let merged = {};
for (let { inputs, outputs } of files) {
  merged.inputs = { ...inputs, ...merged.inputs };
  merged.outputs = { ...outputs, ...merged.outputs };
}
let analytics = await esbuild.analyzeMetafile(merged, { color: false });
console.log(analytics);
