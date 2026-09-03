(function () {
  var D = window.SKILL;
  var $ = function (s) { return document.querySelector(s); };
  var sel = {}, platform = D.platforms[0].id;

  D.options.forEach(function (o) { sel[o.id] = def(o).id; });

  function def(o) { return o.choices.filter(function (c) { return c.isDefault; })[0]; }
  function cur(o) { return o.choices.filter(function (c) { return c.id === sel[o.id]; })[0]; }
  function changedOptions() { return D.options.filter(function (o) { return cur(o).id !== def(o).id; }); }

  /* ---- toast + copy ---- */
  var toastEl = document.createElement('div');
  toastEl.className = 'toast';
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1900);
  }
  function copy(text, what) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      toast(ok ? what + ' copied' : 'Copy failed — select the text and copy manually');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(what + ' copied'); }, fallback);
    } else { fallback(); }
  }

  /* ---- generate the customised skill ---- */
  function generate() {
    var text = D.canonical, changed = changedOptions();
    changed.forEach(function (o) { text = text.split(def(o).line).join(cur(o).line); });
    if (changed.length) {
      text = text.replace(
        '  source: ' + D.source + '\n',
        '  source: ' + D.source + '\n  based_on: WeIndie /' + D.slug + ' v' + D.version + '\n'
      );
      text = text.replace(
        D.defaultsNote,
        'Customised from the WeIndie default, based on `/' + D.slug + '` v' + D.version +
        '. Changed from default: ' + changed.map(function (o) { return o.label.toLowerCase(); }).join(', ') + '.'
      );
    }
    return text;
  }

  /* ---- unified diff (LCS) ---- */
  function diff(aText, bText) {
    var a = aText.split('\n'), b = bText.split('\n');
    var m = a.length, n = b.length, i, j;
    var lcs = [];
    for (i = 0; i <= m; i++) lcs.push(new Array(n + 1).fill(0));
    for (i = m - 1; i >= 0; i--)
      for (j = n - 1; j >= 0; j--)
        lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    var ops = [];
    i = 0; j = 0;
    while (i < m && j < n) {
      if (a[i] === b[j]) { ops.push([' ', a[i]]); i++; j++; }
      else if (lcs[i + 1][j] >= lcs[i][j + 1]) { ops.push(['-', a[i]]); i++; }
      else { ops.push(['+', b[j]]); j++; }
    }
    while (i < m) { ops.push(['-', a[i++]]); }
    while (j < n) { ops.push(['+', b[j++]]); }

    var keep = {}, ctx = 2, k;
    ops.forEach(function (op, idx) {
      if (op[0] !== ' ') for (k = idx - ctx; k <= idx + ctx; k++) keep[k] = true;
    });
    var out = [], gap = false;
    ops.forEach(function (op, idx) {
      if (!keep[idx]) { gap = true; return; }
      if (gap) { out.push(['hunk', '@@']); gap = false; }
      out.push([op[0] === '+' ? 'add' : op[0] === '-' ? 'del' : '', op[0] + ' ' + op[1]]);
    });
    return out;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---- render ---- */
  function renderOptions() {
    $('#opts').innerHTML = D.options.map(function (o) {
      return '<div class="opt"><div class="lbl">' + esc(o.label) + '</div>' +
        '<p class="help">' + esc(o.help) + '</p><div class="pills" role="group" aria-label="' + esc(o.label) + '">' +
        o.choices.map(function (c) {
          return '<button class="pill' + (c.id === sel[o.id] ? ' active' : '') + '" data-opt="' + o.id +
            '" data-choice="' + c.id + '" aria-pressed="' + (c.id === sel[o.id]) + '">' + esc(c.label) + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    Array.prototype.forEach.call($('#opts').querySelectorAll('.pill'), function (b) {
      b.addEventListener('click', function () {
        sel[b.dataset.opt] = b.dataset.choice;
        renderOptions();
        renderCustom();
      });
    });
  }

  function renderCustom() {
    var changed = changedOptions(), custom = generate();
    $('#changes').innerHTML = changed.length
      ? '<h3>Changed from default</h3>' + changed.map(function (o) {
        return '<div class="chg"><b>' + esc(o.label) + '</b>' +
          '<div class="was">' + esc(plain(def(o).line)) + '</div>' +
          '<div class="now">' + esc(plain(cur(o).line)) + '</div></div>';
      }).join('')
      : '<h3>Changed from default</h3><p class="none">Nothing changed yet. This is the standard <code>/' +
        esc(D.slug) + '</code> v' + esc(D.version) + '.</p>';
    $('#gen').textContent = custom;
    $('#diffTitle').textContent = changed.length ? 'Compare with default' : 'Compare with default (identical)';
    $('#diff').innerHTML = changed.length
      ? diff(D.canonical, custom).map(function (l) {
          return '<span class="' + l[0] + '">' + esc(l[1]) + '</span>';
        }).join('\n')
      : 'No differences.';
    $('#dlCustom').textContent = changed.length ? 'Download your /' + D.slug : 'Download /' + D.slug;
  }

  function plain(line) {
    return line.replace(/^- \*\*[^*]+\.\*\*\s*/, '').replace(/^-\s*/, '');
  }

  function platformById(id) {
    return D.platforms.filter(function (p) { return p.id === id; })[0];
  }

  function renderPlatform() {
    var p = platformById(platform);
    $('#destPath').textContent = p.project.replace(/<slug>/g, D.slug);
    $('#destUser').textContent = p.user ? p.user.replace(/<slug>/g, D.slug) : '';
    $('#destUserRow').style.display = p.user ? '' : 'none';
    $('#platformNote').textContent = p.note || '';
    $('#platformNote').style.display = p.note ? '' : 'none';
    $('#docsLink').href = p.docs;
    $('#docsLink').textContent = p.docsLabel;
    $('#cmd').textContent = 'mkdir -p ' + dir(p) + ' && curl -fsSL ' + D.raw + ' -o ' + dir(p) + '/SKILL.md';
    Array.prototype.forEach.call(document.querySelectorAll('#platforms .pill'), function (b) {
      var on = b.dataset.platform === platform;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on);
    });
  }
  function dir(p) {
    return p.project.replace(/<slug>/g, D.slug).replace(/\/SKILL\.md$/, '');
  }

  function download(text) {
    var url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'SKILL.md'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('SKILL.md downloaded');
  }

  /* ---- wire up ---- */
  Array.prototype.forEach.call(document.querySelectorAll('#platforms .pill'), function (b) {
    b.addEventListener('click', function () { platform = b.dataset.platform; renderPlatform(); });
  });
  $('#copyTry').addEventListener('click', function () { copy(D.tryOnce, 'Prompt'); });
  $('#copyCmd').addEventListener('click', function () { copy($('#cmd').textContent, 'Command'); });
  $('#dlCanonical').addEventListener('click', function () { download(D.canonical); });
  $('#dlCustom').addEventListener('click', function () { download(generate()); });
  $('#copySource').addEventListener('click', function () { copy(D.canonical, 'SKILL.md'); });

  renderOptions();
  renderCustom();
  renderPlatform();
})();
