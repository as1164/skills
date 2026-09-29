# Are.na API notes

Base URL: `https://api.are.na/v3`
Auth header: `Authorization: Bearer <token>`

## Endpoints that matter

| Purpose | Endpoint |
| --- | --- |
| Verify auth, read tier | `GET /me` |
| Channel metadata | `GET /channels/:slug` |
| Channel contents | `GET /channels/:slug/contents?page=1&per=100` |
| Block detail | `GET /blocks/:id` |
| **Where else a block lives** | `GET /blocks/:id/connections` |
| User's channels | `GET /users/:slug/contents?type=Channel` |
| Group's channels | `GET /groups/:slug/contents?type=Channel` |
| Global search | `GET /search` — **Premium only** |

## Rate limits

Per minute: guest 30, free 120, premium 300, supporter 600. Headers on every
response: `X-RateLimit-Limit`, `X-RateLimit-Tier`, `X-RateLimit-Reset`.

Interactive moodboard work never approaches these. Bulk enumeration does — and
Are.na's acceptable-use terms explicitly prohibit scraping and systematic
harvesting. Keep requests on-demand.

## Gotchas

**Search is Premium-gated.** `GET /search` returns
`403 {"error":"Forbidden","details":{"message":"This endpoint requires a Premium subscription"}}`
on free accounts. Discovery must go through groups, users, and block
connections instead. Do not write a workflow that assumes search works.

**Use `image.src`, not the variants.** Each image block exposes
`image.src` (the `original_` file on CloudFront) plus `small`, `medium`,
`large`, `square`. The variants are re-encoded and downscaled. The original is
why Are.na images look sharp — use it.

**Descriptions are structured.** `block.description` is an object with
`markdown`, `html`, and `plain`. Use `plain` for captions. It usually contains
a date on the first line and a credit on a later line; parse accordingly.

**Some blocks have no image.** `Text`, `Link`, and `Attachment` blocks carry no
`image` key. Skip them.

**`meta.has_more_pages`** drives pagination. Do not loop eagerly through a
large channel; fetch the first page and go deeper only if needed.

**Channel slugs are not stable-looking.** They often carry a suffix, e.g.
`renaissance-revival-m1kfonfzjmu`, `cyber-kg071zmum2q`. Copy them verbatim;
do not try to construct them from a title.

## Useful groups

- `consumer-aesthetics-research-institute` (CARI) — ~90 curated aesthetic
  channels, each with a written thesis. The best single starting point.
