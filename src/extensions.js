import { marked } from "marked";
import { htmlEscape } from "escape-goat";
import Slugger from "github-slugger";

/** @typedef {marked.TokenizerExtension | marked.RendererExtension} Extension */

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
      return text.replace(
        /#(\d+)/g,
        (_, id) => `<a href="https://github.com/${repo}/issues/${id}">#${id}</a>`
      );
    }
    return false;
  },
};
