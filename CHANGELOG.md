# Changelog

## 0.2.0

- No vendors or CDN, I bundled front-end dependencies to a single file.

  Due to the temporary down of jsdelivr in China, I have to do this.

- Added support for KaTeX by <code>$ E = mc^2 $</code> and <code>$$ block mode $$</code>.

  > Note: You can also use mermaid.js by <code>```mermaid</code>!

- Added support for multiple files (e.g. navigate to another markdown file through links).

- Added [GitHub Slugger](https://github.com/Flet/github-slugger) to much the id generator behavior.

- Added support for GitHub Markdown Rendering API to actually let GitHub render your markdown.
  Note that it does not support all features as GitHub.com, which including:

  - Task list result is a bit different.
  - No support for mermaid.js and math expressions.
