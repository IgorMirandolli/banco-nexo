const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { resolvePublicPath } = require("../scripts/serve.cjs");
test("servidor local entrega apenas HTML e assets públicos", () => {
  assert.equal(path.basename(resolvePublicPath("/")), "index.html");
  assert.equal(path.basename(resolvePublicPath("/assets/js/voice.js?v=1")), "voice.js");
  for (const value of ["/.git/config", "/package.json", "/tests/voice.test.cjs", "/assets/../README.md", "/assets/%2e%2e/README.md", "/assets/%5c..%5cpackage.json", "/%zz"]) assert.equal(resolvePublicPath(value), null, value);
});
