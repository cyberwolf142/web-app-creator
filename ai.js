// Claude integration: chat panel that writes and edits the project's HTML/CSS/JS.
// Runs fully in the browser using the user's own Anthropic API key.
import Anthropic from "./vendor/anthropic-sdk-0.132.1.js";

const SETTINGS_KEY = "webAppCreator.claude";
const MAX_HISTORY = 12; // past chat messages sent along for context
const MAX_UNDO = 20;

const SYSTEM_PROMPT = `You are the coding assistant inside "Web App Creator", a small in-browser tool for building personal web apps.
Each project has exactly three files, which are combined into one page:
- html: the contents of <body> only. No <!doctype>, <html>, <head>, <body>, <style>, or inline <script> tags. External libraries are fine via <script src="https://cdn.jsdelivr.net/..."> or <link> tags.
- css: the stylesheet.
- js: plain browser JavaScript that runs at the end of <body>. No build step, no imports from npm, no TypeScript.

Every request includes the current files. Reply in this format:
1. One to three short sentences saying what you did or will do, in plain language for a beginner.
2. Then each file you changed, as a fenced code block tagged html, css or js, containing the COMPLETE new file (never a partial diff or "..." placeholders). Leave out files you didn't change.

Guidelines:
- Make apps that work right away in the preview, look clean and modern, and work on phones.
- Use localStorage (wrapped in try/catch) when the app should remember things.
- Keep code readable with short comments, since the user is learning and will build on it.
- If the request is a question rather than a change, just answer it without code blocks.`;

// Prompt for projects built with 🧱 bricks: Claude edits the brick tree as JSON.
const BRICKS_PROMPT = () => `You are the assistant inside "Web App Creator". This project is built Lego-style from bricks: the user stacks bricks and the app's code is generated from them.
Every request includes the current app as JSON. Reply in this format:
1. One to three short sentences, in plain language for a beginner, saying what you built or changed.
2. Then ONE fenced code block tagged bricks containing the COMPLETE new app as JSON: {"theme": {...}, "bricks": [...]}.
   Each brick is {"type": "...", "props": {...}} and container bricks also have "children": [...]. Keep bricks the user didn't ask to change.

Brick types (use only these types and props; omitted props get defaults):
${Bricks.describeCatalog()}

Theme: {"accent": "#rrggbb", "mode": "light"|"dark", "font": "system"|"rounded"|"serif"|"mono", "width": "narrow"|"medium"|"wide"}

Tips:
- Variables link bricks together: input, slider, dropdown (and counter, if given a variable) store a value under their "variable" name; heading/text and a button's message can show it with {{name}}.
- Use sections, rows and cards to group things so the app looks tidy. Smart bricks (counter, todo, timer, notes, clock, picker) already work and save data on their own.
- If something can't be done with bricks, build the closest version and mention that "Switch to code mode" (in the HTML/CSS/JS tabs) allows custom code.
- If the request is a question rather than a change, just answer it without a code block.`;

const $ = (id) => document.getElementById(id);
const log = $("chatLog");
const input = $("chatInput");

let settings = loadSettings();
let controller = null; // aborts the running request
let busy = false;

// ---------- Settings ----------

function loadSettings() {
  const defaults = { apiKey: "", model: "claude-opus-5-5", effort: "medium" };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return defaults;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

const settingsDialog = $("settingsDialog");

function openSettings() {
  $("apiKeyInput").value = settings.apiKey;
  $("modelSelect").value = settings.model;
  $("effortSelect").value = settings.effort;
  settingsDialog.showModal();
}

$("settingsBtn").onclick = openSettings;
$("forgetKeyBtn").onclick = () => {
  $("apiKeyInput").value = "";
  settings.apiKey = "";
  saveSettings();
};
settingsDialog.addEventListener("close", () => {
  if (settingsDialog.returnValue !== "ok") return;
  settings.apiKey = $("apiKeyInput").value.trim();
  settings.model = $("modelSelect").value;
  settings.effort = $("effortSelect").value;
  saveSettings();
  renderChat();
});

// ---------- Rendering ----------

const FILE_LABEL = { html: "HTML", css: "CSS", js: "JS", javascript: "JS", bricks: "🧱 bricks" };
const FENCE = /```(html|css|js|javascript|bricks)[^\n]*\n([\s\S]*?)(```|$)/g;

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Very small markdown: **bold**, `code`, line breaks.
function formatText(text) {
  return escapeHtml(text.trim())
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

// Assistant replies: show the explanation, and a small pill for each file written.
function formatAssistant(text, streaming) {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(FENCE)) {
    html += formatText(text.slice(last, m.index));
    const label = FILE_LABEL[m[1]];
    const lines = m[2].split("\n").length;
    const done = m[3] === "```";
    html += `<div class="file-pill ${done ? "" : "writing"}">${done ? "✓ Updated" : "✎ Writing"} ${label}
      <span>${lines} line${lines === 1 ? "" : "s"}</span></div>`;
    last = m.index + m[0].length;
  }
  html += formatText(text.slice(last));
  if (streaming && !html) html = '<span class="thinking">Thinking…</span>';
  return html;
}

