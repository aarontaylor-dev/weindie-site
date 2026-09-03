# weindie

Source for [weindie.com](https://weindie.com).

WeIndie is a small independent workbench for practical AI work. The site explains
what WeIndie is, and gives each skill in the current **Spec First** set
(`/spec`, `/drift`, `/kiss`, `/ship`) a page you can send to someone.

## The model

    canonical skill  +  platform packaging  =  platform download
    canonical skill  +  your preferences    =  custom skill

There is exactly one version of each skill. There are no separate Claude Code,
Cursor or Codex variants — only different install paths.

## What is here

    skills/
      catalogue.json        which skills exist, and in what order
      <slug>/SKILL.md       the canonical skill — the single source of truth
      <slug>/skill.json     page content and customisation options

    fonts/                  self-hosted woff2 + OFL licences (no third-party requests)

    src/
      site.css              styling shared by every generated page
      home.html             homepage template
      skill.js              skill-page behaviour (copy, customise, diff, download)

    build.js                the generator — no dependencies
    404.html                not-found page, hand-maintained

Everything else in the repository root is **generated**. Do not edit it by hand:

    index.html              homepage
    <slug>.html             skill page      -> weindie.com/<slug>
    <slug>/SKILL.md         raw skill       -> weindie.com/<slug>/SKILL.md
    og.svg, og.png          homepage link-preview card
    og/<slug>.svg, .png     per-skill link-preview cards

The page is `<slug>.html` rather than `<slug>/index.html` on purpose: Cloudflare
Pages serves `/kiss` straight from `kiss.html`, where a directory would
308-redirect to `/kiss/` and leave the address bar disagreeing with the canonical
tag. These URLs get pasted into conversations, so the short form should be what
people end up on.

## Build

    node build.js

Requires Node and, for the link-preview images, macOS `sips`. Generated PNGs are
only rebuilt when their SVG is newer, so a normal build does no image work.

The build refuses to run if a skill is inconsistent. It checks that:

- the `name` in SKILL.md frontmatter matches the folder name
- `metadata.source` matches the public URL
- every customisation option has exactly one default
- each default option line appears in SKILL.md **exactly once**
- no non-default option line appears in SKILL.md
- the bullets under "Defaults you can change" correspond one-to-one with the
  options in `skill.json`

That last set is what keeps customisation honest: the browser generates a custom
skill by replacing those exact lines, so if the text drifts apart the build stops
rather than silently producing a file that changes nothing.

## Adding a skill

1. `mkdir skills/<slug>` and add `SKILL.md` and `skill.json`. Copy an existing
   pair — the shapes are small and self-explanatory.
2. Add the slug to `skills/catalogue.json`.
3. `node build.js`, then commit the generated output.

Nothing assumes a particular number of skills.

## Frontmatter

SKILL.md frontmatter stays inside the six fields of the
[Agent Skills specification](https://agentskills.io/specification). Version and
source live in the `metadata` map so the file remains spec-valid:

    ---
    name: drift
    description: ...
    license: MIT
    metadata:
      version: "0.1"
      source: https://weindie.com/drift
    ---

A customised download adds `based_on: WeIndie /drift v0.1` to the same map.

## Local preview

    python3 -m http.server 8787

Then <http://127.0.0.1:8787/>. Locally, skill pages need the extension
(`/kiss.html`) — Cloudflare Pages resolves the extensionless `/kiss` in
production, Python's server does not.

## Type

Two self-hosted faces, latin subset, ~78 kB total:

    IBM Plex Mono   structure, labels, code, skill names
    Newsreader      questions and prose (one variable file, weights 400-600)

They are served from `/fonts/` rather than a font CDN so the site keeps making
zero third-party requests. See `fonts/README.md`.

## Privacy

No analytics, no trackers, no third-party requests, no build-time or run-time
network calls, no cookies, no storage. Problem matching, customisation and
download generation all happen in the visitor's browser. The claim on the site
that nothing leaves the browser is literally true — keep it that way.

## Deployment

Production is **Cloudflare Pages**, project `weindie-site`, connected to this
repository. Pushing to `main` deploys automatically.

    Production branch    main
    Build command        (none — generated output is committed)
    Output directory     / (repository root)
    Pages hostname       weindie-site.pages.dev
    Canonical hostname   weindie.com

Pages has no build command on purpose: the generated files are committed, so the
deployed site is exactly what is in the repository, and Pages stays a plain
static host. Run `node build.js` before committing.

`https://www.weindie.com` redirects to `https://weindie.com` with a 301 that
preserves the path and query string.

## Repository status

This repository is **private**.

## Licensing

MIT — see `LICENSE.txt`. This covers the site and the skills.

The site copy says the work can be used, changed and forked; the licence is what
makes that true rather than merely stated. Each canonical `SKILL.md` also carries
`license: MIT` in its frontmatter, so a downloaded skill states its own terms
without needing to be traced back here.

`LICENSE.txt` rather than `LICENSE` so the same file is both recognised by GitHub
and served as readable text at <https://weindie.com/LICENSE.txt>.

The copyright line names **WeIndie**. Change it to a legal name if you would
rather the licence identify a person or company.
