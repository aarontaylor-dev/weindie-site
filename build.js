#!/usr/bin/env node
/*
 * WeIndie site build.
 *
 * Reads the canonical skills in skills/ and writes the public pages.
 * No dependencies, no framework. Run: node build.js
 *
 *   skills/<slug>/SKILL.md    canonical skill — the single source of truth
 *   skills/<slug>/skill.json  page content and customisation options
 *   skills/catalogue.json     which skills exist, and in what order
 *
 * Generated output (do not edit by hand):
 *   <slug>.html         the public page          -> https://weindie.com/<slug>
 *   <slug>/SKILL.md     copy of the canonical    -> https://weindie.com/<slug>/SKILL.md
 *   index.html          homepage
 *   og.svg, og/<slug>.svg + .png   link-preview cards
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const ORIGIN = 'https://weindie.com';
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
/* Only touch a file when its contents actually change, so mtimes stay meaningful
   (the PNG step below compares them) and rebuilds produce no spurious diffs. */
const write = (p, s) => {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full) && fs.readFileSync(full, 'utf8') === s) return;
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, s);
};
const fail = m => { console.error('build failed: ' + m); process.exit(1); };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
/* Safe to embed inside <script>. */
const json = v => JSON.stringify(v).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e');

/* Where each environment looks for Agent Skills. Verified against vendor docs. */
const PLATFORMS = [
  {
    id: 'claude', name: 'Claude Code',
    project: '.claude/skills/<slug>/SKILL.md',
    user: '~/.claude/skills/<slug>/SKILL.md',
    note: 'Project skills also load from any parent directory up to the repository root. On a name clash, a personal skill wins over a project one.',
    docs: 'https://code.claude.com/docs/en/skills', docsLabel: 'Claude Code skills documentation'
  },
  {
    id: 'cursor', name: 'Cursor',
    project: '.cursor/skills/<slug>/SKILL.md',
    user: '~/.cursor/skills/<slug>/SKILL.md',
    note: 'Cursor also reads .agents/skills/, .claude/skills/ and .codex/skills/, so a skill installed for another tool is usually already available.',
    docs: 'https://cursor.com/docs/skills', docsLabel: 'Cursor skills documentation'
  },
  {
    id: 'codex', name: 'OpenAI / Codex',
    project: '.agents/skills/<slug>/SKILL.md',
    user: '~/.agents/skills/<slug>/SKILL.md',
    note: 'Codex scans .agents/skills in every directory from the working directory up to the repository root.',
    docs: 'https://developers.openai.com/codex/skills', docsLabel: 'Codex skills documentation'
  },
  {
    id: 'generic', name: 'Generic',
    project: '.agents/skills/<slug>/SKILL.md',
    user: '~/.agents/skills/<slug>/SKILL.md',
    note: 'The Agent Skills specification defines the folder and the SKILL.md format, but leaves it to each tool to decide where to look. .agents/skills/ is the most widely read location — check your tool if it is not picked up.',
    docs: 'https://agentskills.io/specification', docsLabel: 'Agent Skills specification'
  }
];

/* ---------------------------------------------------------------- parsing */

