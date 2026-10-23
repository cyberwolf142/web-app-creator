# Web App Creator

A simple in-browser workspace for building small personal web apps — with **Claude** built in.
Describe what you want, and Claude writes the HTML, CSS and JavaScript while you watch the preview.
No installs, no build step.

## 🧱 Building with bricks

Build apps like Lego — no code needed:

- **Drag** a brick from the palette onto your app (or **tap** it to add it after the selected brick).
- **Stack bricks inside** Section, Row and Card bricks to group them.
- **Click a brick** to change its settings; click empty space to change the page colors and font.
- Hover a brick for **↑ ↓ ⧉ ✕** (move, duplicate, delete), or drag it somewhere else.

Brick sets: **Layout** (section, row, card), **Text** (heading, text, list, link),
**Media** (image, emoji, YouTube video, divider, spacer), **Inputs** (button, text box, slider, dropdown),
and **Smart bricks** that already work on their own (counter, to-do list, timer, notepad, clock, random picker).

**Connect bricks with variables:** give a text box the variable `name`, then write `Hello {{name}}!`
in any heading or text brick — it updates as you type.

The HTML/CSS/JS tabs show the code your bricks generate (read-only). When you outgrow bricks,
click **Switch to code mode** there to edit the code by hand. Add your own bricks in `bricks.js`.

## Building with Claude

1. Click **⚙** (top right) and paste your Anthropic API key
   (get one at [console.anthropic.com](https://console.anthropic.com/settings/keys)).
2. Open the **✨ Claude** tab and describe what to build or change, e.g.
   *"a habit tracker with a weekly grid"* or *"make the buttons bigger"*.
3. Claude replies with a short explanation and updates the files; the preview reloads.
   In a 🧱 brick project, Claude builds with bricks too — so you can keep tweaking by hand afterwards.

Also:
- **+ New → "Describe your app"** creates a project and has Claude build it from scratch.
- **✨ Ask Claude to fix errors** appears above the preview when your code throws an error.
- **↶ Undo change** reverts Claude's last edit (up to 20 steps per project).
- Choose the model (Opus 5.5 / Sonnet 5.5 / Haiku 5.5) and effort level in settings.

**About your API key:** it is stored only in your browser's local storage and sent only to
Anthropic's API (directly from your browser — there is no server). Anyone using the same
browser profile could read it, so don't save it on a shared computer. API usage is billed
to your Anthropic account. Use **Forget key** in settings to remove it.

## Features

- **Projects** — create, rename, duplicate and delete projects (saved in your browser)
- **Editors** for HTML, CSS and JS with a **live preview** next to them
- **Console** under the preview shows `console.log` output and errors
- **Templates** — Blank, Counter, To-do list, Landing page
- **Export** any project as a single `.html` file you can host anywhere
- **Import** an existing `.html` file to keep working on it
- Works on desktop and phone, light and dark mode

Shortcuts: `Ctrl/Cmd + Enter` runs the preview, `Tab` indents.

## Run it locally

Serve the folder with any static web server (the Claude feature needs one,
because browsers block JavaScript modules opened straight from a file):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it on GitHub Pages

1. Create a new repository on GitHub (for example `web-app-creator`).
2. Push this folder to it:
   ```bash
   git remote add origin https://github.com/<your-username>/web-app-creator.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**, set **Source** to *Deploy from a branch*,
   pick `main` and `/ (root)`, then **Save**.
4. After a minute your app is live at
   `https://<your-username>.github.io/web-app-creator/`.

To publish an app you *made* with it: click **Export**, rename the file to
`index.html`, and push it to its own repo with Pages turned on.

## Files

| File           | What it does                                    |
| -------------- | ----------------------------------------------- |
| `index.html`   | Page layout                                     |
| `style.css`    | Look and feel (colors are at the top)           |
| `app.js`       | Projects, editor, preview, export/import        |
| `bricks.js`    | 🧱 Brick catalog, code generator and builder UI |
| `ai.js`        | Claude chat: prompt, streaming, applying edits  |
| `vendor/`      | Anthropic JavaScript SDK, bundled for browsers  |
| `templates.js` | Starter templates — add your own here           |

## Ideas to build on

- Add your own templates in `templates.js`
- Swap the plain textarea for a code editor like CodeMirror or Monaco
- Add a "Share" button that copies the project as a link
- Sync projects to GitHub Gists so they're saved across devices

Note: projects live in this browser's storage. Clearing site data deletes them,
so use **Export** to back up anything you care about.
