let repo = "";

export function set_repo(current_repo) {
  repo = current_repo;
}

/** @type {import('marked').RendererObject} */
export let renderer = {
  // task list
  list({ ordered, start, items }) {
    const tag = ordered ? "ol" : "ul";
    let body = "";
    for (const item of items) {
      body += this.listitem(item);
    }
    const suffix = body.includes('<li class="task-list-item">')
      ? ' class="contains-task-list">'
      : ` start="${start}">`;
    return "<" + tag + suffix + body + "</" + tag + ">";
  },
  listitem({ text, task, checked }) {
    if (task) {
      const suffix = checked
        ? 'class="task-list-item-checkbox" type="checkbox" checked>'
        : 'class="task-list-item-checkbox" type="checkbox">';
      text = text.replace('type="checkbox">', suffix);
      return '<li class="task-list-item">' + text + "</li>";
    }
    return false;
  },
  // mermaid, katex
  code({ text, lang }) {
    if (lang === "mermaid") {
      return '<div class="mermaid">' + text + "</div>";
    }
    if (lang === "math") {
      return "<p>$$ " + text + " $$</p>";
    }
    return false;
  },
  // #issue
  text({ tokens, text }) {
    if (!tokens && repo) {
      // Ensure not replacing "&#39;".
      // Warn: negative lookbehind (?<!xxx) does not work on safari
      return text.replace(
        /(?<!&)#(\d+)/g,
        (_, id) => `<a href="https://github.com/${repo}/issues/${id}">#${id}</a>`,
      );
    }
    return false;
  },
  // [!NOTE]
  blockquote({ tokens }) {
    const quote = this.parser.parse(tokens);
    if (quote.startsWith('<p class="markdown-alert-title" dir="auto">')) {
      const index = quote.indexOf("octicon-") + 8;
      if (quote.startsWith("info", index)) {
        return '<div class="markdown-alert markdown-alert-note" dir="auto">' + quote + "</div>";
      }
      if (quote.startsWith("light-bulb", index)) {
        return '<div class="markdown-alert markdown-alert-tip" dir="auto">' + quote + "</div>";
      }
      if (quote.startsWith("report", index)) {
        return '<div class="markdown-alert markdown-alert-important" dir="auto">' + quote + "</div>";
      }
      if (quote.startsWith("alert", index)) {
        return '<div class="markdown-alert markdown-alert-warning" dir="auto">' + quote + "</div>";
      }
      if (quote.startsWith("stop", index)) {
        return '<div class="markdown-alert markdown-alert-caution" dir="auto">' + quote + "</div>";
      }
    }
    return false;
  },
};

const icons = {
  NOTE: `<p class="markdown-alert-title" dir="auto"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Note</p>`,
  TIP: `<p class="markdown-alert-title" dir="auto"><svg class="octicon octicon-light-bulb mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>Tip</p>`,
  IMPORTANT: `<p class="markdown-alert-title" dir="auto"><svg class="octicon octicon-report mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>Important</p>`,
  WARNING: `<p class="markdown-alert-title" dir="auto"><svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>Warning</p>`,
  CAUTION: `<p class="markdown-alert-title" dir="auto"><svg class="octicon octicon-stop mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>Caution</p>`,
};

// Parse [!NOTE] [!TIP] [!IMPORTANT] [!WARNING] [!CAUTION]
/** @type {import('marked').MarkedExtension['walkTokens']} */
export let walkTokens = (token, m) => {
  if (
    token.type === "blockquote" &&
    (m = token.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n/i))
  ) {
    if (token.tokens[0] && token.tokens[0].type === "paragraph" && token.tokens[0].tokens.length) {
      // 1. strip prefix [!NOTE]\n
      token.tokens[0].tokens[0].text = token.tokens[0].tokens[0].text.slice(m[0].length);
      // 2. prepend icon
      const icon = icons[m[1]];
      token.tokens.unshift({ type: "html", tokens: void 0, text: icon, raw: icon });
    }
  }
};

