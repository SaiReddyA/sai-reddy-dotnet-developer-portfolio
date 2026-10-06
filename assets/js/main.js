/* Sai Reddy A — portfolio interactions (vanilla JS, no dependencies) */
(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  /* ---------- Themes: auto-cycle accent colours ---------- */
  const THEMES = [
    { id: "violet",  name: ".NET Violet" },
    { id: "azure",   name: "Azure Blue" },
    { id: "emerald", name: "Emerald" },
    { id: "amber",   name: "Amber" },
    { id: "rose",    name: "Rose" },
    { id: "cyan",    name: "Cyan" },
  ];
  const CYCLE_MS = 8000;
  let themeIdx = Math.max(0, THEMES.findIndex(t => t.id === store.get("theme")));
  let cycling = store.get("cycle") !== "off" && !reduceMotion;
  let cycleTimer = null;

  function applyTheme(i, announce) {
    themeIdx = (i + THEMES.length) % THEMES.length;
    root.dataset.theme = THEMES[themeIdx].id;
    store.set("theme", THEMES[themeIdx].id);
    if (announce) toast(`Theme · ${THEMES[themeIdx].name}`);
  }
  function startCycle() {
    stopCycle();
    cycleTimer = setInterval(() => { if (!document.hidden) applyTheme(themeIdx + 1); }, CYCLE_MS);
  }
  function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; }
  function setCycling(on, announce = true) {
    cycling = on;
    store.set("cycle", on ? "on" : "off");
    on ? startCycle() : stopCycle();
    if (announce) toast(on ? "Auto theme cycling on" : "Theme locked");
  }
  function nextTheme() {
    applyTheme(themeIdx + 1, true);
    if (cycling) startCycle(); // restart timer so it doesn't jump right after a manual change
  }

  /* Light / dark */
  const savedMode = store.get("mode");
  const mode = savedMode || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  root.dataset.mode = mode;
  function toggleMode() {
    const m = root.dataset.mode === "dark" ? "light" : "dark";
    root.dataset.mode = m;
    store.set("mode", m);
    $('meta[name="theme-color"]').setAttribute("content", m === "dark" ? "#0a0b10" : "#f7f7fb");
    toast(m === "dark" ? "Dark mode" : "Light mode");
  }

  applyTheme(themeIdx);
  if (cycling) startCycle();
  $("#themeBtn").addEventListener("click", nextTheme);
  $("#modeBtn").addEventListener("click", toggleMode);

  /* ---------- Topbar, progress, active link ---------- */
  const topbar = $(".topbar");
  const progress = $(".progress");
  const onScroll = () => {
    const y = scrollY;
    topbar.classList.toggle("scrolled", y > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $$(".nav a");
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => spy.observe(s));

  /* Mobile menu */
  const menuBtn = $("#menuBtn"), nav = $(".nav");
  menuBtn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  navLinks.forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Reveal + counters ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      const n = e.target.querySelector("[data-count]");
      if (n) countUp(n);
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal, .stack-card").forEach(el => revealObs.observe(el));

  function countUp(el) {
    const end = +el.dataset.count;
    if (reduceMotion) { el.textContent = end; return; }
    const t0 = performance.now(), dur = 1200;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Typed terminal ---------- */
  const typedEl = $("#typed");
  const phrases = [
    "C#, ASP.NET Core, Angular",
    "Azure Functions, Hangfire, Redis",
    "AWS Lambda, DynamoDB, S3",
    "SQL Server, Dapper, PetaPoco",
    "SignalR, WebRTC, Microservices",
  ];
  if (!reduceMotion && typedEl) {
    let pi = 0, ci = phrases[0].length, deleting = true;
    const step = () => {
      const word = phrases[pi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, ci);
      let delay = deleting ? 28 : 55;
      if (!deleting && ci === word.length) { deleting = true; delay = 2200; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 300; }
      setTimeout(step, delay);
    };
    setTimeout(step, 2400);
  }

  /* ---------- Project filters + spotlight ---------- */
  $$(".chip-btn").forEach(btn => btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    $$(".chip-btn").forEach(b => { b.classList.toggle("active", b === btn); b.setAttribute("aria-selected", b === btn); });
    $$(".project").forEach(p => p.classList.toggle("hidden", f !== "all" && !p.dataset.tags.split(" ").includes(f)));
  }));
  $$(".project").forEach(card => card.addEventListener("pointermove", e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  }));

  /* ---------- Copy email ---------- */
  async function copyText(text, label = "Copied") {
    try { await navigator.clipboard.writeText(text); toast(`${label} ✓`); }
    catch { toast(text); }
  }
  $$("[data-copy]").forEach(b => b.addEventListener("click", () => copyText(b.dataset.copy, "Email copied")));

  /* ---------- GitHub repos (progressive enhancement) ---------- */
  const GH_USER = "SaiReddyA";
  const repoGrid = $("#repoGrid");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  (async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`https://api.github.com/users/${GH_USER}`),
        fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`),
      ]);
      if (!uRes.ok || !rRes.ok) throw new Error("GitHub API");
      const user = await uRes.json();
      const repos = (await rRes.json()).filter(r => !r.fork);
      $("#ghRepos").textContent = user.public_repos ?? repos.length;
      $("#ghFollowers").textContent = user.followers ?? 0;
      const langs = {};
      repos.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
      const top = Object.entries(langs).sort((a, b) => b[1] - a[1])[0];
      if (top) $("#ghLang").textContent = top[0];
      const pick = repos
        .filter(r => r.name.toLowerCase() !== "sai-reddy-dotnet-developer-portfolio")
        .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
        .slice(0, 6);
      if (!pick.length) throw new Error("no repos");
      repoGrid.innerHTML = pick.map(r => `
        <a class="repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
          <h3>${esc(r.name)}</h3>
          <p>${esc(r.description || "No description yet.")}</p>
          <div class="meta">
            ${r.language ? `<span><i class="dot"></i>${esc(r.language)}</span>` : ""}
            <span>★ ${r.stargazers_count}</span>
            <span>Updated ${new Date(r.pushed_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
          </div>
        </a>`).join("");
    } catch {
      repoGrid.innerHTML = `<p class="muted">Browse my repositories directly on <a class="accent" href="https://github.com/${GH_USER}" target="_blank" rel="noopener">github.com/${GH_USER}</a>.</p>`;
    }
  })();

  /* ---------- Contact form (Formspree, AJAX) ---------- */
  const form = $("#contactForm"), status = $("#formStatus");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Sending…";
    status.className = "form-status"; status.textContent = "";
    try {
      const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error();
      form.reset();
      status.className = "form-status ok";
      status.textContent = "Thanks — your message is on its way. I'll reply within 24 hours.";
    } catch {
      status.className = "form-status err";
      status.textContent = "Couldn't send right now. Please email saireddy.1.1919@gmail.com directly.";
    } finally {
      btn.disabled = false; btn.textContent = "Send message";
    }
  });

  /* ---------- Command palette ---------- */
  const palette = $("#palette"), input = $("#paletteInput"), list = $("#paletteList");
  const go = id => () => document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  const COMMANDS = [
    { group: "Navigate", ico: "#", label: "Go to Home", hint: "Top of page", run: go("home") },
    { group: "Navigate", ico: "#", label: "Go to Profile", hint: "About me", run: go("about") },
    { group: "Navigate", ico: "#", label: "Go to Stack", hint: "Skills", run: go("stack") },
    { group: "Navigate", ico: "#", label: "Go to Experience", hint: "Roles & impact", run: go("experience") },
    { group: "Navigate", ico: "#", label: "Go to Projects", hint: "Things I've shipped", run: go("projects") },
    { group: "Navigate", ico: "#", label: "Go to GitHub", hint: "Open source", run: go("github") },
    { group: "Navigate", ico: "#", label: "Go to Education", hint: "Degrees & certs", run: go("education") },
    { group: "Navigate", ico: "#", label: "Go to Contact", hint: "Get in touch", run: go("contact") },
    { group: "Actions", ico: "@", label: "Email Sai Reddy", hint: "saireddy.1.1919@gmail.com", run: () => { location.href = "mailto:saireddy.1.1919@gmail.com"; } },
    { group: "Actions", ico: "⧉", label: "Copy email address", hint: "Clipboard", run: () => copyText("saireddy.1.1919@gmail.com", "Email copied") },
    { group: "Actions", ico: "in", label: "Open LinkedIn", hint: "New tab", run: () => open("https://www.linkedin.com/in/saireddy-dotnetfs", "_blank", "noopener") },
    { group: "Actions", ico: "gh", label: "Open GitHub", hint: "New tab", run: () => open("https://github.com/SaiReddyA", "_blank", "noopener") },
    { group: "Actions", ico: "↓", label: "Download Résumé", hint: "PDF", run: () => { const a = document.createElement("a"); a.href = "assets/Sai_Reddy_A_DotNet_Full_Stack_Developer_Resume.pdf"; a.download = ""; a.click(); } },
    { group: "Appearance", ico: "◐", label: "Toggle light / dark mode", hint: "L", run: toggleMode },
    { group: "Appearance", ico: "◆", label: "Next colour theme", hint: "T", run: nextTheme },
    { group: "Appearance", ico: "⟳", label: () => cycling ? "Pause theme auto-cycling" : "Resume theme auto-cycling", hint: "Every 8s", run: () => setCycling(!cycling) },
    ...THEMES.map((t, i) => ({ group: "Appearance", ico: "●", label: `Theme: ${t.name}`, hint: t.id, run: () => { applyTheme(i, true); setCycling(false, false); } })),
  ];
  let filtered = [], sel = 0, lastFocus = null;

  const labelOf = c => typeof c.label === "function" ? c.label() : c.label;
  function render() {
    const q = input.value.trim().toLowerCase();
    filtered = COMMANDS.filter(c => !q || (labelOf(c) + " " + c.hint + " " + c.group).toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    if (!filtered.length) { list.innerHTML = `<li class="palette-empty">No results for “${esc(input.value)}”</li>`; return; }
    let html = "", g = "";
    filtered.forEach((c, i) => {
      if (c.group !== g) { g = c.group; html += `<li class="palette-group" role="presentation">${g}</li>`; }
      html += `<li class="palette-item${i === sel ? " sel" : ""}" role="option" aria-selected="${i === sel}" data-i="${i}" id="pi-${i}">
        <span class="lbl"><span class="ico">${c.ico}</span>${esc(labelOf(c))}</span><span class="hint">${esc(c.hint)}</span></li>`;
    });
    list.innerHTML = html;
    input.setAttribute("aria-activedescendant", `pi-${sel}`);
    list.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
  }
  function openPalette() {
    lastFocus = document.activeElement;
    palette.hidden = false; input.value = ""; sel = 0; render();
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => input.focus());
  }
  function closePalette() {
    palette.hidden = true; document.body.style.overflow = "";
    lastFocus?.focus?.();
  }
  function runSel(i = sel) {
    const c = filtered[i]; if (!c) return;
    closePalette(); setTimeout(c.run, 40);
  }
  input.addEventListener("input", () => { sel = 0; render(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % filtered.length; render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + filtered.length) % filtered.length; render(); }
    else if (e.key === "Enter") { e.preventDefault(); runSel(); }
    else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
  });
  list.addEventListener("click", e => { const li = e.target.closest(".palette-item"); if (li) runSel(+li.dataset.i); });
  list.addEventListener("mousemove", e => {
    const li = e.target.closest(".palette-item");
    if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); }
  });
  palette.addEventListener("click", e => { if (e.target.hasAttribute("data-close")) closePalette(); });
  $("#openPalette").addEventListener("click", openPalette);

  /* Global shortcuts */
  addEventListener("keydown", e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.hidden ? openPalette() : closePalette(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "/") { e.preventDefault(); openPalette(); }
    else if (e.key.toLowerCase() === "t") nextTheme();
    else if (e.key.toLowerCase() === "l") toggleMode();
  });

  $("#year").textContent = new Date().getFullYear();
})();
