// Web App Creator — main logic.
// Projects are stored in the browser's localStorage, so they stay on this device.

const STORAGE_KEY = "webAppCreator.projects";
const ACTIVE_KEY = "webAppCreator.activeId";

const $ = (id) => document.getElementById(id);
const editor = $("editor");
const preview = $("preview");
const consoleEl = $("console");

let projects = loadProjects();
let activeId = null;
let activeFile = "html";
let runTimer = null;
let saveTimer = null;

// ---------- Storage ----------

function loadProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    localStorage.setItem(ACTIVE_KEY, activeId);
    $("saveStatus").textContent = "Saved";
  } catch {
    $("saveStatus").textContent = "Not saved (storage unavailable)";
  }
}

function scheduleSave() {
  $("saveStatus").textContent = "Saving…";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProjects, 400);
}

// ---------- Projects ----------

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function current() {
  return projects.find((p) => p.id === activeId);
}

function createProject(name, templateId = "blank") {
  const t = TEMPLATES.find((x) => x.id === templateId) || TEMPLATES[0];
  const project = {
    id: uid(),
    name: name || "Untitled",
    html: t.html,
    css: t.css,
    js: t.js,
    updated: Date.now(),
  };
  if (t.bricks) {
    project.mode = "bricks";
    project.bricks = Bricks.sanitize(t.bricks);
    project.theme = Bricks.sanitizeTheme(t.theme);
    Object.assign(project, Bricks.generate(project.bricks, project.theme));
  }
  projects.unshift(project);
  openProject(project.id);
  return project;
}

function openProject(id) {
  activeId = id;
  const p = current();
  if (!p) return;
  $("projectName").value = p.name;
  const isBricks = p.mode === "bricks";
  document.querySelector(".bricks-tab").hidden = !isBricks;
  if (isBricks && activeFile !== "ai") activeFile = "bricks";
  if (!isBricks && activeFile === "bricks") activeFile = "html";
  showFile(activeFile);
  window.dispatchEvent(new Event("wac:projectchange"));
  renderList();
  saveProjects();
  run();
  if (window.innerWidth <= 800) $("sidebar").classList.add("hidden");
}

function deleteProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p || !confirm(`Delete "${p.name}"? This can't be undone.`)) return;
  projects = projects.filter((x) => x.id !== id);
  if (projects.length === 0) createProject("My App", "blank");
  else if (id === activeId) openProject(projects[0].id);
  else { renderList(); saveProjects(); }
}

function duplicateProject(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  const copy = { ...structuredClone(p), id: uid(), name: p.name + " (copy)", updated: Date.now() };
  projects.unshift(copy);
  openProject(copy.id);
}

function renderList() {
  const list = $("projectList");
  list.innerHTML = "";
  for (const p of projects) {
    const li = document.createElement("li");
    li.className = p.id === activeId ? "active" : "";
    li.innerHTML = `<span class="name"></span>
      <span class="actions">
        <button data-act="dup" title="Duplicate">⧉</button>
        <button data-act="del" title="Delete">✕</button>
      </span>`;
    li.querySelector(".name").textContent = p.name;
    li.onclick = (e) => {
      const act = e.target.dataset.act;
      if (act === "del") deleteProject(p.id);
      else if (act === "dup") duplicateProject(p.id);
      else if (p.id !== activeId) openProject(p.id);
    };
    list.appendChild(li);
  }
}

// ---------- Editor ----------

function showFile(file) {
  activeFile = file;
  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.file === file);
  });
  const isChat = file === "ai";
  const isBricks = file === "bricks";
  const generated = current()?.mode === "bricks";
  editor.hidden = isChat || isBricks;
  $("chatPanel").hidden = !isChat;
  $("bricksPanel").hidden = !isBricks;
  $("codeBanner").hidden = isChat || isBricks || !generated;
  document.querySelector(".workspace").classList.toggle("wide-left", isBricks);
  if (isChat) {
    window.dispatchEvent(new Event("wac:showchat"));
    return;
  }
  if (isBricks) {
    window.dispatchEvent(new Event("wac:showbricks"));
    return;
  }
  editor.readOnly = generated;
  editor.value = current()?.[file] ?? "";
  editor.scrollTop = 0;
}

editor.addEventListener("input", () => {
  const p = current();
  if (!p || activeFile === "ai" || activeFile === "bricks" || p.mode === "bricks") return;
  p[activeFile] = editor.value;
  p.updated = Date.now();
  scheduleSave();
  if ($("autoRun").checked) {
    clearTimeout(runTimer);
    runTimer = setTimeout(run, 600);
  }
});

// Tab key inserts two spaces instead of leaving the editor
editor.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && !e.shiftKey) {
    e.preventDefault();
    document.execCommand("insertText", false, "  ");
  }
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    run();
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => showFile(tab.dataset.file);
});

$("projectName").addEventListener("input", (e) => {
  const p = current();
  if (!p) return;
  p.name = e.target.value || "Untitled";
  renderList();
  scheduleSave();
});

// ---------- Preview ----------

