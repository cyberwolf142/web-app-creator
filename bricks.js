// 🧱 Bricks: a Lego-style visual builder.
// A brick project stores a tree of bricks; the HTML/CSS/JS files are generated from it.
//
// To add a new brick, add an entry to CATALOG below:
//   label, icon, group, props (settings shown in the inspector),
//   html(brick, childrenHtml) → markup, and optional css / js (included once if the brick is used).

(function () {
  // ---------- Brick catalog ----------

  const GROUPS = [
    { id: "layout", label: "Layout", color: "#d01012" },
    { id: "text", label: "Text", color: "#f2b705", ink: "#3b2d00" },
    { id: "media", label: "Media", color: "#237841" },
    { id: "input", label: "Inputs", color: "#0055bf" },
    { id: "smart", label: "Smart bricks", color: "#8e44ad" },
  ];

  const ALIGN = { key: "align", label: "Align", type: "select", options: ["left", "center", "right"], default: "left" };
  const SIZE3 = (def) => ({ key: "size", label: "Size", type: "select", options: ["small", "medium", "large"], default: def });

  const CATALOG = {
    section: {
      label: "Section", icon: "▭", group: "layout", container: true,
      props: [
        { key: "style", label: "Background", type: "select", options: ["plain", "tinted", "accent", "card"], default: "tinted" },
        { key: "padding", label: "Padding", type: "select", options: ["small", "medium", "large"], default: "medium" },
        ALIGN,
      ],
      html: (b, kids) => `<section class="b-section b-${b.props.style} b-pad-${b.props.padding} b-align-${b.props.align}">\n${kids}\n</section>`,
      css: `.b-section { border-radius: 16px; }
.b-section > * + * { margin-top: 14px; }
.b-tinted { background: var(--tint); }
.b-accent { background: var(--accent); color: #fff; }
.b-accent .b-button { background: #fff; color: var(--accent); }
.b-card { background: var(--card); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0,0,0,.06); }
.b-pad-small { padding: 12px; }
.b-pad-medium { padding: 24px; }
.b-pad-large { padding: 48px 32px; }`,
    },
    row: {
      label: "Row", icon: "▥", group: "layout", container: true,
      props: [
        { key: "gap", label: "Gap", type: "select", options: ["small", "medium", "large"], default: "medium" },
        { key: "valign", label: "Line up", type: "select", options: ["top", "center", "stretch"], default: "stretch" },
      ],
      html: (b, kids) => `<div class="b-row b-gap-${b.props.gap} b-valign-${b.props.valign}">\n${kids}\n</div>`,
      css: `.b-row { display: flex; flex-wrap: wrap; }
.b-row > * { flex: 1 1 180px; margin: 0; }
.b-gap-small { gap: 8px; }
.b-gap-medium { gap: 16px; }
.b-gap-large { gap: 32px; }
.b-valign-top { align-items: flex-start; }
.b-valign-center { align-items: center; }
.b-valign-stretch { align-items: stretch; }`,
    },
    card: {
      label: "Card", icon: "▢", group: "layout", container: true,
      props: [ALIGN],
      html: (b, kids) => `<div class="b-cardbox b-align-${b.props.align}">\n${kids}\n</div>`,
      css: `.b-cardbox { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; box-shadow: 0 2px 10px rgba(0,0,0,.05); }
.b-cardbox > * + * { margin-top: 12px; }`,
    },

    heading: {
      label: "Heading", icon: "H", group: "text",
      props: [
        { key: "text", label: "Text", type: "text", default: "Big title" },
        { key: "size", label: "Size", type: "select", options: ["large", "medium", "small"], default: "large" },
        { key: "align", label: "Align", type: "select", options: ["auto", "left", "center", "right"], default: "auto" },
      ],
      html: (b) => {
        const tag = { large: "h1", medium: "h2", small: "h3" }[b.props.size] || "h2";
        return `<${tag} class="b-heading${alignClass(b)}"${templ(b.props.text)}>${esc(b.props.text)}</${tag}>`;
      },
      css: `.b-heading { margin: 0; line-height: 1.2; }
h1.b-heading { font-size: clamp(2rem, 6vw, 3rem); }`,
    },
    text: {
      label: "Text", icon: "¶", group: "text",
      props: [
        { key: "text", label: "Text (use {{name}} to show a variable)", type: "textarea", default: "Write something here." },
        { key: "size", label: "Size", type: "select", options: ["small", "normal", "large"], default: "normal" },
        { key: "tone", label: "Color", type: "select", options: ["normal", "muted", "accent"], default: "normal" },
        { key: "align", label: "Align", type: "select", options: ["auto", "left", "center", "right"], default: "auto" },
      ],
      html: (b) => `<p class="b-text b-text-${b.props.size} b-tone-${b.props.tone}${alignClass(b)}"${templ(b.props.text)}>${esc(b.props.text)}</p>`,
      css: `.b-text { margin: 0; line-height: 1.6; white-space: pre-line; }
.b-text-small { font-size: .875rem; }
.b-text-large { font-size: 1.25rem; }
.b-tone-muted { color: var(--muted); }
.b-tone-accent { color: var(--accent); font-weight: 600; }`,
    },
    list: {
      label: "List", icon: "☰", group: "text",
      props: [
        { key: "items", label: "Items (one per line)", type: "textarea", default: "First thing\nSecond thing\nThird thing" },
        { key: "numbered", label: "Numbered", type: "checkbox", default: false },
      ],
      html: (b) => {
        const tag = b.props.numbered ? "ol" : "ul";
        const items = lines(b.props.items).map((i) => `  <li>${esc(i)}</li>`).join("\n");
        return `<${tag} class="b-list">\n${items}\n</${tag}>`;
      },
      css: `.b-list { margin: 0; padding-left: 1.4em; line-height: 1.7; }`,
    },
    link: {
      label: "Link", icon: "🔗", group: "text",
      props: [
        { key: "text", label: "Text", type: "text", default: "Visit my site" },
        { key: "url", label: "Web address", type: "text", default: "https://example.com" },
      ],
      html: (b) => `<a class="b-link" href="${attr(safeUrl(b.props.url))}" target="_blank" rel="noopener">${esc(b.props.text)}</a>`,
      css: `.b-link { color: var(--accent); font-weight: 600; display: inline-block; }`,
    },

    image: {
      label: "Image", icon: "🖼", group: "media",
      props: [
        { key: "url", label: "Image address", type: "text", default: "https://picsum.photos/seed/bricks/800/400" },
        { key: "alt", label: "Description", type: "text", default: "A photo" },
        { key: "width", label: "Width", type: "select", options: ["small", "medium", "full"], default: "full" },
        { key: "rounded", label: "Rounded corners", type: "checkbox", default: true },
      ],
      html: (b) => `<img class="b-image b-w-${b.props.width}${b.props.rounded ? " b-rounded" : ""}" src="${attr(safeUrl(b.props.url))}" alt="${attr(b.props.alt)}">`,
      css: `.b-image { display: block; max-width: 100%; height: auto; }
.b-w-small { width: 160px; }
.b-w-medium { width: 360px; }
.b-w-full { width: 100%; }
.b-align-center > .b-image { margin-left: auto; margin-right: auto; }
.b-rounded { border-radius: 14px; }`,
    },
    emoji: {
      label: "Emoji", icon: "😀", group: "media",
      props: [{ key: "emoji", label: "Emoji", type: "text", default: "🚀" }, SIZE3("large")],
      html: (b) => `<div class="b-emoji b-emoji-${b.props.size}" aria-hidden="true">${esc(b.props.emoji)}</div>`,
      css: `.b-emoji { line-height: 1; }
.b-emoji-small { font-size: 2rem; }
.b-emoji-medium { font-size: 3.5rem; }
.b-emoji-large { font-size: 5rem; }`,
    },
    video: {
      label: "YouTube video", icon: "▶", group: "media",
      props: [{ key: "url", label: "YouTube link", type: "text", default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
      html: (b) => {
        const id = youtubeId(b.props.url);
        return id
          ? `<div class="b-video"><iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allowfullscreen></iframe></div>`
          : `<p class="b-text b-tone-muted">Paste a YouTube link in the video brick.</p>`;
      },
      css: `.b-video { position: relative; aspect-ratio: 16 / 9; }
.b-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 14px; }`,
    },
    divider: {
      label: "Divider", icon: "―", group: "media", props: [],
      html: () => `<hr class="b-divider">`,
      css: `.b-divider { border: 0; border-top: 1px solid var(--border); margin: 8px 0; }`,
    },
    spacer: {
      label: "Spacer", icon: "↕", group: "media",
      props: [SIZE3("medium")],
      html: (b) => `<div class="b-spacer b-space-${b.props.size}"></div>`,
      css: `.b-space-small { height: 8px; }
.b-space-medium { height: 32px; }
.b-space-large { height: 80px; }`,
    },

    button: {
      label: "Button", icon: "⏺", group: "input",
      props: [
        { key: "text", label: "Label", type: "text", default: "Click me" },
        { key: "action", label: "When clicked", type: "select", options: ["confetti", "message", "link", "scroll to top", "nothing"], default: "confetti" },
        { key: "value", label: "Message or web address", type: "text", default: "Hello {{name}}!" },
        { key: "look", label: "Look", type: "select", options: ["solid", "outline"], default: "solid" },
      ],
      html: (b) => `<button class="b-button b-${b.props.look}" data-action="${attr(b.props.action)}" data-value="${attr(b.props.value)}">${esc(b.props.text)}</button>`,
      css: `.b-button { font: inherit; font-weight: 600; padding: 10px 20px; border-radius: 10px; cursor: pointer; border: 2px solid var(--accent); }
.b-solid { background: var(--accent); color: #fff; }
.b-outline { background: transparent; color: var(--accent); }
.b-button:active { transform: translateY(1px); }`,
      js: "actions",
    },
    input: {
      label: "Text box", icon: "⌨", group: "input",
      props: [
        { key: "label", label: "Label", type: "text", default: "Your name" },
        { key: "placeholder", label: "Hint text", type: "text", default: "Type here…" },
        { key: "variable", label: "Variable name (use {{name}} in text)", type: "text", default: "name" },
      ],
      html: (b) => `<label class="b-field">${esc(b.props.label)}
  <input type="text" placeholder="${attr(b.props.placeholder)}" data-var="${attr(varName(b.props.variable))}">
</label>`,
      css: "field",
    },
    slider: {
      label: "Slider", icon: "⎯", group: "input",
      props: [
        { key: "label", label: "Label", type: "text", default: "Amount" },
        { key: "variable", label: "Variable name", type: "text", default: "amount" },
        { key: "min", label: "Minimum", type: "number", default: 0 },
        { key: "max", label: "Maximum", type: "number", default: 100 },
        { key: "start", label: "Start value", type: "number", default: 50 },
      ],
      html: (b) => {
        const v = varName(b.props.variable);
        return `<label class="b-field">${esc(b.props.label)}: <strong data-template="{{${v}}}">${num(b.props.start)}</strong>
  <input type="range" min="${num(b.props.min)}" max="${num(b.props.max)}" value="${num(b.props.start)}" data-var="${v}">
</label>`;
      },
      css: "field",
    },
    choice: {
      label: "Dropdown", icon: "▾", group: "input",
      props: [
        { key: "label", label: "Label", type: "text", default: "Favorite color" },
        { key: "options", label: "Options (one per line)", type: "textarea", default: "Red\nGreen\nBlue" },
        { key: "variable", label: "Variable name", type: "text", default: "color" },
      ],
      html: (b) => {
        const opts = lines(b.props.options).map((o) => `    <option>${esc(o)}</option>`).join("\n");
        return `<label class="b-field">${esc(b.props.label)}
  <select data-var="${attr(varName(b.props.variable))}">
${opts}
  </select>
</label>`;
      },
      css: "field",
    },

    counter: {
      label: "Counter", icon: "±", group: "smart",
      props: [
        { key: "label", label: "Label", type: "text", default: "Glasses of water" },
        { key: "start", label: "Start at", type: "number", default: 0 },
        { key: "step", label: "Step", type: "number", default: 1 },
        { key: "variable", label: "Variable name (optional)", type: "text", default: "" },
      ],
      html: (b) => `<div class="b-widget b-counter" data-start="${num(b.props.start)}" data-step="${num(b.props.step) || 1}" data-var="${attr(varName(b.props.variable, ""))}">
  <div class="b-widget-label">${esc(b.props.label)}</div>
  <div class="b-big b-counter-value">${num(b.props.start)}</div>
  <div class="b-widget-buttons"><button data-do="dec">−</button><button data-do="reset">↺</button><button data-do="inc">+</button></div>
</div>`,
      css: "widget",
      js: `// Counter bricks
document.querySelectorAll(".b-counter").forEach((box) => {
  const start = Number(box.dataset.start) || 0;
  const step = Number(box.dataset.step) || 1;
  const out = box.querySelector(".b-counter-value");
  let n = start;
  const show = () => {
    out.textContent = n;
    if (box.dataset.var) setVar(box.dataset.var, n);
  };
  box.addEventListener("click", (e) => {
    const act = e.target.dataset.do;
    if (!act) return;
    n = act === "inc" ? n + step : act === "dec" ? n - step : start;
    show();
  });
  show();
});`,
    },
    todo: {
      label: "To-do list", icon: "☑", group: "smart",
      props: [{ key: "title", label: "Title", type: "text", default: "My to-dos" }],
      html: (b) => `<div class="b-widget b-todo" data-key="todo-${attr(b.id)}">
  <div class="b-widget-label">${esc(b.props.title)}</div>
  <form><input placeholder="Add a task…" autocomplete="off"><button>Add</button></form>
  <ul></ul>
</div>`,
      css: `.b-todo form { display: flex; gap: 8px; margin: 10px 0; }
.b-todo form input { flex: 1; min-width: 0; }
.b-todo ul { list-style: none; padding: 0; margin: 0; text-align: left; }
.b-todo li { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border); }
.b-todo li label { flex: 1; display: flex; gap: 8px; align-items: center; }
.b-todo li.done span { text-decoration: line-through; color: var(--muted); }
.b-todo li button { background: none; border: 0; color: var(--muted); cursor: pointer; }`,
      js: `// To-do list bricks (saved in this browser)
document.querySelectorAll(".b-todo").forEach((box) => {
  const key = box.dataset.key;
  const list = box.querySelector("ul");
  const input = box.querySelector("form input");
  let items = load(key, []);
  function render() {
    list.innerHTML = "";
    items.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = item.done ? "done" : "";
      li.innerHTML = '<label><input type="checkbox"><span></span></label><button title="Remove">✕</button>';
      li.querySelector("span").textContent = item.text;
      const box = li.querySelector("input");
      box.checked = item.done;
      box.onchange = () => { item.done = box.checked; save(key, items); render(); };
      li.querySelector("button").onclick = () => { items.splice(i, 1); save(key, items); render(); };
      list.appendChild(li);
    });
  }
  box.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    items.push({ text, done: false });
    input.value = "";
    save(key, items);
    render();
  };
  render();
});`,
    },
    timer: {
      label: "Timer", icon: "⏱", group: "smart",
      props: [
        { key: "label", label: "Label", type: "text", default: "Focus time" },
        { key: "minutes", label: "Minutes", type: "number", default: 25 },
      ],
      html: (b) => `<div class="b-widget b-timer" data-minutes="${num(b.props.minutes) || 1}">
  <div class="b-widget-label">${esc(b.props.label)}</div>
  <div class="b-big b-timer-time">--:--</div>
  <div class="b-widget-buttons"><button data-do="start">Start</button><button data-do="reset">Reset</button></div>
</div>`,
      css: `.b-timer.done { animation: b-flash .5s 6 alternate; }
@keyframes b-flash { to { background: var(--accent); color: #fff; } }`,
      js: `// Timer bricks
document.querySelectorAll(".b-timer").forEach((box) => {
  const total = Math.max(1, Math.round(Number(box.dataset.minutes) * 60));
  const out = box.querySelector(".b-timer-time");
  const startBtn = box.querySelector('[data-do="start"]');
  let left = total;
  let tick = null;
  const show = () => {
    out.textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
  };
  const stop = () => { clearInterval(tick); tick = null; startBtn.textContent = "Start"; };
  startBtn.onclick = () => {
    if (tick) return stop();
    if (left <= 0) left = total;
    startBtn.textContent = "Pause";
    tick = setInterval(() => {
      left--;
      show();
      if (left <= 0) {
        stop();
        box.classList.add("done");
        setTimeout(() => box.classList.remove("done"), 3000);
      }
    }, 1000);
  };
  box.querySelector('[data-do="reset"]').onclick = () => { stop(); left = total; show(); };
  show();
});`,
    },
    notes: {
      label: "Notepad", icon: "✎", group: "smart",
      props: [
        { key: "title", label: "Title", type: "text", default: "Notes" },
        { key: "placeholder", label: "Hint text", type: "text", default: "Write anything — it's saved automatically." },
      ],
      html: (b) => `<div class="b-widget b-notes">
  <div class="b-widget-label">${esc(b.props.title)}</div>
  <textarea rows="5" placeholder="${attr(b.props.placeholder)}" data-key="notes-${attr(b.id)}"></textarea>
</div>`,
      css: `.b-notes textarea { width: 100%; margin-top: 8px; resize: vertical; }`,
      js: `// Notepad bricks (saved in this browser)
document.querySelectorAll(".b-notes textarea").forEach((area) => {
  area.value = load(area.dataset.key, "");
  area.addEventListener("input", () => save(area.dataset.key, area.value));
});`,
    },
    clock: {
      label: "Clock", icon: "🕒", group: "smart",
      props: [{ key: "showDate", label: "Show the date", type: "checkbox", default: true }],
      html: (b) => `<div class="b-widget b-clock" data-date="${b.props.showDate ? "yes" : "no"}">
  <div class="b-big b-clock-time"></div>
  <div class="b-widget-label b-clock-date"></div>
</div>`,
      js: `// Clock bricks
function updateClocks() {
  const now = new Date();
  document.querySelectorAll(".b-clock").forEach((box) => {
    box.querySelector(".b-clock-time").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    box.querySelector(".b-clock-date").textContent =
      box.dataset.date === "yes" ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";
  });
}
updateClocks();
setInterval(updateClocks, 1000);`,
    },
    picker: {
      label: "Random picker", icon: "🎲", group: "smart",
      props: [
        { key: "title", label: "Title", type: "text", default: "What's for dinner?" },
        { key: "options", label: "Options (one per line)", type: "textarea", default: "Pizza\nTacos\nSushi\nPasta" },
        { key: "button", label: "Button label", type: "text", default: "Pick one!" },
      ],
      html: (b) => `<div class="b-widget b-picker" data-options="${attr(JSON.stringify(lines(b.props.options)))}">
  <div class="b-widget-label">${esc(b.props.title)}</div>
  <div class="b-big b-picker-result">?</div>
  <div class="b-widget-buttons"><button>${esc(b.props.button)}</button></div>
</div>`,
      js: `// Random picker bricks
document.querySelectorAll(".b-picker").forEach((box) => {
  const options = JSON.parse(box.dataset.options || "[]");
  const out = box.querySelector(".b-picker-result");
  box.querySelector("button").onclick = () => {
    if (!options.length) return;
    let spins = 12;
    const spin = setInterval(() => {
      out.textContent = options[Math.floor(Math.random() * options.length)];
      if (--spins <= 0) clearInterval(spin);
    }, 70);
  };
});`,
    },
  };

  // Shared CSS/JS pieces that several bricks use.
  const SHARED_CSS = {
    field: `.b-field { display: flex; flex-direction: column; gap: 6px; font-weight: 600; }
.b-field input[type="range"] { accent-color: var(--accent); }`,
    widget: "",
  };
  const WIDGET_CSS = `.b-widget { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; text-align: center; }
.b-widget-label { color: var(--muted); font-weight: 600; }
.b-big { font-size: 2.6rem; font-weight: 700; margin: 6px 0; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.b-widget-buttons { display: flex; gap: 8px; justify-content: center; }
.b-widget-buttons button, .b-todo form button { font: inherit; font-weight: 600; padding: 8px 16px; border-radius: 10px; border: 0; background: var(--accent); color: #fff; cursor: pointer; }`;

  // ---------- Helpers ----------

  function esc(s) {
    return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }
  function attr(s) {
    return esc(s).replace(/"/g, "&quot;");
  }
  function lines(s) {
    return String(s ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  }
  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  function varName(v, fallback = "value") {
    const clean = String(v ?? "").replace(/[^\w]/g, "");
    return clean || fallback;
  }
  function safeUrl(u) {
    const s = String(u ?? "").trim();
    return /^(https?:|mailto:|#|\/|\.)/i.test(s) ? s : "https://" + s;
  }
  function youtubeId(url) {
    const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : "";
  }
  function alignClass(b) {
    return b.props.align && b.props.align !== "auto" ? ` b-align-${b.props.align}` : "";
  }
  // Text containing {{variable}} gets a data-template so it updates live.
  function templ(text) {
    return /\{\{\s*\w+\s*\}\}/.test(text) ? ` data-template="${attr(text)}"` : "";
  }
  function uid() {
    return "b" + Math.random().toString(36).slice(2, 8);
  }
  function indent(s, n = 2) {
    const pad = " ".repeat(n);
    return s.split("\n").map((l) => (l ? pad + l : l)).join("\n");
  }

  function walk(list, fn) {
    for (const b of list || []) {
      fn(b);
      if (b.children) walk(b.children, fn);
    }
  }

  // Make a clean, valid brick tree (used for templates and for Claude's output).
  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    const out = [];
    for (const raw of list) {
      const def = CATALOG[raw?.type];
      if (!def) continue;
      const props = {};
      for (const p of def.props) {
        let v = raw.props?.[p.key];
        if (p.type === "checkbox") v = typeof v === "boolean" ? v : p.default;
        else if (p.type === "number") v = Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : p.default;
        else if (p.type === "select") v = p.options.includes(v) ? v : p.default;
        else v = typeof v === "string" ? v : v == null ? p.default : String(v);
        props[p.key] = v;
      }
      const brick = { id: uid(), type: raw.type, props };
      if (def.container) brick.children = sanitize(raw.children);
      out.push(brick);
    }
    return out;
  }

  function defaultTheme() {
    return { accent: "#4f6ef7", mode: "light", font: "system", width: "medium" };
  }

  function sanitizeTheme(t) {
    const d = defaultTheme();
    t = t || {};
    return {
      accent: /^#[0-9a-f]{6}$/i.test(t.accent) ? t.accent : d.accent,
      mode: ["light", "dark"].includes(t.mode) ? t.mode : d.mode,
      font: ["system", "rounded", "serif", "mono"].includes(t.font) ? t.font : d.font,
      width: ["narrow", "medium", "wide"].includes(t.width) ? t.width : d.width,
    };
  }

  // ---------- Code generation ----------

  const FONTS = {
    system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, Menlo, Consolas, monospace',
  };
  const WIDTHS = { narrow: "560px", medium: "760px", wide: "1080px" };

  function generate(bricks, theme) {
    theme = sanitizeTheme(theme);
    const used = new Set();
    let needsVars = false;
    walk(bricks, (b) => {
      used.add(b.type);
      if (["input", "slider", "choice", "button"].includes(b.type)) needsVars = true;
      if (b.type === "counter" && b.props.variable) needsVars = true;
      if (/\{\{/.test(b.props.text || "")) needsVars = true;
    });

    const renderList = (list) => list.map((b) => {
      const def = CATALOG[b.type];
      const kids = def.container
        ? (b.children.length ? indent(renderList(b.children)) : "  <!-- empty -->")
        : "";
      return def.html(b, kids);
    }).join("\n\n");

    const html = `<main class="b-page">\n${indent(renderList(bricks))}\n</main>\n`;

    const dark = theme.mode === "dark";
    const cssParts = [
      `/* Generated from bricks — switch to the 🧱 Bricks tab to change it. */
:root {
  --accent: ${theme.accent};
  --bg: ${dark ? "#14171d" : "#f7f8fa"};
  --card: ${dark ? "#1d2129" : "#ffffff"};
  --text: ${dark ? "#e9edf3" : "#1d2330"};
  --muted: ${dark ? "#9aa3b2" : "#6b7385"};
  --border: ${dark ? "#2c323d" : "#e3e6ee"};
  --tint: color-mix(in srgb, var(--accent) ${dark ? 18 : 9}%, var(--bg));
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); font-family: ${FONTS[theme.font]}; }
.b-page { max-width: ${WIDTHS[theme.width]}; margin: 0 auto; padding: 24px 16px 48px; }
.b-page > * + * { margin-top: 18px; }
.b-align-left { text-align: left; }
.b-align-center { text-align: center; }
.b-align-right { text-align: right; }
input, select, textarea { font: inherit; padding: 9px 11px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg); color: var(--text); }`,
    ];
    const seen = new Set();
    let widgets = false;
    for (const type of Object.keys(CATALOG)) {
      if (!used.has(type)) continue;
      const css = CATALOG[type].css;
      if (["counter", "todo", "timer", "notes", "clock", "picker"].includes(type)) widgets = true;
      if (!css) continue;
      const text = SHARED_CSS[css] ?? css;
      if (text && !seen.has(text)) {
        seen.add(text);
        cssParts.push(`/* ${CATALOG[type].label} */\n${text}`);
      }
    }
    if (widgets) cssParts.splice(1, 0, `/* Smart bricks */\n${WIDGET_CSS}`);

    const jsParts = [];
    const needsStorage = used.has("todo") || used.has("notes");
    if (needsStorage) {
      jsParts.push(`// Save and load data in this browser
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}`);
    }
    if (needsVars || used.has("counter")) {
      jsParts.push(`// Variables: inputs store values here, and text with {{name}} updates live.
const state = {};
function renderTemplates() {
  document.querySelectorAll("[data-template]").forEach((el) => {
    el.textContent = fillVars(el.dataset.template);
  });
}
function setVar(name, value) {
  state[name] = value;
  renderTemplates();
}
function fillVars(text) {
  return String(text).replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (_, k) => state[k] ?? "");
}
document.querySelectorAll("input[data-var], select[data-var]").forEach((el) => {
  el.addEventListener("input", () => setVar(el.dataset.var, el.value));
  state[el.dataset.var] = el.value;
});
renderTemplates();`);
    }
    if (used.has("button")) {
      jsParts.push(`// Button bricks
document.querySelectorAll("[data-action]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = fillVars(btn.dataset.value);
    switch (btn.dataset.action) {
      case "message": alert(value); break;
      case "link": window.open(value, "_blank"); break;
      case "confetti": confetti(); break;
      case "scroll to top": window.scrollTo({ top: 0, behavior: "smooth" }); break;
    }
  });
});

function confetti() {
  const colors = ["#d01012", "#f2b705", "#237841", "#0055bf", "#8e44ad"];
  for (let i = 0; i < 80; i++) {
    const bit = document.createElement("div");
    const size = 6 + Math.random() * 6;
    Object.assign(bit.style, {
      position: "fixed", left: Math.random() * 100 + "vw", top: "-12px", width: size + "px", height: size + "px",
      background: colors[i % colors.length], borderRadius: "2px", zIndex: 9999, pointerEvents: "none",
    });
    document.body.appendChild(bit);
    bit.animate(
      [{ transform: "translateY(0) rotate(0)" }, { transform: \`translateY(\${innerHeight + 40}px) rotate(\${Math.random() * 720}deg)\` }],
      { duration: 1500 + Math.random() * 1500, easing: "ease-in" }
    ).onfinish = () => bit.remove();
  }
}`);
    }
    for (const type of Object.keys(CATALOG)) {
      const js = CATALOG[type].js;
      if (used.has(type) && js && js !== "actions") jsParts.push(js);
    }

    return {
      html,
      css: cssParts.join("\n\n") + "\n",
      js: jsParts.length ? jsParts.join("\n\n") + "\n" : "// Generated from bricks — nothing interactive yet.\n",
    };
  }

  // Short description of the catalog for Claude.
  function describeCatalog() {
    return Object.entries(CATALOG).map(([type, d]) => {
      const props = d.props.map((p) => {
        const kind = p.type === "select" ? p.options.map((o) => JSON.stringify(o)).join("|") : p.type === "textarea" ? "text" : p.type;
        return `${p.key}: ${kind}`;
      }).join(", ");
      return `- ${type}${d.container ? " (container: has children)" : ""} — ${d.label}. props { ${props} }`;
    }).join("\n");
  }

  // Strip ids so the tree is compact for Claude.
  function toPlain(list) {
    return (list || []).map((b) => {
      const o = { type: b.type, props: b.props };
      if (b.children) o.children = toPlain(b.children);
      return o;
    });
  }

  // ---------- Editor UI ----------

  const $ = (id) => document.getElementById(id);
  let selectedId = null;
  let drag = null; // { kind: "new", type } or { kind: "move", id }
  let regenTimer = null;

  const project = () => window.WAC?.current();

  // Inline CSS variables for a brick's color (--c) and text color (--t).
  function groupStyle(groupOrType) {
    const g = GROUPS.find((x) => x.id === groupOrType || x.id === CATALOG[groupOrType]?.group);
    return `--c:${g?.color || "#888"};--t:${g?.ink || "#fff"}`;
  }

  function find(list, id, parent = null) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { brick: list[i], list, index: i, parent };
      if (list[i].children) {
        const r = find(list[i].children, id, list[i]);
        if (r) return r;
      }
    }
    return null;
  }

  function contains(brick, id) {
    let hit = false;
    walk(brick.children, (b) => { if (b.id === id) hit = true; });
    return hit;
  }

  function changed({ immediate = false } = {}) {
    const p = project();
    if (!p) return;
    renderCanvas();
    clearTimeout(regenTimer);
    const apply = () => window.WAC.setFiles(generate(p.bricks, p.theme));
    if (immediate) apply();
    else regenTimer = setTimeout(apply, 250);
  }

  function newBrick(type) {
    return sanitize([{ type }])[0];
  }

  // Click on a palette brick: add it next to (or inside) the selected brick.
  function addBrick(type) {
    const p = project();
    const brick = newBrick(type);
    const sel = selectedId && find(p.bricks, selectedId);
    if (sel && sel.brick.children) sel.brick.children.push(brick);
    else if (sel) sel.list.splice(sel.index + 1, 0, brick);
    else p.bricks.push(brick);
    selectedId = brick.id;
    changed();
    renderInspector();
    requestAnimationFrame(() => document.querySelector(`.brick[data-id="${brick.id}"]`)?.scrollIntoView({ block: "nearest" }));
  }

  function renderPalette() {
    const pal = $("brickPalette");
    pal.innerHTML = GROUPS.map((g) => `
      <div class="pal-group">
        <div class="pal-title">${g.label}</div>
        ${Object.entries(CATALOG).filter(([, d]) => d.group === g.id).map(([type, d]) => `
          <button class="pal-brick" draggable="true" data-type="${type}" style="${groupStyle(g.id)}" title="Drag onto your app, or click to add">
            <span class="studs"></span><span class="pal-icon">${d.icon}</span>${d.label}
          </button>`).join("")}
      </div>`).join("");
    pal.querySelectorAll(".pal-brick").forEach((el) => {
      el.addEventListener("click", () => addBrick(el.dataset.type));
      el.addEventListener("dragstart", (e) => {
        drag = { kind: "new", type: el.dataset.type };
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", el.dataset.type);
      });
      el.addEventListener("dragend", clearDrop);
    });
  }

  function summary(b) {
    const p = b.props;
    const s = p.text || p.title || p.label || p.emoji || p.url || (p.items && lines(p.items).join(", ")) || "";
    return String(s).slice(0, 60);
  }

  function brickHtml(b) {
    const def = CATALOG[b.type];
    const kids = def.container
      ? `<div class="brick-slot" data-parent="${b.id}">${b.children.map(brickHtml).join("") || '<div class="slot-empty">Drop bricks here</div>'}</div>`
      : "";
    return `<div class="brick ${def.container ? "is-container" : ""} ${b.id === selectedId ? "selected" : ""}" data-id="${b.id}" draggable="true" style="${groupStyle(b.type)}">
      <div class="brick-head">
        <span class="studs"></span>
        <span class="brick-icon">${def.icon}</span>
        <span class="brick-name">${def.label}</span>
        <span class="brick-sum">${esc(summary(b))}</span>
        <span class="brick-tools">
          <button data-tool="up" title="Move up">↑</button>
          <button data-tool="down" title="Move down">↓</button>
          <button data-tool="dup" title="Duplicate">⧉</button>
          <button data-tool="del" title="Delete">✕</button>
        </span>
      </div>${kids}
    </div>`;
  }

  function renderCanvas() {
    const p = project();
    const canvas = $("brickCanvas");
    if (!p || p.mode !== "bricks") return;
    canvas.innerHTML = p.bricks.length
      ? `<div class="brick-slot root-slot" data-parent="">${p.bricks.map(brickHtml).join("")}</div>`
      : `<div class="brick-slot root-slot empty" data-parent=""><div class="slot-empty big">🧱<br>Drag bricks here (or tap one on the left) to start building</div></div>`;
  }

  function field(p, value) {
    const id = "prop-" + p.key;
    if (p.type === "textarea") return `<label>${p.label}<textarea id="${id}" data-key="${p.key}" rows="3">${esc(value)}</textarea></label>`;
    if (p.type === "checkbox") return `<label class="check"><input type="checkbox" id="${id}" data-key="${p.key}" ${value ? "checked" : ""}> ${p.label}</label>`;
    if (p.type === "select") return `<label>${p.label}<select id="${id}" data-key="${p.key}">${p.options.map((o) => `<option ${o === value ? "selected" : ""}>${o}</option>`).join("")}</select></label>`;
    if (p.type === "color") return `<label>${p.label}<input type="color" id="${id}" data-key="${p.key}" value="${attr(value)}"></label>`;
    return `<label>${p.label}<input type="${p.type === "number" ? "number" : "text"}" id="${id}" data-key="${p.key}" value="${attr(value)}"></label>`;
  }

  const THEME_FIELDS = [
    { key: "accent", label: "Main color", type: "color" },
    { key: "mode", label: "Light or dark", type: "select", options: ["light", "dark"] },
    { key: "font", label: "Font", type: "select", options: ["system", "rounded", "serif", "mono"] },
    { key: "width", label: "Page width", type: "select", options: ["narrow", "medium", "wide"] },
  ];

  function renderInspector() {
    const p = project();
    const box = $("brickInspector");
    if (!p || p.mode !== "bricks") return;
    const sel = selectedId && find(p.bricks, selectedId);
    if (!sel) {
      selectedId = null;
      p.theme = sanitizeTheme(p.theme);
      box.innerHTML = `<div class="insp-head"><strong>🎨 Page style</strong><span class="muted">Select a brick to edit it</span></div>
        <div class="insp-fields">${THEME_FIELDS.map((f) => field(f, p.theme[f.key])).join("")}</div>`;
      box.querySelectorAll("[data-key]").forEach((el) => {
        el.addEventListener("input", () => {
          p.theme[el.dataset.key] = el.value;
          changed();
        });
      });
      return;
    }
    const def = CATALOG[sel.brick.type];
    box.innerHTML = `<div class="insp-head" style="${groupStyle(sel.brick.type)}">
        <span class="insp-chip">${def.icon} ${def.label}</span>
        <div class="spacer"></div>
        <button class="small" id="inspDone">Done</button>
      </div>
      <div class="insp-fields">${def.props.map((f) => field(f, sel.brick.props[f.key])).join("") || '<p class="muted">This brick has no settings.</p>'}</div>`;
    $("inspDone").onclick = () => select(null);
    box.querySelectorAll("[data-key]").forEach((el) => {
      el.addEventListener("input", () => {
        const f = def.props.find((x) => x.key === el.dataset.key);
        sel.brick.props[f.key] = f.type === "checkbox" ? el.checked : f.type === "number" ? num(el.value) : el.value;
        changed();
      });
    });
  }

  function select(id) {
    selectedId = id;
    document.querySelectorAll(".brick.selected").forEach((el) => el.classList.remove("selected"));
    if (id) document.querySelector(`.brick[data-id="${id}"]`)?.classList.add("selected");
    renderInspector();
  }

  // Canvas clicks: select bricks and handle the little tool buttons.
  function onCanvasClick(e) {
    const p = project();
    const el = e.target.closest(".brick");
    if (!el) return select(null);
    const id = el.dataset.id;
    const tool = e.target.closest("[data-tool]")?.dataset.tool;
    if (!tool) return select(id);
    const hit = find(p.bricks, id);
    if (!hit) return;
    const { list, index } = hit;
    if (tool === "up" && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
    if (tool === "down" && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
    if (tool === "dup") {
      const copy = sanitize(toPlain([hit.brick]))[0];
      list.splice(index + 1, 0, copy);
      selectedId = copy.id;
    }
    if (tool === "del") {
      list.splice(index, 1);
      if (selectedId === id || (hit.brick.children && contains(hit.brick, selectedId))) selectedId = null;
    }
    changed();
    renderInspector();
  }

  // ---------- Drag and drop ----------

  function clearDrop() {
    document.querySelectorAll(".drop-before, .drop-after, .drop-into").forEach((el) =>
      el.classList.remove("drop-before", "drop-after", "drop-into"));
  }

  // Work out where a drop would land: { parentId, index, el, cls }
  function dropTarget(e) {
    const p = project();
    const target = e.target.closest(".brick, .brick-slot");
    if (!target || !$("brickCanvas").contains(target)) return null;
    if (target.classList.contains("brick-slot")) {
      const parentId = target.dataset.parent;
      const list = parentId ? find(p.bricks, parentId)?.brick.children : p.bricks;
      return { parentId, index: list ? list.length : 0, el: target, cls: "drop-into" };
    }
    const hit = find(p.bricks, target.dataset.id);
    if (!hit) return null;
    const head = target.querySelector(".brick-head").getBoundingClientRect();
    const after = e.clientY > head.top + head.height / 2;
    return {
      parentId: hit.parent ? hit.parent.id : "",
      index: hit.index + (after ? 1 : 0),
      el: target,
      cls: after ? "drop-after" : "drop-before",
    };
  }

  function onDragOver(e) {
    if (!drag) return;
    const t = dropTarget(e);
    if (!t) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = drag.kind === "new" ? "copy" : "move";
    clearDrop();
    t.el.classList.add(t.cls);
  }

  function onDrop(e) {
    const t = drag && dropTarget(e);
    clearDrop();
    if (!t) return;
    e.preventDefault();
    const p = project();
    const parentList = (id) => (id ? find(p.bricks, id)?.brick.children : p.bricks);
    let brick;
    let index = t.index;
    if (drag.kind === "new") {
      brick = newBrick(drag.type);
    } else {
      const hit = find(p.bricks, drag.id);
      if (!hit) return;
      // Can't drop a container inside itself.
      if (t.parentId && (t.parentId === drag.id || contains(hit.brick, t.parentId))) return;
      if (hit.list === parentList(t.parentId) && hit.index < index) index--;
      hit.list.splice(hit.index, 1);
      brick = hit.brick;
    }
    const list = parentList(t.parentId);
    if (!list) return;
    list.splice(index, 0, brick);
    selectedId = brick.id;
    drag = null;
    changed();
    renderInspector();
  }

  function initUI() {
    renderPalette();
    const canvas = $("brickCanvas");
    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("dragstart", (e) => {
      const el = e.target.closest(".brick");
      if (!el) return;
      e.stopPropagation();
      drag = { kind: "move", id: el.dataset.id };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.id);
      requestAnimationFrame(() => el.classList.add("dragging"));
    });
    canvas.addEventListener("dragend", (e) => {
      e.target.closest?.(".brick")?.classList.remove("dragging");
      drag = null;
      clearDrop();
    });
    canvas.addEventListener("dragover", onDragOver);
    canvas.addEventListener("dragleave", (e) => {
      if (!canvas.contains(e.relatedTarget)) clearDrop();
    });
    canvas.addEventListener("drop", onDrop);
    document.addEventListener("dragend", () => { drag = null; clearDrop(); });

    // Delete key removes the selected brick (when not typing in a field)
    document.addEventListener("keydown", (e) => {
      if (!selectedId || $("bricksPanel").hidden) return;
      if (e.target.closest("input, textarea, select")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const hit = find(project().bricks, selectedId);
        if (!hit) return;
        e.preventDefault();
        hit.list.splice(hit.index, 1);
        selectedId = null;
        changed();
        renderInspector();
      }
    });

    window.addEventListener("wac:showbricks", () => {
      renderCanvas();
      renderInspector();
    });
    window.addEventListener("wac:projectchange", () => {
      selectedId = null;
      if (!$("bricksPanel").hidden) {
        renderCanvas();
        renderInspector();
      }
    });
  }

  window.Bricks = {
    CATALOG,
    generate,
    sanitize,
    sanitizeTheme,
    defaultTheme,
    describeCatalog,
    toPlain,
    initUI,
    // Replace a project's whole brick tree (used by Claude and undo).
    setTree(p, bricks, theme) {
      p.mode = "bricks";
      p.bricks = bricks;
      p.theme = sanitizeTheme(theme ?? p.theme);
      Object.assign(p, generate(p.bricks, p.theme));
      selectedId = null;
      if (window.WAC?.isActive(p.id) && !$("bricksPanel").hidden) {
        renderCanvas();
        renderInspector();
      }
    },
  };
})();
