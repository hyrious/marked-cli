import { marked } from "marked";
import { htmlEscape } from "escape-goat";
import Slugger from "github-slugger";

/** @typedef {marked.TokenizerExtension | marked.RendererExtension | (marked.TokenizerExtension & marked.RendererExtension)} Extension */

let repo = "";

export function set_repo(current_repo) {
  repo = current_repo;
}

export let slugger = new Slugger();

/** @type {marked.RendererObject} */
export let renderer = {
  // github slugger
  heading(text, level, raw) {
    if (this.options.headerIds) {
      const id = this.options.headerPrefix + slugger.slug(raw);
      const octicon = `<a class="anchor" aria-hidden="true" href="#${id}"><svg class="octicon octicon-link" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>`;
      return `<h${level} id="${id}">${octicon}${text}</h${level}>\n`;
    }
    return false;
  },
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
  // mermaid
  code(code, lang) {
    if (lang === "mermaid") {
      return '<div class="mermaid">' + htmlEscape(code) + "</div>";
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
        (_, id) => `<a href="https://github.com/${repo}/issues/${id}">#${id}</a>`
      );
    }
    return false;
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
        if ((first = t.tokens[0]) && first.type === "strong" && first.text === "Note") {
          first.type = "html";
          first.tokens = undefined;
          first.text = first.raw =
            '<span class="color-fg-accent"><svg class="octicon octicon-info mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"></path></svg>Note</span>';
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
      '<section class="footnotes"><ol dir="auto">' +
      this.parser.parseInline(token.tokens) +
      "</ol></section>"
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
