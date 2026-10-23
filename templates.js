// Starter templates for new projects.
// To add your own, copy one of these blocks and change it.
const TEMPLATES = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty page",
    html: `<h1>Hello!</h1>\n<p>Start building here.</p>\n`,
    css: `body {\n  font-family: system-ui, sans-serif;\n  margin: 2rem;\n}\n`,
    js: `console.log("Ready");\n`,
  },
  {
    id: "counter",
    name: "Counter",
    description: "Buttons + state",
    html: `<main>
  <h1>Counter</h1>
  <p id="count">0</p>
  <button id="minus">−</button>
  <button id="plus">+</button>
  <button id="reset">Reset</button>
</main>
`,
    css: `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: #f3f5ff;
}
main { text-align: center; }
#count { font-size: 4rem; margin: 1rem 0; }
button {
  font-size: 1.2rem;
  padding: .5rem 1rem;
  margin: 0 .25rem;
  border-radius: 8px;
  border: 1px solid #ccd;
  cursor: pointer;
}
`,
    js: `let count = 0;
const countEl = document.getElementById("count");

function render() {
  countEl.textContent = count;
}

document.getElementById("plus").onclick = () => { count++; render(); };
document.getElementById("minus").onclick = () => { count--; render(); };
document.getElementById("reset").onclick = () => { count = 0; render(); };
`,
  },
  {
    id: "todo",
    name: "To-do list",
    description: "Saves to the browser",
    html: `<main>
  <h1>My To-dos</h1>
  <form id="form">
    <input id="input" placeholder="What needs doing?" autocomplete="off">
    <button>Add</button>
  </form>
  <ul id="list"></ul>
</main>
`,
    css: `body {
  font-family: system-ui, sans-serif;
  background: #f6f7f9;
  margin: 0;
  padding: 2rem 1rem;
}
main { max-width: 420px; margin: 0 auto; }
form { display: flex; gap: .5rem; }
input { flex: 1; padding: .6rem; font-size: 1rem; border: 1px solid #ccd; border-radius: 6px; }
button { padding: .6rem 1rem; border-radius: 6px; border: 0; background: #4f6ef7; color: #fff; cursor: pointer; }
ul { list-style: none; padding: 0; }
li {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: #fff;
  padding: .6rem;
  margin-top: .5rem;
  border-radius: 6px;
}
li.done span { text-decoration: line-through; color: #999; }
li span { flex: 1; }
li button { background: transparent; color: #c33; padding: 0 .4rem; }
`,
    js: `const KEY = "todos";
let todos = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(todos)); } catch {}
}

function render() {
  const list = document.getElementById("list");
  list.innerHTML = "";
  todos.forEach((todo, i) => {
    const li = document.createElement("li");
    li.className = todo.done ? "done" : "";
    li.innerHTML = '<input type="checkbox"><span></span><button>✕</button>';
    li.querySelector("span").textContent = todo.text;
    const box = li.querySelector("input");
    box.checked = todo.done;
    box.onchange = () => { todo.done = box.checked; save(); render(); };
    li.querySelector("button").onclick = () => { todos.splice(i, 1); save(); render(); };
    list.appendChild(li);
  });
}

document.getElementById("form").onsubmit = (e) => {
  e.preventDefault();
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;
  todos.push({ text, done: false });
  input.value = "";
  save();
  render();
};

render();
`,
  },
  {
    id: "landing",
    name: "Landing page",
    description: "Hero + features",
    html: `<header class="hero">
  <h1>My Project</h1>
  <p>A short, catchy sentence about what it does.</p>
  <a class="cta" href="#features">Learn more</a>
</header>

<section id="features" class="features">
  <div class="card"><h3>Fast</h3><p>Describe a feature here.</p></div>
  <div class="card"><h3>Simple</h3><p>Describe a feature here.</p></div>
  <div class="card"><h3>Fun</h3><p>Describe a feature here.</p></div>
</section>

<footer>Made by me</footer>
`,
    css: `body { font-family: system-ui, sans-serif; margin: 0; color: #1d2330; }
.hero {
  text-align: center;
  padding: 5rem 1rem;
  background: linear-gradient(135deg, #4f6ef7, #9b5cf6);
  color: #fff;
}
.hero h1 { font-size: 3rem; margin: 0 0 .5rem; }
.cta {
  display: inline-block;
  margin-top: 1rem;
  padding: .7rem 1.4rem;
  background: #fff;
  color: #4f6ef7;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
}
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  max-width: 900px;
  margin: 3rem auto;
  padding: 0 1rem;
}
.card { padding: 1.5rem; border: 1px solid #e3e6ee; border-radius: 12px; }
footer { text-align: center; padding: 2rem; color: #888; }
`,
    js: `// Smooth scroll for the button
document.querySelector(".cta").addEventListener("click", (e) => {
  e.preventDefault();
  document.querySelector("#features").scrollIntoView({ behavior: "smooth" });
});
`,
  },
];
