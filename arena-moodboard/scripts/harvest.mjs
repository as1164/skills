#!/usr/bin/env node
// Harvest image blocks from an Are.na channel.
// Usage: node harvest.mjs <channel-slug> [per]
//
// Emits JSON: [{ title, year, credit, src, block_id }]
// Uses image.src (the original_ file), never thumbnail variants.

const token = process.env.ARENA_TOKEN;
if (!token) {
  console.error("ARENA_TOKEN is not set. Get one at https://www.are.na/settings/personal-access-tokens");
  process.exit(1);
}

const slug = process.argv[2];
const per = Number(process.argv[3] || 50);
if (!slug) {
  console.error("Usage: node harvest.mjs <channel-slug> [per]");
  process.exit(1);
}

const base = "https://api.are.na/v3";
const headers = { Authorization: `Bearer ${token}` };

async function main() {
  const out = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && out.length < per) {
    const url = `${base}/channels/${encodeURIComponent(slug)}/contents?page=${page}&per=100`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const body = await res.text();
      console.error(`HTTP ${res.status} fetching ${url}`);
      console.error(body.slice(0, 400));
      process.exit(1);
    }

    const json = await res.json();
    const data = json.data || [];

    for (const b of data) {
      // Only blocks that actually carry an image.
      if (!b.image || !b.image.src) continue;

      const desc = (b.description && b.description.plain) || "";
      out.push({
        title: b.title || null,
        // Year is often the first 4-digit token in the description.
        year: (desc.match(/\b(1[89]\d{2}|20\d{2})\b/) || [])[1] || null,
        // Credit is whatever follows the year/date line, if present.
        credit: desc.split("\n").map((s) => s.trim()).filter(Boolean).slice(1).join(" · ") || null,
        src: b.image.src,
        block_id: b.id,
      });

      if (out.length >= per) break;
    }

    hasMore = Boolean(json.meta && json.meta.has_more_pages);
    page += 1;
  }

  console.log(JSON.stringify(out, null, 1));
}

main().catch((e) => {
  console.error("harvest failed:", e.message);
  process.exit(1);
});
