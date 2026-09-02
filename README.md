# weindie

Source for [weindie.com](https://weindie.com) — the WeIndie homepage.

WeIndie is a small independent workbench for practical AI work. The site is
deliberately plain: it explains what WeIndie is, lists the current Spec First
skills (`/spec`, `/drift`, `/kiss`, `/ship`), and lets a visitor describe a
problem and take away a starter skill file.

## What is here

    index.html    the entire site — HTML, CSS and JavaScript in one file
    README.md     this file
    .gitignore

That is the whole thing on purpose. There is no framework, no build step, no
CMS, no database, no analytics, no trackers, and no third-party requests. The
page loads one file and nothing else.

## Local preview

Open `index.html` directly in a browser, or serve it:

    python3 -m http.server 8787

Then visit <http://127.0.0.1:8787/index.html>.

## Deployment

Production is served by **Cloudflare Pages**, project `weindie-site`, connected
to this repository. Pushing to `main` deploys automatically.

    Production branch    main
    Build command        (none)
    Output directory     / (repository root)
    Pages hostname       weindie-site.pages.dev
    Canonical hostname   weindie.com

`https://www.weindie.com` redirects to `https://weindie.com` with a 301 that
preserves the path and query string. The Pages hostname stays available and is
useful for checking a deploy independently of DNS.

## Repository status

This repository is **private**.

## Licensing

Not yet specified. The site copy talks about work being open and forkable, but
no licence has been chosen for this repository, so no `LICENSE.md` is included.
Until a licence is added, default copyright applies.
