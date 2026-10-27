// Copies the files the app needs into www/ — the web directory a native wrapper (Capacitor) packages into the iOS app.
// The repository root also holds tests and tooling, which must not ship inside the app.
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const FILES = ['index.html', 'manifest.json', 'sw.js', 'icons'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of FILES) {
  const src = join(root, f);
  if (!existsSync(src)) throw new Error(`missing ${f}`);
  cpSync(src, join(out, f), { recursive: true });
}
console.log(`www/ ready: ${FILES.join(', ')}`);