function addBubble(role, html, extraClass = "") {
  const div = document.createElement("div");
  div.className = `msg ${role} ${extraClass}`;
  div.innerHTML = html;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function renderChat() {
  const p = WAC.current();
  log.innerHTML = "";
  if (!settings.apiKey) {
    addBubble(
      "system",
      `<strong>Connect Claude to start.</strong><br>Add your Anthropic API key in settings.
       <br><button type="button" class="small primary" id="openSettingsInline">Open settings</button>`
    );
    $("openSettingsInline").onclick = openSettings;
  } else if (!p?.chat?.length) {
    addBubble(
      "system",
      `Tell Claude what to build or change. Try:<br>
       <button type="button" class="suggest small">Make it look nicer with a dark theme</button>
       <button type="button" class="suggest small">Add a button that saves my data</button>
       <button type="button" class="suggest small">Explain how this code works</button>`
    );
    log.querySelectorAll(".suggest").forEach((b) => {
      b.onclick = () => {
        input.value = b.textContent;
        input.focus();
      };
    });
  }
  for (const m of p?.chat ?? []) {
    if (m.role === "user") addBubble("user", formatText(m.text));
    else addBubble("assistant", formatAssistant(m.text, false));
  }
  $("undoBtn").disabled = !p?.undo?.length || busy;
}

function setBusy(on) {
  busy = on;
  $("sendBtn").hidden = on;
  $("stopBtn").hidden = !on;
  $("fixBtn").disabled = on;
  $("undoBtn").disabled = on || !WAC.current()?.undo?.length;
}

// ---------- Talking to Claude ----------

function filesBlock(p) {
  return ["html", "css", "js"].map((f) => "```" + f + "\n" + (p[f] || "") + "\n```").join("\n\n");
}

// Older replies are sent without their code (the current files are always attached), to save tokens.
function stripCode(text) {
  return text.replace(FENCE, (_, lang) => `[wrote the full ${FILE_LABEL[lang]} file]`).trim();
}

function currentState(p) {
  if (p.mode === "bricks") {
    const app = { theme: p.theme, bricks: Bricks.toPlain(p.bricks) };
    return "Current app:\n\n```bricks\n" + JSON.stringify(app, null, 1) + "\n```";
  }
  return "Current files:\n\n" + filesBlock(p);
}

function buildMessages(p, request) {
  const history = (p.chat || []).slice(-MAX_HISTORY);
  // The API expects the conversation to start with a user message.
  while (history.length && history[0].role !== "user") history.shift();
  const messages = history.map((m) => ({
    role: m.role,
    content: m.role === "assistant" ? stripCode(m.text) || "(no reply)" : m.text,
  }));
  messages.push({
    role: "user",
    content: `Project name: ${p.name}\n\n${currentState(p)}\n\nRequest: ${request}`,
  });
  return messages;
}

function requestParams(messages, p) {
  const params = {
    model: settings.model,
    max_tokens: 64000,
    system: p.mode === "bricks" ? BRICKS_PROMPT() : SYSTEM_PROMPT,
    output_config: { effort: settings.effort },
    messages,
  };
  // If the main model declines a request, let the API retry on a suitable fallback model.
  if (settings.model !== "claude-haiku-5-5") {
    params.betas = ["server-side-fallback-2026-07-01"];
    params.fallbacks = "default";
  }
  return params;
}

function extractFiles(text) {
  const files = {};
  for (const m of text.matchAll(FENCE)) {
    if (m[3] !== "```") continue; // skip a block cut off mid-way
    if (m[1] === "bricks") {
      try {
        const data = JSON.parse(m[2]);
        files.bricks = Bricks.sanitize(Array.isArray(data) ? data : data.bricks);
        files.theme = Array.isArray(data) ? null : data.theme;
      } catch {
        files.badBricks = true;
      }
      continue;
    }
    const key = m[1] === "javascript" ? "js" : m[1];
    files[key] = m[2].replace(/\n$/, "") + "\n";
  }
  return files;
}

function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "Your API key was rejected. Check it in settings (⚙).";
  if (err instanceof Anthropic.PermissionDeniedError) return "This API key doesn't have access to that model. Try another model in settings.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limit hit — wait a moment and try again.";
  if (err instanceof Anthropic.BadRequestError) {
    const msg = err.error?.error?.message || err.message;
    if (/credit balance/i.test(msg)) return "Your Anthropic account is out of credits. Add some at console.anthropic.com.";
    return "Request error: " + msg;
  }
  if (err instanceof Anthropic.InternalServerError) return "Anthropic's servers had a problem. Try again in a moment.";
  if (err instanceof Anthropic.APIConnectionError) return "Couldn't reach Anthropic. Check your internet connection.";
  return "Something went wrong: " + (err?.message || err);
}

