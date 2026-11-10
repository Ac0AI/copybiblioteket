import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { ROOT } from "../library.js";
import { findSlop } from "../../client/slop.js";
// @ts-expect-error The generator is a plain module without types.
import { stalePluginFiles } from "../../scripts/build-plugin.mjs";

const plugin = join(ROOT, "plugins", "sigge");
const json = (path: string) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const skills = readdirSync(join(plugin, "skills"));

test("the files the plugin carries are generated from the current data", async () => {
  assert.deepEqual(await stalePluginFiles(), [], "Run npm run build:plugin");
});

test("the three manifests describe the same plugin and the same connection", () => {
  const claude = json("plugins/sigge/.claude-plugin/plugin.json"), portable = json("plugins/sigge/plugin.json"), codex = json("plugins/sigge/.codex-plugin/plugin.json");
  for (const key of ["name", "version", "description", "license", "homepage"]) {
    assert.equal(portable[key], claude[key], key);
    assert.equal(codex[key], claude[key], key);
  }
  assert.equal(claude.name, "sigge");
  assert.deepEqual(portable.extensions["com.openai"].interface, codex.interface);
  const { displayName, shortDescription, composerIcon, logo } = codex.interface;
  assert.ok(displayName.length <= 30 && shortDescription.length <= 30, "The plugin directory cuts longer names");
  for (const asset of [composerIcon, logo]) assert.ok(existsSync(join(plugin, asset)), asset);
  assert.ok(existsSync(join(plugin, codex.onboardingSkill)));
  assert.equal(json("plugins/sigge/.mcp.json").mcpServers.sigge.url, "https://sigge.si/mcp");
  assert.equal(json("plugins/sigge/mcp.json").mcpServers.sigge.url, "https://sigge.si/mcp");
  assert.equal(json(".claude-plugin/marketplace.json").plugins[0].source, "./plugins/sigge");
  const entry = json(".agents/plugins/marketplace.json").plugins[0];
  assert.equal(entry.source.path, "./plugins/sigge");
  // The plugin must work before anyone signs in.
  assert.equal(entry.policy.authentication, "ON_USE");
});

test("every skill is complete on its own and uses only portable frontmatter", () => {
  assert.deepEqual(skills.sort(), ["check", "review", "start", "write"]);
  for (const skill of skills) {
    const dir = join(plugin, "skills", skill), text = readFileSync(join(dir, "SKILL.md"), "utf8");
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
    const fields = Object.fromEntries(frontmatter.split("\n").map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1).trim()]));
    assert.deepEqual(Object.keys(fields), ["name", "description"], skill);
    assert.equal(fields.name, skill);
    assert.ok(fields.description.length <= 1024, skill + " description is too long for some clients");
    for (const [, target] of text.matchAll(/\]\((?!https?:)([^)#]+)\)/g)) assert.ok(existsSync(join(dir, target)), skill + " links to a missing file: " + target);
    for (const [, script] of text.matchAll(/node (scripts\/[\w.-]+)/g)) assert.ok(existsSync(join(dir, script)), skill + " runs a missing script: " + script);
    assert.ok(!/claude|chatgpt|codex/i.test(text), skill + " must not name a specific assistant");
    assert.ok(existsSync(join(dir, "agents", "openai.yaml")));
  }
});

test("every bundled framework page is linked from its index", () => {
  for (const language of ["sv", "en"]) {
    const dir = join(plugin, "skills", "write", "references"), index = readFileSync(join(dir, `frameworks-${language}.md`), "utf8");
    const pages = readdirSync(join(dir, "frameworks", language));
    assert.equal(pages.length, 13);
    for (const page of pages) assert.ok(index.includes(`(frameworks/${language}/${page})`), page);
  }
});

test("the bundled checker finds what the site and the MCP tool find, and promotes nothing", () => {
  const checker = join(plugin, "skills", "check", "scripts", "check.mjs"), text = "I dagens snabbrörliga värld erbjuder vi en sömlös lösning. Studier visar det.";
  const run = (args: string[], input = text) => execFileSync(process.execPath, [checker, ...args], { input, encoding: "utf8", cwd: dirname(checker) });
  const result = JSON.parse(run(["--json"]));
  assert.deepEqual(result.findings.map((f: { quote: string }) => f.quote), findSlop(text).map((f) => f.quote));
  assert.equal(result.count, 3);
  const english = run(["--lang", "en"], "We leverage robust tools.");
  assert.match(english, /Empty words: "leverage"/);
  assert.equal(english.trim().split("\n").length, 3, "Only the summary and the two findings");
  assert.match(run(["--lang", "en"], "We sell bikes."), /No AI-writing patterns found/);
  assert.throws(() => run(["--lang", "de"]));
});