// Octicon (the link icon before title)
/** @type {import('marked').MarkedExtension['hooks']} */
export const hooks = {
  postprocess(html) {
    return html.replace(/<h[1-6] id="([^"]+)">/g, (s, id) => {
      const octicon = `<a class="anchor" aria-hidden="true" href="#${id}"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>`;
      return s + octicon;
    });
  },
};

// Footnote[^1]
/** @type {import('marked').TokenizerAndRendererExtension} */
export let footnoteList = {
  name: "footnoteList",
  level: "block",
  start(src) {
    return src.match(/^\[\^\d+\]:/)?.index;
  },
  tokenizer(src, tokens) {
    const match = /^(?:\[\^(\d+)\]:[^\n]*(?:\n|$))+/.exec(src);
    if (match) {
      const token = {
        type: "footnoteList",
        raw: match[0],
        text: match[0].trim(),
        tokens: [],
      };
      this.lexer.inline(token.text, token.tokens);
      return token;
    }
  },
  renderer(token) {
    return (
      '<section class="footnotes"><ol dir="auto">' + this.parser.parseInline(token.tokens) + "</ol></section>"
    );
  },
};

/** @type {import('marked').TokenizerAndRendererExtension} */
export let footnote = {
  name: "footnote",
  level: "inline",
  start(src) {
    return src.match(/\[\^\d+\]/)?.index;
  },
  tokenizer(src, tokens) {
    const matchList = /^\[\^(\d+)\]:([^\n]*)(?:\n|$)/.exec(src);
    if (matchList) {
      return {
        type: "footnote",
        raw: matchList[0],
        id: parseInt(matchList[1]),
        tokens: this.lexer.inlineTokens(matchList[2].trim()),
        def: true,
      };
    }
    const matchInline = /^\[\^(\d+)\]/.exec(src);
    if (matchInline) {
      return {
        type: "footnote",
        raw: matchInline[0],
        id: parseInt(matchInline[1]),
        tokens: [],
        def: false,
      };
    }
  },
  renderer(token) {
    if (!token.def) {
      return `<sup><a href="#user-content-fn-${token.id}" data-footnote-ref="" id="user-content-fnref-${token.id}">${token.id}</a></sup>`;
    }
    return (
      `<li id="user-content-fn-${token.id}"><p dir="auto">` +
      this.parser.parseInline(token.tokens) +
      ` <a href="#user-content-fnref-${token.id}" class="data-footnote-backref" aria-label="Back to content">` +
      '<g-emoji class="g-emoji" alias="leftwards_arrow_with_hook" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/21a9.png">↩</g-emoji></a></p></li>'
    );
  },
};

/** @type {import('marked').TokenizerAndRendererExtension} */
export let math = {
  name: "math",
  level: "inline",
  start(src) {
    return src.match(/\$`|`\$/)?.index;
  },
  tokenizer(src, tokens) {
    const matchList = /^\$`([^\n]*)`\$/.exec(src);
    if (matchList) {
      return {
        type: "math",
        raw: matchList[0],
        math: matchList[1],
        tokens: [],
      };
    }
    if (src.startsWith("$`")) {
      return { type: "codespan", raw: "$`", text: "$`" };
    }
    if (src.startsWith("`$")) {
      return { type: "codespan", raw: "`$", text: "`$" };
    }
  },
  renderer(token) {
    return token.raw;
  },
};

// :emoji:
import full from "markdown-it-emoji/lib/data/full.mjs";

/** @type {import('marked').TokenizerAndRendererExtension} */
export let emoji = {
  name: "emoji",
  level: "inline",
  start(src) {
    return src.match(/:[a-zA-Z0-9_\-\+]+:/)?.index;
  },
  tokenizer(src, tokens) {
    const match = /^:([a-zA-Z0-9_\-\+]+):/.exec(src);
    if (match && match[1] in full) {
      return {
        type: "emoji",
        raw: match[0],
        text: full[match[1]],
      };
    }
  },
  renderer(token) {
    const codePoint = token.text.codePointAt(0).toString(16);
    return `<g-emoji class="g-emoji" alias="${token.text}" fallback-src="https://github.githubassets.com/images/icons/emoji/unicode/${codePoint}.png">${token.text}</g-emoji>`;
  },
};
