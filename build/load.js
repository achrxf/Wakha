// Loads the content files in one scope for build scripts.
const fs = require("fs"), path = require("path"), vm = require("vm");
module.exports = function load() {
  const src = ["content_v1.js", "content_v2.js"].map((f) => fs.readFileSync(path.join(__dirname, "../src", f), "utf8")).join("\n");
  const ctx = { module: { exports: {} }, console };
  vm.createContext(ctx);
  vm.runInContext(src.replace('if (typeof module !== "undefined") module.exports', "module.exports"), ctx);
  return ctx.module.exports;
};
