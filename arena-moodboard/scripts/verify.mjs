#!/usr/bin/env node
// Verify every image URL in a moodboard resolves.
// Usage: node verify.mjs <board.html>
//
// Prints "total=N bad=M" and lists failures.

import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node verify.mjs <board.html>");
  process.exit(1);
}

const html = readFileSync(file, "utf8");
const urls = [...new Set([...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))];

if (urls.length === 0) {
  console.error("No image URLs found in", file);
  process.exit(1);
}

async function check(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok || res.status === 405; // some CDNs reject HEAD
  } catch {
    return false;
  }
}

const results = await Promise.all(urls.map(async (u) => [u, await check(u)]));
const bad = results.filter(([, ok]) => !ok);

for (const [u] of bad) console.error("BAD:", u);
console.log(`total=${urls.length} bad=${bad.length}`);
process.exit(bad.length === 0 ? 0 : 2);
