import { getHost } from "../utils/host.js";
import { getAll, saveAll } from "../utils/storage.js";

const notesList = document.getElementById("notes-list");
const newNoteBtn = document.getElementById("new-note");

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");

const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

const hostLabel = document.getElementById("host");

const copyBtn = document.getElementById("copy");
const emailBtn = document.getElementById("email");

let host;
let data;
let currentNote;
let saveTimer;

newNoteBtn.onclick = createNote;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveAll(data);
  }, 300);
}

async function init() {
  host = await getHost();
  hostLabel.textContent = "WORKSPACE: " + host;

  data = await getAll();

  if (!data[host]) data[host] = { notes: [] };

  if (data[host].notes.length === 0) {
    createNote();
  } else {
    renderNotes();
    loadNote(data[host].notes[0].id);
  }

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function createNote() {
  const count = data[host].notes.length;
  const title = count === 0 ? "New Note" : `New Note (${count})`;

  const note = {
    id: Date.now(),
    title,
    host,
    content: "",
    todos: [],
  };

  data[host].notes.push(note);
  save();
  renderNotes();
  loadNote(note.id);
}

function renderNotes() {
  notesList.innerHTML = "";

  data[host].notes.forEach((n) => {
    const li = document.createElement("li");

    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    li.innerHTML = `
      <span style="overflow: hidden; text-overflow: ellipsis;">${n.title || "Untitled"}</span>
      <button data-id="${n.id}" style="all: unset; color: var(--text-muted); padding: 2px 4px;">✕</button>
    `;

    li.onclick = () => loadNote(n.id);

    li.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      deleteNote(n.id);
    };

    notesList.appendChild(li);
  });
}

function loadNote(id) {
  currentNote = data[host].notes.find((n) => n.id === id);
  if (!currentNote) return;

  titleInput.value = currentNote.title;
  contentInput.value = currentNote.content;
  renderTodos();
}

function deleteNote(id) {
  const index = data[host].notes.findIndex((n) => n.id === id);
  data[host].notes.splice(index, 1);

  if (data[host].notes.length === 0) {
    createNote();
  } else {
    save();
    renderNotes();
    loadNote(data[host].notes[0].id);
  }
}

function renderTodos() {
  todoList.innerHTML = "";

  currentNote.todos.forEach((t) => {
    const li = document.createElement("li");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = t.done;

    cb.onchange = () => {
      t.done = cb.checked;
      renderTodos();
      save();
    };

    const span = document.createElement("span");
    span.textContent = t.text;
    if (t.done) {
      span.style.textDecoration = "line-through";
      span.style.color = "var(--text-muted)";
    }

    li.appendChild(cb);
    li.appendChild(span);
    todoList.appendChild(li);
  });
}

titleInput.oninput = () => {
  currentNote.title = titleInput.value;
  save();
  renderNotes();
};

contentInput.oninput = () => {
  currentNote.content = contentInput.value;
  save();
};

todoInput.onkeydown = (e) => {
  if (e.key === "Enter") {
    const text = todoInput.value.trim();
    if (!text) return;

    currentNote.todos.push({
      text,
      done: false,
    });

    todoInput.value = "";
    save();
    renderTodos();
  }
};

copyBtn.onclick = () => {
  navigator.clipboard.writeText(currentNote.content);
};

emailBtn.onclick = () => {
  const body = encodeURIComponent(currentNote.content);
  window.open(`mailto:?subject=${currentNote.title}&body=${body}`);
};

init();
