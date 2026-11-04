import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "punctuation-archive-"));
const index = path.join(root, "index");
const env = { ...process.env, GIT_INDEX_FILE: index };
try {
  execFileSync("git", ["read-tree", "HEAD"], { env });
  execFileSync("git", ["add", "-A", "--", "."], { env });
  const tree = execFileSync("git", ["write-tree"], {
    env,
    encoding: "utf8",
  }).trim();
  const archive = execFileSync("git", ["archive", "--format=tar", tree]);
  const names = execFileSync("tar", ["-tf", "-"], {
    input: archive,
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  for (const name of [
    "index.php",
    "index.js",
    "index.css",
    "composer.json",
    "LICENSE",
    "src/fields/PunctuationField.php",
  ])
    assert(names.includes(name), `Archive needs ${name}`);
  for (const name of names)
    assert(
      !/^(?:vendor\/|node_modules\/|tests\/|tools\/|\.github\/|src\/panel\/|package-lock\.json)/.test(
        name,
      ),
      `Archive includes development file ${name}`,
    );
  process.stdout.write(
    `${String("Punctuation release archive includes the native PHP field and compiled assets.")}\n`,
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