// Small script injected into the preview so console output shows up below it.
const CONSOLE_BRIDGE = `<script>
(function () {
  function send(level, args) {
    try {
      parent.postMessage({ __wac: true, level: level, text: args.map(function (a) {
        if (a instanceof Error) return a.message;
        if (typeof a === "object") { try { return JSON.stringify(a); } catch (e) { return String(a); } }
        return String(a);
      }).join(" ") }, "*");
    } catch (e) {}
  }
  ["log", "info", "warn", "error"].forEach(function (level) {
    var orig = console[level];
    console[level] = function () { send(level, [].slice.call(arguments)); orig.apply(console, arguments); };
  });
  window.addEventListener("error", function (e) { send("error", [e.message + " (line " + e.lineno + ")"]); });
})();
<\/script>`;

function escapeScript(code) {
  return code.replace(/<\/script/gi, "<\\/script");
}

function buildDocument(p, { withConsole = false } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(p.name)}</title>
${withConsole ? CONSOLE_BRIDGE : ""}
<style>
${p.css}
</style>
</head>
<body>
${p.html}
<script>
${escapeScript(p.js)}
</script>
</body>
</html>
`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function run() {
  const p = current();
  if (!p) return;
  consoleEl.innerHTML = "";
  $("fixBtn").hidden = true;
  preview.srcdoc = buildDocument(p, { withConsole: true });
}

window.addEventListener("message", (e) => {
  if (e.source !== preview.contentWindow || !e.data?.__wac) return;
  const line = document.createElement("div");
  line.className = e.data.level;
  line.textContent = (e.data.level === "log" || e.data.level === "info" ? "› " : e.data.level + ": ") + e.data.text;
  consoleEl.appendChild(line);
  if (e.data.level === "error") $("fixBtn").hidden = false;
  consoleEl.scrollTop = consoleEl.scrollHeight;
});

$("runBtn").onclick = run;
$("clearConsole").onclick = () => {
  consoleEl.innerHTML = "";
  $("fixBtn").hidden = true;
};

$("openTabBtn").onclick = () => {
  const p = current();
  if (!p) return;
  const url = URL.createObjectURL(new Blob([buildDocument(p)], { type: "text/html" }));
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// ---------- Export / Import ----------

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
}

$("exportBtn").onclick = () => {
  const p = current();
  if (!p) return;
  const blob = new Blob([buildDocument(p)], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = slug(p.name) + ".html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

$("importInput").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const doc = new DOMParser().parseFromString(text, "text/html");
  const css = [...doc.querySelectorAll("style")].map((s) => s.textContent.trim()).join("\n\n");
  const js = [...doc.querySelectorAll("script:not([src])")].map((s) => s.textContent.trim()).join("\n\n");
  doc.querySelectorAll("style, script:not([src])").forEach((el) => el.remove());
  const p = createProject(doc.title || file.name.replace(/\.html?$/i, ""), "blank");
  p.html = doc.body.innerHTML.trim() + "\n";
  p.css = css + "\n";
  p.js = js + "\n";
  showFile("html");
  saveProjects();
  run();
  e.target.value = "";
};

// ---------- New project dialog ----------

const dialog = $("newDialog");
$("templateList").innerHTML = TEMPLATES.map(
  (t, i) => `<label><input type="radio" name="template" value="${t.id}" ${i === 0 ? "checked" : ""}>${t.name}<small>${t.description}</small></label>`
).join("");

$("newBtn").onclick = () => {
  $("newName").value = "My App";
  $("newPrompt").value = "";
  dialog.showModal();
  $("newName").select();
};

dialog.addEventListener("close", () => {
  if (dialog.returnValue !== "ok") return;
  const prompt = $("newPrompt").value.trim();
  let templateId = dialog.querySelector("input[name=template]:checked")?.value;
  // With a description, Claude builds from an empty project (bricks or code, matching the chosen template).
  if (prompt) templateId = templateId?.startsWith("bricks") ? "bricks-blank" : "blank";
  createProject($("newName").value.trim(), templateId);
  if (prompt) {
    showFile("ai");
    window.dispatchEvent(new CustomEvent("wac:ask", { detail: prompt }));
  }
});

$("toggleSidebar").onclick = () => $("sidebar").classList.toggle("hidden");

// ---------- Shared with ai.js ----------

window.WAC = {
  current,
  run,
  saveProjects,
  showFile,
  getConsoleErrors: () =>
    [...consoleEl.querySelectorAll(".error")].map((el) => el.textContent).join("\n"),
  // Replace project files (only the ones given) and refresh everything.
  setFiles(files) {
    const p = current();
    if (!p) return;
    for (const key of ["html", "css", "js"]) {
      if (typeof files[key] === "string") p[key] = files[key];
    }
    p.updated = Date.now();
    saveProjects();
    if (["html", "css", "js"].includes(activeFile)) showFile(activeFile);
    run();
  },
  isActive: (id) => id === activeId,
  activeFile: () => activeFile,
};

// Turn a brick project into a normal code project.
$("detachBtn").onclick = () => {
  const p = current();
  if (!p || !confirm("Switch this project to code mode? You can edit the code freely, but you won't be able to use bricks for it any more. (Tip: duplicate the project first to keep a brick version.)")) return;
  p.mode = "code";
  delete p.bricks;
  delete p.theme;
  saveProjects();
  openProject(p.id);
};

Bricks.initUI();

// ---------- Start ----------

if (projects.length === 0) {
  createProject("My First App", "bricks-starter");
} else {
  let saved = null;
  try { saved = localStorage.getItem(ACTIVE_KEY); } catch {}
  openProject(projects.some((p) => p.id === saved) ? saved : projects[0].id);
}
