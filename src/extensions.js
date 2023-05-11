import { marked } from "marked";

/** @typedef {marked.TokenizerExtension | marked.RendererExtension | (marked.TokenizerExtension & marked.RendererExtension)} Extension */

let repo = "";

export function set_repo(current_repo) {
  repo = current_repo;
}

/** @type {marked.RendererObject} */
export let renderer = {
  // task list
  list(body, ordered, start) {
    const tag = ordered ? "ol" : "ul";
    const suffix = body.includes('<li class="task-list-item">')
      ? ' class="contains-task-list">'
      : ` start="${start}">`;
    return "<" + tag + suffix + body + "</" + tag + ">";
  },
  listitem(text, task, checked) {
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
  code(code, lang) {
    if (lang === "mermaid") {
      return '<div class="mermaid">' + code + "</div>";
    }
    if (lang === "math") {
      return "<p>$$ " + code + " $$</p>";
    }
    return false;
  },
  // #issue
  text(text) {
    if (repo) {
      // Ensure not replacing "&#39;".
      // Warn: negative lookbehind (?<!xxx) does not work on safari
      return text.replace(
        /(?<!&)#(\d+)/g,
        (_, id) => `<a href="https://github.com/${repo}/issues/${id}">#${id}</a>`,
      );
    }
    return false;
  },
};

export const hooks = {
  postprocess(html) {
    return html.replace(/<h[1-6] id="([^"]+)">/g, (s, id) => {
      const octicon = `<a class="anchor" aria-hidden="true" href="#${id}"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>`;
      return s + octicon;
    });
  },
};

/** @type {marked.MarkedOptions["walkTokens"]} */
export let walkTokens = token => {
  // Replace the first **Note** inside a blockquote element.
  if (token.type === "blockquote") {
    /** @type {marked.Token} */
    let first;
    token.tokens.forEach(t => {
      if (t.type === "paragraph") {
        if ((first = t.tokens[0]) && first.type === "strong") {
          if (first.text === "Note") {
            first.type = "html";
            first.tokens = undefined;
            first.text = first.raw =
              '<span class="color-fg-accent"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"></path></svg>Note</span>';
          } else if (first.text === "Warning") {
            first.type = "html";
            first.tokens = undefined;
            first.text = first.raw =
              '<span class="color-fg-attention"><svg class="octicon octicon-alert mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path></svg>Warning</span>';
          }
        }
      }
    });
  }
};

// Footnote[^1]
/** @type {Extension} */
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

/** @type {Extension} */
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
import full from "markdown-it-emoji/lib/data/full.json";

/** @type {Extension} */
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
