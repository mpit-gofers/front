import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
const gitIndexText = readFileSync(new URL("../.git/index", import.meta.url)).toString("utf8");

function test(name, assertion) {
  try {
    assertion();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("package metadata names the Drivee frontend instead of the Figma import", () => {
  assert.equal(packageJson.name, "@drivee/decision-room-front");
});

test("package exposes a single review quality gate", () => {
  assert.equal(typeof packageJson.scripts.test, "string");
  assert.equal(typeof packageJson.scripts["test:all"], "string");
  assert.match(packageJson.scripts["test:all"], /test:api-contract/);
  assert.match(packageJson.scripts["test:all"], /test:repository-hygiene/);
  assert.match(packageJson.scripts["test:all"], /test:build-chunks/);
});

test("generated and vendored directories are not tracked by git", () => {
  for (const forbiddenPrefix of ["dist/", "node_modules/"]) {
    assert.equal(
      gitIndexText.includes(forbiddenPrefix),
      false,
      `${forbiddenPrefix} must not be committed`,
    );
  }
});

test("gitignore protects local frontend artifacts", () => {
  const gitignoreUrl = new URL("../.gitignore", import.meta.url);
  assert.equal(existsSync(gitignoreUrl), true);
  const gitignore = readFileSync(gitignoreUrl, "utf8");

  for (const pattern of ["node_modules/", "dist/", ".vite-dev*.log", "npm-debug.log*"]) {
    assert.match(gitignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("README documents tests instead of claiming they do not exist", () => {
  assert.doesNotMatch(readme, /нет отдельных npm-скриптов для lint\/test\/typecheck/);
  assert.match(readme, /npm run test\b/);
  assert.match(readme, /npm run build\b/);
});

test("Docker build installs dependencies from package lock", () => {
  assert.match(dockerfile, /COPY package\.json package-lock\.json \.\//);
  assert.match(dockerfile, /RUN npm ci\b/);
  assert.doesNotMatch(dockerfile, /RUN npm install\b/);
});
