# Changelog

## 0.2.5

- Fixed to escape html in mermaid.
- Support changing index file in root directory.

## 0.2.4

- Center mermaid diagrams.
- Make mermaid diagrams follow system theme change.
- Added octicon links.
- Support changing root directory.
- Redirect to the markdown file in subpath.

## 0.2.3

- Added `--help` and `--version` flags.
- Fixed file name with spaces and other special characters.

## 0.2.2

- Refactored the resolver so that it can find `/path/README.md` in `/path`.

## 0.2.1

- Fixed missing highlight.js styles.

## 0.2.0

- No vendors or CDN, I bundled front-end dependencies to a single file.

- Added support for KaTeX by <code>$ E = mc^2 $</code> and <code>$$ block mode $$</code>.

  > Note: You can also use mermaid.js by <code>\`\`\`mermaid</code>!

- Added support for multiple files (e.g. navigate to another markdown file through links).

- Added [GitHub Slugger](https://github.com/Flet/github-slugger) to much the id generator behavior.

- Added support for GitHub Markdown Rendering API to actually let GitHub render your markdown.
  Note that it does not support all features as GitHub.com, which including:

  - Task list result is a bit different.
  - No support for mermaid.js and math expressions.
