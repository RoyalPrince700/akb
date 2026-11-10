import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "taskboard");

const REACT = new Set([
  "Suspense",
  "Fragment",
  "StrictMode",
  "Profiler",
  "Activity",
]);

function parseImports(source) {
  const bindings = new Set();
  for (const match of source.matchAll(
    /import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*["'][^"']+["']/g
  )) {
    if (match[1]) bindings.add(match[1]);
    if (match[2]) {
      for (const part of match[2].split(",")) {
        const name = part.trim().split(/\s+as\s+/).pop().trim();
        if (name) bindings.add(name);
      }
    }
  }
  for (const match of source.matchAll(/import\s+(\w+)\s+from/g)) {
    bindings.add(match[1]);
  }
  return bindings;
}

function scan(file) {
  const source = fs.readFileSync(file, "utf8");
  const bindings = parseImports(source);
  const local = new Set();
  for (const match of source.matchAll(
    /(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/g
  )) {
    local.add(match[1]);
  }

  const used = new Set();
  for (const match of source.matchAll(/<([A-Z][a-zA-Z0-9]*)(?:\s|\/|>)/g)) {
    used.add(match[1]);
  }
  for (const match of source.matchAll(/\bicon:\s*([A-Z][a-zA-Z0-9]*)/g)) {
    used.add(match[1]);
  }

  const missing = [...used].filter(
    (name) =>
      !bindings.has(name) &&
      !local.has(name) &&
      !REACT.has(name) &&
      name !== "Icon"
  );

  if (missing.length) {
    console.log(path.relative(root, file), "→", missing.join(", "));
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".jsx")) scan(full);
  }
}

walk(root);
