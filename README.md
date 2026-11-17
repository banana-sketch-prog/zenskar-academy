# Zenskar Academy

Internal learning site for new Zenskar joiners: short lessons, worked examples, edge cases,
API calls you can paste into Postman, a quiz and 20+ Q&A per module.

**Internal only.** Do not publish this repo or the built site publicly. It contains
product behaviour notes that are still being reviewed.

## How it is organised

```
content/
  modules/01-pricing.json ... 12-admin.json   one file per module (all the text)
  endpoints.json                              API endpoints, sample bodies, Postman setup
src/
  app.js, styles.css, index.template.html     the page (you rarely need to touch these)
scripts/
  validate.js                                 checks content files (run in CI)
  build.js                                    builds dist/index.html, one self-contained file
```

## Run it locally

Needs Node 18 or newer. No packages to install.

```
npm run build      # validates content, writes dist/index.html
open dist/index.html
```

## Correct or add content

Edit the JSON file for the module, then open a pull request. You never edit code for content.

| Section | Where in the module file |
|---|---|
| Lesson cards | `learn.subs[].cards[]` with `title`, `body`, `example` |
| Edge cases | `edgeCases[]` (one string each) |
| Quiz | `quiz[]` with `question`, `options`, `answer` (0-based index), `explanation` |
| Q&A | `qa[]` with `type` (Difference, Use case, Edge case or How it works), `question`, `answer` |
| API tab | `api.groups[]` (operation names) and `endpoints.json` (paths and bodies) |
| Right-hand takeaways | `takeaways[]` |

Strings may contain simple HTML (`<b>`, `<i>`, `<code>`). Only trusted contributors should
have write access, since content is rendered as HTML.

`npm run validate` enforces: at least 4 quiz questions, at least 20 Q&A per module, valid
answer indexes, and consistent review fields.

## Review process

Every module starts as `"status": "draft"` and shows a "not yet reviewed" badge. When a
Zenskar SME has checked a module, set:

```json
"review": { "status": "reviewed", "reviewedBy": "Name", "date": "2026-12-01" }
```

Items that need an SME's eyes first: Step and Matrix pricing behaviour, the usage-events
update operation, payment amount formats, and anything that differs between the classic and
Contracts V3 experiences.

## Customer use cases

Client stories and edge cases from call notes (Avoma) can be added as new `qa` entries,
`edgeCases` or a new `learn.subs` section. Anonymise customer names unless leadership
agrees otherwise.

## Deploy (internal)

1. Keep this repo private in the Zenskar GitHub organization.
2. Host `dist/index.html` behind company login. Options: Cloudflare Pages with Cloudflare Access,
   Netlify or Vercel with SSO or password protection, or the intranet.
3. To deploy on every merge to `main`, set the repository variable `DEPLOY_ENABLED=true` and the
   secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, then see `.github/workflows/deploy.yml`.

Do not use public GitHub Pages: it is reachable by anyone with the link.

## Sources

Drafted from Zenskar's public documentation and API reference (2024-03-01 and 2026-03-01
versions). Anything marked "confirm with an SME" in the site has not been verified against a
live tenant. Quiz progress is stored only in each learner's browser.
