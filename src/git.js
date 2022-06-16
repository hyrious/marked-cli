import fs from "fs";
import path from "path";

export function repo(cwd) {
  let gitconfig = path.join(cwd, ".git/config");
  if (fs.existsSync(gitconfig) && fs.statSync(gitconfig).isFile()) {
    let config = fs.readFileSync(gitconfig, "utf8");
    let match = /github.com\/(\w+\/\w+)/.exec(config);
    if (match) {
      return match[1];
    }
  }
}
