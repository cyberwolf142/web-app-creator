# Web App Creator

A simple in-browser workspace for building small personal web apps.
No installs, no build step — just HTML, CSS and JavaScript.

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

Just open `index.html` in your browser. Or, for a local server:

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
| `templates.js` | Starter templates — add your own here           |

## Ideas to build on

- Add your own templates in `templates.js`
- Swap the plain textarea for a code editor like CodeMirror or Monaco
- Add a "Share" button that copies the project as a link
- Sync projects to GitHub Gists so they're saved across devices

Note: projects live in this browser's storage. Clearing site data deletes them,
so use **Export** to back up anything you care about.
