import { marked } from "marked";
import hljs from "@highlightjs/cdn-assets/es/highlight";
import mermaid from "mermaid";
import katex from "katex";
import renderMathInElement from "katex/contrib/auto-render";
import Slugger from "github-slugger";
import { renderer, slugger } from "./extensions";

const search = new URLSearchParams(location.search);

Object.assign(window, { marked, hljs, mermaid, katex, Slugger, slugger });

marked.setOptions({
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
});

marked.use({ renderer });

const dark = matchMedia("(prefers-color-scheme: dark)");
mermaid.initialize({ startOnLoad: false, theme: dark.matches ? "dark" : "default" });

const body = document.body;
const __END__ = document.getElementById("__END__");

const source = new EventSource(
  "/@/source?" + new URLSearchParams({ path: location.pathname }).toString()
);
source.onmessage = function on_init(ev) {
  const data = JSON.parse(ev.data);
  if (data === 0) {
    console.debug("[marked-cli] connected");
    source.onmessage = on_update;
  }
};

const template = document.createElement("template");
async function on_update(ev) {
  const data = JSON.parse(ev.data);
  // 0: server restarted 2: read file error
  if (typeof data === "number") {
    location.reload();
    return;
  }

  if (typeof data !== "string") return;

  // string: markdown content
  body.classList.add("loading");

  if (search.get("github")) {
    template.innerHTML = await fetch("https://api.github.com/markdown", {
      method: "POST",
      headers: { accept: "application/vnd.github.v3+json" },
      body: JSON.stringify({ text: data, mode: "gfm" }),
    }).then(r => r.text());
  } else {
    slugger.reset();
    template.innerHTML = marked.parse(data);
  }

  while (body.firstChild !== __END__) {
    body.removeChild(body.firstChild);
  }

  body.insertBefore(template.content, __END__);
  requestAnimationFrame(postprocess);
}

source.onerror = function on_disconnect() {
  console.debug("[marked-cli] disconnected, waiting for reconnection...");
  source.onerror = null;
};

function postprocess() {
  // Refresh title.
  const maybe_title = document.querySelector("h1, h2");
  document.title = maybe_title ? maybe_title.textContent : "Untitled";

  // Refresh KaTeX.
  renderMathInElement(body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });

  // Refresh mermaid diagrams.
  body.querySelectorAll(".mermaid").forEach((el, i) =>
    mermaid.mermaidAPI.render(`mermaid-${i}`, el.textContent, svg => {
      el.innerHTML = svg;
    })
  );

  body.classList.remove("loading");
}

// Remove service workers registered by other debugging tools.
// `navigator.serviceWorker` is undefined in http://127.0.0.1 (insecure context).
navigator.serviceWorker?.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
