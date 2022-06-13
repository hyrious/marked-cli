import { marked } from "marked";
import Slugger from "github-slugger";

/** @typedef {marked.TokenizerExtension | marked.RendererExtension} Extension */

export let slugger = new Slugger();

/** @type {marked.RendererObject} */
export let renderer = {
  // github slugger
  heading(text, level, raw) {
    if (this.options.headerIds) {
      const id = this.options.headerPrefix + slugger.slug(raw);
      return `<h${level} id="${id}">${text}</h${level}>\n`;
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
      return '<div class="mermaid">' + code + "</div>";
    }
    return false;
  },
};