function frontmatter(md, where) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(md);
  if (!m) fail(where + ': no frontmatter');
  const out = { metadata: {} };
  let inMeta = false;
  for (const raw of m[1].split('\n')) {
    if (/^\s*$/.test(raw)) continue;
    if (/^metadata:\s*$/.test(raw)) { inMeta = true; continue; }
    const indented = /^\s+\S/.test(raw);
    if (inMeta && indented) {
      const kv = /^\s+([\w-]+):\s*(.*)$/.exec(raw);
      if (kv) out.metadata[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
      continue;
    }
    inMeta = false;
    const kv = /^([\w-]+):\s*(.*)$/.exec(raw);
    if (kv) out[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}

function loadSkill(slug) {
  const where = 'skills/' + slug;
  const canonical = read(where + '/SKILL.md');
  const meta = JSON.parse(read(where + '/skill.json'));
  const fm = frontmatter(canonical, where + '/SKILL.md');

  if (fm.name !== slug) fail(where + ': frontmatter name "' + fm.name + '" must match the folder name');
  if (!fm.description) fail(where + ': frontmatter needs a description');
  const version = fm.metadata.version, source = fm.metadata.source;
  if (!version) fail(where + ': frontmatter metadata needs a version');
  if (source !== ORIGIN + '/' + slug) fail(where + ': metadata.source should be ' + ORIGIN + '/' + slug);

  /* The customisable lines must be exactly the bullets under this heading. */
  const sec = /\n## Defaults you can change\n\n([\s\S]*?)\n\n(- \*\*[\s\S]*)$/.exec(canonical);
  if (!sec) fail(where + ': SKILL.md needs a "## Defaults you can change" section with an intro paragraph and bullets');
  const defaultsNote = sec[1];
  const bullets = sec[2].trim().split('\n').filter(l => l.trim());

  const defaults = [];
  for (const o of meta.options) {
    const d = o.choices.filter(c => c.default);
    if (d.length !== 1) fail(where + ': option "' + o.id + '" needs exactly one default choice');
    for (const c of o.choices) {
      const hits = canonical.split(c.line).length - 1;
      if (c.default && hits !== 1) fail(where + ': the default line for "' + o.id + '/' + c.id + '" appears ' + hits + ' times in SKILL.md — it must appear exactly once');
      if (!c.default && hits !== 0) fail(where + ': the non-default line for "' + o.id + '/' + c.id + '" also appears in SKILL.md');
    }
    defaults.push(d[0].line);
  }
  for (const b of bullets) {
    if (!defaults.includes(b)) fail(where + ': SKILL.md has an adjustable bullet with no matching option in skill.json:\n  ' + b);
  }
  if (defaults.length !== bullets.length) fail(where + ': skill.json has ' + defaults.length + ' options but SKILL.md lists ' + bullets.length + ' adjustable bullets');

  return Object.assign({}, meta, {
    slug, canonical, defaultsNote, version, source,
    description: fm.description,
    raw: ORIGIN + '/' + slug + '/SKILL.md',
    url: ORIGIN + '/' + slug
  });
}

/* ------------------------------------------------------------ page pieces */

const CSS = read('src/site.css');
const SKILL_JS = read('src/skill.js');
const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23315c4d'/%3E%3Cpath d='M8 22L14 10M18 22l6-12' fill='none' stroke='%23fbfaf7' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E";

function head(o) {
  return `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(o.title)}</title>
  <meta name="description" content="${esc(o.description)}">
  <link rel="canonical" href="${esc(o.url)}">
  <link rel="icon" href="${FAVICON}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="WeIndie">
  <meta property="og:title" content="${esc(o.title)}">
  <meta property="og:description" content="${esc(o.description)}">
  <meta property="og:url" content="${esc(o.url)}">
  <meta property="og:image" content="${esc(o.image)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(o.imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(o.title)}">
  <meta name="twitter:description" content="${esc(o.description)}">
  <meta name="twitter:image" content="${esc(o.image)}">
  <meta name="twitter:image:alt" content="${esc(o.imageAlt)}">
  <link rel="preload" href="/fonts/ibm-plex-mono-500.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/newsreader-var.woff2" as="font" type="font/woff2" crossorigin>
  <style>${CSS}</style>`;
}

const FOOTER = `<footer class="wrap"><div class="foot">\
<b>weindie</b>\
<span>Independent tools for navigating work with AI.</span>\
<span>v1.1 &middot; early and evolving</span>\
<span><a href="/LICENSE.txt">MIT licensed</a></span>\
</div></footer>`;

/* --------------------------------------------------------- the skill page */

/* Sections are numbered because a skill page is read in order by someone who
   arrived cold: what it is, what it looks like, try it, when, install, own it. */
function block(n, name, inner) {
  return `<section class="blk" id="${name.toLowerCase().replace(/[^a-z]+/g, '-')}">
      <div class="rail"><div class="n">&sect; ${n}</div><h2>${esc(name)}</h2></div>
      <div class="body">${inner}</div>
    </section>`;
}

function skillPage(s, all, project) {
  const others = all.filter(x => x.slug !== s.slug);
  const li = a => a.map(x => `<li>${esc(x)}</li>`).join('');

  const example = `<p class="lede">${esc(s.example.caption)}</p>
        <div class="chat">${s.example.turns.map(t => {
          const isSkill = t.who.startsWith('/');
          return `<div class="msg${isSkill ? ' skill' : ''}"><div class="who">${esc(t.who)}</div><p>${esc(t.text)}</p></div>`;
        }).join('')}</div>`;

  const tryOnce = `<p class="lede">Nothing to install. Copy this into a conversation that is already underway, and see whether the idea is useful before you commit to it.</p>
        <pre class="code" id="tryPrompt">${esc(s.tryOnce)}</pre>
        <div class="btnrow"><button class="btn primary" id="copyTry">Copy prompt</button></div>
        <p class="small" style="margin-top:16px">A short, portable version. The installed skill carries the fuller behaviour &mdash; when to stay quiet, how to report, what not to flag &mdash; and neither needs your AI to be able to read this page.</p>`;

  const when = `<p class="lede">A skill that fires on everything stops meaning anything. <code>/${esc(s.slug)}</code> is allowed to find nothing.</p>
        <div class="two">
          <div><h3>Useful when</h3><ul>${li(s.usefulWhen)}</ul></div>
          <div><h3>Probably not needed when</h3><ul>${li(s.notNeededWhen)}</ul></div>
        </div>`;

  const install = `<p class="lede">One canonical skill, packaged for wherever you work.</p>
        <div class="seg" id="platforms" role="group" aria-label="Environment">
          ${PLATFORMS.map((p, i) => `<button data-platform="${esc(p.id)}" aria-pressed="${i === 0}">${esc(p.name)}</button>`).join('')}
        </div>
        <div class="dest">
          <div class="label">In a project</div>
          <div class="code oneline" id="destPath"></div>
          <div id="destUserRow"><div class="label">For all your projects</div><div class="code oneline" id="destUser"></div></div>
        </div>
        <p class="small" id="platformNote" style="margin-top:14px"></p>
        <div class="btnrow">
          <button class="btn primary" id="dlCanonical">Download SKILL.md</button>
          <button class="btn" id="copyCmd">Copy install command</button>
          <a class="btn" id="docsLink" href="#" target="_blank" rel="noreferrer noopener"></a>
        </div>
        <div class="label" style="margin:18px 0 6px">Or fetch it straight into place</div>
        <div class="code oneline" id="cmd"></div>`;

  const custom = `<p class="lede">A few choices that change how <code>/${esc(s.slug)}</code> behaves. Everything here happens in this browser &mdash; nothing is sent anywhere, and nothing is saved.</p>
        <div class="resting">
          <div class="now" id="restNow"></div>
          <button class="btn primary" id="dlCustom">Download /${esc(s.slug)}</button>
        </div>
        <details class="reveal" id="optsWrap"><summary>Change the defaults</summary><div id="opts"></div></details>
        <div class="changes" id="changes"></div>
        <details class="reveal"><summary>View generated SKILL.md</summary><pre class="code" id="gen"></pre></details>
        <details class="reveal"><summary id="diffTitle">Compare with default</summary><pre class="diff" id="diff"></pre></details>`;

  const source = `<p class="lede">The whole skill, and the same file every download is built from. Nothing downloadable here should be less inspectable than the page explaining it.</p>
        <pre class="code">${esc(s.canonical)}</pre>
        <div class="btnrow"><button class="btn" id="copySource">Copy SKILL.md</button><a class="btn" href="/${esc(s.slug)}/SKILL.md">Open raw file</a></div>`;

  const more = `<div class="index">${others.map(o =>
          `<a href="/${o.slug}"><span class="k">/${o.slug}</span><span class="q">${esc(o.question)}</span></a>`).join('')}</div>`;

  return `<!doctype html>
<html lang="en">
<head>
  ${head({
    title: '/' + s.slug + ' — WeIndie',
    description: s.share,
    url: s.url,
    image: ORIGIN + '/og/' + s.slug + '.png',
    imageAlt: '/' + s.slug + ' — ' + s.question
  })}
</head>
<body>
  <header class="wrap nav">
    <a class="brand" href="/">weindie</a>
    <nav class="navlinks">${others.map(o => `<a href="/${o.slug}">/${o.slug}</a>`).join('')}<a href="/#skills">All skills</a></nav>
  </header>
  <main class="wrap">
    <div class="shead">
      <div class="stitle"><h1>/${esc(s.slug)}</h1><span class="ver">${esc(project)} skill &middot; v${esc(s.version)}</span></div>
      <h2 class="squestion">${esc(s.question)}</h2>
      <p class="ssummary">${esc(s.summary)}</p>
      <div class="actions seg">
        <a class="on" href="#try-once">Try it once</a>
        <a href="#install">Install</a>
        <a href="#make-it-yours">Make it yours</a>
        <a href="#skill-source">SKILL.md</a>
      </div>
      <p class="crumbs">Sent this link by someone? <code>/${esc(s.slug)}</code> is a skill you can add to an AI coding tool &mdash; or just try the prompt below in a conversation you already have open.</p>
    </div>
    ${block(1, 'Example', example)}
    ${block(2, 'Try once', tryOnce)}
    ${block(3, 'When', when)}
    ${block(4, 'Install', install)}
    ${block(5, 'Make it yours', custom)}
    ${block(6, 'Skill source', source)}
    ${block(7, 'Other skills', more)}
  </main>
  ${FOOTER}
  <script>window.SKILL=${json({
    slug: s.slug, version: s.version, source: s.source, raw: s.raw,
    canonical: s.canonical, defaultsNote: s.defaultsNote,
    tryOnce: s.tryOnce, options: s.options.map(o => ({
      id: o.id, label: o.label, help: o.help,
      choices: o.choices.map(c => ({ id: c.id, label: c.label, line: c.line, isDefault: !!c.default }))
    })), platforms: PLATFORMS
  })};</script>
  <script>${SKILL_JS}</script>
</body>
</html>
`;
}

/* ----------------------------------------------------------- link preview */

function wrap(text, max) {
  const words = String(text).split(' '), lines = [];
  let line = '';
  for (const w of words) {
    if (line && (line + ' ' + w).length > max) { lines.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) lines.push(line);
  return lines;
}
const sesc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function ogCard(s, project) {
  const q = wrap(s.question, 34).slice(0, 2);
  const sum = wrap(s.summary, 62).slice(0, 2);
  const H = 'Helvetica Neue,Helvetica,Arial,sans-serif';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fbfaf7"/>
  <rect x="0" y="0" width="1200" height="8" fill="#315c4d"/>
  <text x="90" y="130" font-family="${H}" font-size="19" font-weight="700" letter-spacing="2.9" fill="#315c4d">${sesc(project.toUpperCase())} SKILL</text>
  <text x="86" y="240" font-family="Menlo,Consolas,monospace" font-size="86" letter-spacing="-3" fill="#16181a">/${sesc(s.slug)}</text>
${q.map((l, i) => `  <text x="88" y="${330 + i * 62}" font-family="Georgia,serif" font-size="54" letter-spacing="-2" fill="#16181a">${sesc(l)}</text>`).join('\n')}
${sum.map((l, i) => `  <text x="90" y="${(q.length > 1 ? 470 : 410) + i * 34}" font-family="${H}" font-size="23" fill="#54574f">${sesc(l)}</text>`).join('\n')}
  <line x1="90" y1="522" x2="1110" y2="522" stroke="#d9d7ce" stroke-width="1"/>
  <text x="88" y="570" font-family="${H}" font-size="27" font-weight="700" letter-spacing="-1.1" fill="#16181a">weindie</text>
  <text x="1110" y="570" text-anchor="end" font-family="Georgia,serif" font-size="22" fill="#54574f">weindie.com/${sesc(s.slug)} &#183; v${sesc(s.version)}</text>
</svg>
`;
}

function homeCard(skills) {
  const H = 'Helvetica Neue,Helvetica,Arial,sans-serif';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fbfaf7"/>
  <rect x="0" y="0" width="1200" height="8" fill="#315c4d"/>
  <text x="90" y="150" font-family="${H}" font-size="19" font-weight="700" letter-spacing="2.9" fill="#315c4d">WE ARE INDEPENDENT</text>
  <text x="86" y="290" font-family="Georgia,serif" font-size="80" letter-spacing="-3.2" fill="#16181a">Skills you can read</text>
  <text x="86" y="386" font-family="Georgia,serif" font-size="80" letter-spacing="-3.2" fill="#16181a">before you run them.</text>
  <text x="90" y="452" font-family="${H}" font-size="23" fill="#54574f">Small, plain-text skills for working with AI.</text>
  <line x1="90" y1="522" x2="1110" y2="522" stroke="#d9d7ce" stroke-width="1"/>
  <text x="88" y="570" font-family="${H}" font-size="27" font-weight="700" letter-spacing="-1.1" fill="#16181a">weindie</text>
  <text x="1110" y="570" text-anchor="end" font-family="Georgia,serif" font-size="22" fill="#54574f">${skills.map(s => '/' + sesc(s.slug)).join(' &#183; ')}</text>
</svg>
`;
}

/* PNG is what link scrapers actually fetch. Convert with the tool this machine has. */
function toPng(svgPath, pngPath) {
  const svg = path.join(ROOT, svgPath), png = path.join(ROOT, pngPath);
  if (fs.existsSync(png) && fs.statSync(png).mtimeMs >= fs.statSync(svg).mtimeMs) return;
  try {
    execFileSync('sips', ['-s', 'format', 'png', svg, '--out', png], { stdio: 'ignore' });
  } catch (e) {
    fail('could not convert ' + svgPath + ' to PNG.\n' +
      '  This needs macOS "sips". Run it yourself, or generate ' + pngPath + ' another way:\n' +
      '    sips -s format png ' + svgPath + ' --out ' + pngPath);
  }
  console.log('  png  ' + pngPath);
}

/* -------------------------------------------------------------- homepage */

function homePage(skills, cat) {
  const template = read('src/home.html');
  const index = skills.map(s =>
    `<a href="/${s.slug}"><span class="k">/${s.slug}</span><span class="q">${esc(s.question)}</span></a>`).join('');
  const choices = skills.map(s =>
    `<button data-key="${esc(s.slug)}" aria-pressed="false">${esc(s.homeLabel)}</button>`).join('');
  const data = json(skills.map(s => ({
    slug: s.slug, question: s.question, summary: s.summary, match: s.match || []
  })));
  return template
    .replace('<!--HEAD-->', head({
      title: 'WeIndie — Skills you can read before you run them',
      description: 'Small, plain-text skills for working with AI. Read the whole thing before you install it, change what you disagree with, and keep it.',
      url: ORIGIN + '/',
      image: ORIGIN + '/og.png',
      imageAlt: 'WeIndie — skills you can read before you run them.'
    }))
    .replace('<!--POSITION-->', esc(cat.position))
    .replace('<!--INDEX-->', index)
    .replace('<!--CHOICES-->', choices)
    .replace('<!--PROJECT-->', esc(cat.project))
    .replace('<!--PROJECT_BLURB-->', esc(cat.blurb))
    .replace('<!--FOOTER-->', FOOTER)
    .replace('<!--DATA-->', data);
}

/* ------------------------------------------------------------------ main */

const cat = JSON.parse(read('skills/catalogue.json'));
const skills = cat.skills.map(loadSkill);
console.log('weindie build — ' + skills.length + ' skills');

for (const s of skills) {
  /* <slug>.html, not <slug>/index.html: Cloudflare Pages serves /kiss straight
     from kiss.html, where a directory would 308-redirect to /kiss/ and leave the
     address bar disagreeing with the canonical tag. The short URL is the point. */
  write(s.slug + '.html', skillPage(s, skills, cat.project));
  write(s.slug + '/SKILL.md', s.canonical);
  write('og/' + s.slug + '.svg', ogCard(s, cat.project));
  toPng('og/' + s.slug + '.svg', 'og/' + s.slug + '.png');
  console.log('  page /' + s.slug);
}
write('og.svg', homeCard(skills));
toPng('og.svg', 'og.png');
write('index.html', homePage(skills, cat));
console.log('  page /');
console.log('done');
