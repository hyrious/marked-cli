#!/usr/bin/env bash
set -ex
function download {
  if [ -z "$2" ]; then
    wget -q -e use_proxy=yes -e https_proxy=http://localhost:7890 -P vendors $1
  else
    wget -q -e use_proxy=yes -e https_proxy=http://localhost:7890 -P vendors $1 -O $2
  fi
}
rm -r vendors
mkdir vendors
ver=$(curl -s https://api.github.com/repos/highlightjs/cdn-release/git/refs/tags | jq '.[-1].ref' | grep -Eo '[0-9.]+')
download https://cdn.jsdelivr.net/gh/hyrious/github-markdown-css@main/github-markdown.css
download https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@$ver/build/highlight.min.js
download https://cdn.jsdelivr.net/npm/marked vendors/marked.min.js
download https://cdn.jsdelivr.net/npm/mermaid@latest/dist/mermaid.min.js
download https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@$ver/build/styles/github.min.css
download https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@$ver/build/styles/github-dark.min.css
