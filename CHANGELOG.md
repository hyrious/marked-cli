# Changelog

## 0.2.19

- Upgrade github-markdown-css and marked.js.

## 0.2.17

- Upgrade github-markdown-css, note that the link color is changed a bit.
- Pausing upgrading `marked` related libraries since they are migrating to [new renderer implementation](https://github.com/markedjs/marked/releases/tag/v13.0.0).
  That causes the `renderer` option cannot capture `this` correctly. Maybe I will investigate the
  new integration when I'm not lazy.

## 0.2.16

- Upgrade all dependencies.

## 0.2.15

- Fix resolving algorithm in folder different from CWD.

## 0.2.14

- Upgraded all dependencies (Marked 11).
- Changed Note/Warning implementation to match latest behavior, see https://github.com/orgs/community/discussions/16925.

## 0.2.13

- Upgraded all dependencies (Marked 9).
- Changed Note/Warning implementation to match latest behavior (`> [!NOTE]`).

## 0.2.12

- Upgraded all dependencies.
- Support new delimiter syntax for math `` $` ``, see https://github.blog/changelog/2023-05-08-new-delimiter-syntax-for-inline-mathematical-expressions.

## 0.2.11

- Upgraded all dependencies.

## 0.2.10

- Fixed slugger (which renders heading id) not taking raw text into account.
- Included `marked-linkify-it` plugin, this may not be consist with github.

## 0.2.9

- Changed auto scroll behavior, it only occurs once (on init) now.
- Now when you scroll the page, the location.hash will be updated too.

## 0.2.8

- Support ` ```math `, see https://github.blog/changelog/2022-06-28-fenced-block-syntax-for-mathematical-expressions.
- Transform `> **Warning**` like GitHub does.

## 0.2.7

- Fixed an edge case where mermaid error still exist.
- Support footnote.
- Support emoji.
- Support front matter.

## 0.2.6

- Support auto-link `#id` to issue.
- Transform `> **Note**` like GitHub does.

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