async function ask(request) {
  request = request.trim();
  if (!request || busy) return;
  if (!settings.apiKey) {
    openSettings();
    return;
  }

  const project = WAC.current();
  project.chat = project.chat || [];
  const messages = buildMessages(project, request);
  project.chat.push({ role: "user", text: request });
  WAC.saveProjects();
  renderChat();

  const bubble = addBubble("assistant", formatAssistant("", true), "streaming");
  setBusy(true);
  controller = new AbortController();
  let text = "";

  try {
    const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });
    const stream = client.beta.messages.stream(requestParams(messages, project), { signal: controller.signal });
    stream.on("text", (delta) => {
      text += delta;
      bubble.innerHTML = formatAssistant(text, true);
      log.scrollTop = log.scrollHeight;
    });
    const final = await stream.finalMessage();

    if (final.stop_reason === "refusal") {
      text = text || "Claude declined this request. Try rephrasing it.";
    } else if (final.stop_reason === "max_tokens") {
      text += "\n\n(The reply was too long and got cut off — any unfinished file was not applied.)";
    }

    const files = extractFiles(text);
    if (files.badBricks) text += "\n\n(Claude's bricks couldn't be read, so nothing changed. Try asking again.)";
    const isBricks = project.mode === "bricks";
    const brickChange = isBricks && files.bricks;
    const codeChange = !isBricks && ["html", "css", "js"].some((k) => k in files);
    if (brickChange || codeChange) {
      project.undo = [...(project.undo || []), snapshot(project)].slice(-MAX_UNDO);
      if (brickChange) Bricks.setTree(project, files.bricks, files.theme);
      else Object.assign(project, { html: files.html ?? project.html, css: files.css ?? project.css, js: files.js ?? project.js });
      if (WAC.isActive(project.id)) WAC.setFiles(project);
      else WAC.saveProjects();
    }
    project.chat.push({ role: "assistant", text: text || "(no reply)" });
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError || controller?.signal.aborted) {
      if (text) project.chat.push({ role: "assistant", text: stripCode(text) + "\n\n(Stopped — no changes applied.)" });
    } else {
      console.error(err);
      project.chat.pop(); // let them retry the same message
      input.value = input.value || request;
      WAC.saveProjects();
      setBusy(false);
      controller = null;
      if (WAC.isActive(project.id)) {
        renderChat();
        addBubble("error", escapeHtml(friendlyError(err)));
      }
      return;
    }
  }

  WAC.saveProjects();
  setBusy(false);
  controller = null;
  if (WAC.isActive(project.id)) renderChat();
}

// ---------- Wiring ----------

$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value;
  input.value = "";
  ask(text);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    $("chatForm").requestSubmit();
  }
});

$("stopBtn").onclick = () => controller?.abort();

function snapshot(p) {
  const s = { html: p.html, css: p.css, js: p.js };
  if (p.mode === "bricks") {
    s.bricks = structuredClone(p.bricks);
    s.theme = { ...p.theme };
  }
  return s;
}

$("undoBtn").onclick = () => {
  const p = WAC.current();
  const prev = p?.undo?.pop();
  if (!prev) return;
  if (prev.bricks && p.mode === "bricks") Bricks.setTree(p, prev.bricks, prev.theme);
  WAC.setFiles(prev.bricks && p.mode === "bricks" ? p : prev);
  p.chat = p.chat || [];
  p.chat.push({ role: "assistant", text: "(You undid the last change.)" });
  WAC.saveProjects();
  renderChat();
};

$("clearChatBtn").onclick = () => {
  const p = WAC.current();
  if (!p || busy || !confirm("Clear this project's chat history? Your code stays as it is.")) return;
  p.chat = [];
  WAC.saveProjects();
  renderChat();
};

$("fixBtn").onclick = () => {
  const errors = WAC.getConsoleErrors();
  WAC.showFile("ai");
  ask(`The preview shows these errors. Please fix them:\n${errors}`);
};

window.addEventListener("wac:ask", (e) => ask(e.detail));
window.addEventListener("wac:showchat", () => {
  renderChat();
  input.focus();
});
window.addEventListener("wac:projectchange", () => {
  if (!$("chatPanel").hidden) renderChat();
  $("undoBtn").disabled = busy || !WAC.current()?.undo?.length;
});

renderChat();
