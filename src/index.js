import { marked } from "marked";
import linkify from "marked-linkify-it";
import { gfmHeadingId } from "marked-gfm-heading-id";
import { markedHighlight } from "marked-highlight";
import hljs from "@highlightjs/cdn-assets/es/highlight";
import mermaid from "mermaid";
import katex from "katex";
import renderMathInElement from "katex/contrib/auto-render";
import { math, footnoteList, footnote, emoji, renderer, set_repo, hooks, walkTokens } from "./extensions";
import { matter, stringify } from "./matter";

function noop() {}

const search = new URLSearchParams(location.search);

Object.assign(window, { marked, hljs, mermaid, katex });

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
  gfmHeadingId(),
  linkify(),
  {
    gfm: true,
    extensions: [math, footnoteList, footnote, emoji],
    renderer,
    hooks,
    walkTokens,
  },
);

const dark = matchMedia("(prefers-color-scheme: dark)");
mermaid.initialize({ startOnLoad: false, theme: dark.matches ? "dark" : "default" });

function refresh_mermaid(ev) {
  ev && mermaid.initialize({ startOnLoad: false, theme: ev.matches ? "dark" : "default" });
  document.querySelectorAll(".mermaid").forEach(async (el, i) => {
    const { svg } = await mermaid.render(`mermaid-${i}`, (el.__mermaid ||= el.textContent));
    el.innerHTML = svg;
  });
}

dark.addEventListener("change", refresh_mermaid);

const body = document.body;
const __END__ = document.getElementById("__END__");

const source = new EventSource("/@/source?" + new URLSearchParams({ path: location.pathname }));
source.onmessage = function on_init(ev) {
  const data = JSON.parse(ev.data);
  if (data === 0) {
    console.debug("[marked-cli] connected");
    source.onmessage = on_update;
  }
};

let initialized = false;
function init() {
  if (initialized) return;
  try {
    // Scroll to the target element if needed.
    document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth" });
  } catch {
    // location.hash may be invalid.
  }
  initialized = true;
}

let srcMap;
let notifyTransformSrc = false;
const template = document.createElement("template");
async function on_update(ev) {
  const data = JSON.parse(ev.data);
  // 0: server restarted 2: read file error
  if (typeof data === "number") {
    location.reload();
    return;
  }
  // reconnected, ignore this update because a reload is triggered
  if (!source.onerror) {
    return;
  }
  if (typeof data === "object" && data !== null) {
    if (data.repo) {
      set_repo(data.repo);
      return;
    }
    if (data.notifyTransformSrc) {
      notifyTransformSrc = true;
      return;
    }
    if (data.transformSrc && srcMap) {
      let imgs;
      data.transformSrc.forEach(([src, real]) => {
        if ((imgs = srcMap.get(src))) {
          imgs.forEach(img => {
            img.src = real;
          });
        }
      });
    }
  }

  if (typeof data !== "string") return;

  // string: markdown content
  body.classList.add("loading");

  if (search.has("github")) {
    template.innerHTML = await fetch("https://api.github.com/markdown", {
      method: "POST",
      headers: { accept: "application/vnd.github.v3+json" },
      body: JSON.stringify({ text: data, mode: "gfm" }),
    }).then(r => r.text());
  } else {
    let [frontmatter, content] = matter(data);
    template.innerHTML = stringify(frontmatter) + "\n" + marked.parse(content);
  }

  while (body.firstChild !== __END__) {
    body.removeChild(body.firstChild);
  }

  // Ensure there's no ghost element after __END__.
  // Note: mermaid will render error graph to the end of document.
  while (body.lastChild !== __END__) {
    body.removeChild(body.lastChild);
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

  // Move footnotes to the end of document.
  const footnotes = document.querySelectorAll("section.footnotes");
  if (footnotes.length) {
    footnotes.forEach(e => body.insertBefore(e, __END__));
  }

  // Refresh KaTeX.
  renderMathInElement(body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$`", right: "`$", display: false },
      { left: "$", right: "$", display: false },
    ],
    throwOnError: false,
  });

  // Refresh mermaid diagrams.
  document.querySelectorAll(".mermaid").forEach(el => {
    el.__mermaid ||= el.textContent;
  });
  mermaid.run();

  body.classList.remove("loading");

  init();

  if (notifyTransformSrc) {
    srcMap = new Map();
    document.querySelectorAll("img").forEach(img => {
      let src = img.getAttribute("src");
      if (!src) return;
      if (srcMap.has(src)) {
        srcMap.get(src).add(img);
      } else {
        srcMap.set(src, new Set([img]));
      }
    });
    (source._postMessage || noop)({ transformSrc: Array.from(srcMap.keys()) });
  }
}

let throttle = 0;
function update_hash_() {
  if (!throttle) throttle = setTimeout(update_hash, 300);
}

let pathhash = location.pathname + location.hash;
function update_hash() {
  throttle = 0;
  let h2, h3, h4;
  for (const h of document.querySelectorAll("h2, h3, h4")) {
    if (h.getBoundingClientRect().top > 10) break;
    if (h.tagName === "H2") {
      h2 = h;
      h3 = h4 = null;
    } else if (h.tagName === "H3") {
      h3 = h;
      h4 = null;
    } else {
      h4 = h;
    }
  }
  const h = h4 || h3 || h2;
  pathhash = location.pathname + (h ? "#" + h.id : "");
  if (location.pathname + location.hash !== pathhash) {
    history.replaceState(null, "", pathhash);
  }
}

addEventListener("scroll", update_hash_, { passive: true });

// Remove service workers registered by other debugging tools.
// `navigator.serviceWorker` is undefined in http://127.0.0.1 (insecure context).
navigator.serviceWorker?.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
