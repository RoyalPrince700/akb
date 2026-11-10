import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "taskboard");

const BUILTIN = new Set([
  "Fragment",
  "Suspense",
  "StrictMode",
  "Icon",
  "FieldLabel",
]);

function scan(file) {
  const source = fs.readFileSync(file, "utf8");
  const importMatch = source.match(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/);
  const imported = new Set(
    importMatch
      ? importMatch[1]
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
      : []
  );

  const used = new Set();
  for (const match of source.matchAll(/<([A-Z][a-zA-Z0-9]*)(?:\s|\/|>)/g)) {
    used.add(match[1]);
  }
  for (const match of source.matchAll(/\bicon:\s*([A-Z][a-zA-Z0-9]*)/g)) {
    used.add(match[1]);
  }

  const missing = [...used].filter(
    (name) => !imported.has(name) && !BUILTIN.has(name) && /^[A-Z]/.test(name)
  );

  // Heuristic: lucide icons are PascalCase single words (no nested components from local files)
  const likelyLucide = missing.filter(
    (name) =>
      !source.includes(`function ${name}`) &&
      !source.includes(`const ${name}`) &&
      !source.includes(`import ${name}`) &&
      !source.includes(`import { ${name}`) &&
      !source.includes(`, ${name},`) &&
      !source.includes(`, ${name} }`)
  );

  if (likelyLucide.length) {
    console.log(`${path.relative(root, file)}: ${likelyLucide.join(", ")}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.jsx?$/.test(entry.name)) scan(full);
  }
}

walk(root);
