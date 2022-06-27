import { load } from "js-yaml";
import { htmlEscape } from "escape-goat";

export function matter(text) {
  if (!text.startsWith("---")) return [null, text];
  if (text[3] === "-") return [null, text];
  const end = text.indexOf("\n---\n", 3);
  if (end === -1) return [null, text];
  const frontMatter = text.slice(4, end);
  const content = text.slice(end + 5);
  return [load(frontMatter), content];
}

export function stringify(obj) {
  if (typeof obj === "object") {
    if (obj === null) return "";

    if (Array.isArray(obj)) {
      return (
        "<table><tbody><tr><td>" +
        obj.map(stringify).join("</td><td>") +
        "</td></tr></tbody></table>"
      );
    }

    let keys = Object.keys(obj);
    let out = "<table><thead><tr><th>" + keys.map(stringify).join("</th><th>");
    out += "</th></tr></thead><tbody><tr><td>";
    out += keys.map(key => stringify(obj[key])).join("</td><td>");
    out += "</td></tr></tbody></table>";
    return out;
  }

  return htmlEscape(`${obj}`);
}
