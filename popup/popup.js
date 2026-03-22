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

let actualHost;
let currentFilter;
let data;
let currentNote;
let saveTimer;

newNoteBtn.onclick = createNote;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveAll(data), 300);
}

// Global click listener to close the custom dropdown if clicked outside
window.onclick = (e) => {
  if (!e.target.closest(".custom-select-wrapper")) {
    const dropdown = document.getElementById("custom-select-dropdown");
    const trigger = document.getElementById("custom-select-trigger");
    if (dropdown) {
      dropdown.classList.remove("open");
      trigger.classList.remove("open");
    }
  }
};

async function init() {
  data = await getAll();
  actualHost = await getHost();
  currentFilter = actualHost;

  if (!data[actualHost]) data[actualHost] = { notes: [] };

  chrome.tabs.onActivated.addListener(async () => handleTabChange());
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.active) handleTabChange();
  });

  renderWorkspace();
}

async function handleTabChange() {
  const newHost = await getHost();
  if (newHost !== actualHost) {
    actualHost = newHost;
    if (!data[actualHost]) data[actualHost] = { notes: [] };

    // Automatically switch back to the active tab's notes unless in "ALL" view
    if (currentFilter !== "ALL") currentFilter = actualHost;

    renderWorkspace();
  }
}

function renderWorkspace() {
  const allSavedHosts = Object.keys(data).filter(
    (k) => data[k].notes && data[k].notes.length > 0,
  );
  if (!allSavedHosts.includes(actualHost)) allSavedHosts.push(actualHost);

  let displayName = currentFilter === "ALL" ? "🌎 All Websites" : currentFilter;

  // Build the custom dropdown HTML
  hostLabel.innerHTML = `
    <div class="custom-select-wrapper" id="custom-select-wrapper">
      <span style="opacity: 0.7; font-size: 12px; font-weight: 600;">WORKSPACE:</span>
      
      <div class="custom-select-trigger" id="custom-select-trigger">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${displayName}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>

      <ul class="custom-select-dropdown" id="custom-select-dropdown">
        <li class="custom-select-option ${currentFilter === "ALL" ? "selected" : ""}" data-value="ALL">
          <span>🌎 All Websites</span>
        </li>
        <div style="height: 1px; background: var(--border); margin: 4px 0;"></div>
        
        ${allSavedHosts
          .map(
            (k) => `
          <li class="custom-select-option ${currentFilter === k ? "selected" : ""}" data-value="${k}">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${k}</span>
            ${k !== actualHost ? `<button class="delete-workspace-btn" data-host="${k}" title="Delete Workspace">✕</button>` : ""}
          </li>
        `,
          )
          .join("")}
      </ul>
    </div>
  `;

  // UI logic for Custom Dropdown
  const trigger = document.getElementById("custom-select-trigger");
  const dropdown = document.getElementById("custom-select-dropdown");

  trigger.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
    trigger.classList.toggle("open");
  };

  document.querySelectorAll(".custom-select-option").forEach((opt) => {
    opt.onclick = (e) => {
      // Ignore click if they hit the delete button
      if (e.target.closest(".delete-workspace-btn")) return;

      currentFilter = opt.dataset.value;
      dropdown.classList.remove("open");
      trigger.classList.remove("open");

      renderWorkspace();
      loadDefaultNoteForFilter();
    };
  });

  // Wiring up the Delete Workspace Buttons
  document.querySelectorAll(".delete-workspace-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const hostToDelete = btn.dataset.host;
      if (
        confirm(
          `Are you sure you want to delete ALL notes for ${hostToDelete}?`,
        )
      ) {
        deleteWorkspace(hostToDelete);
      }
    };
  });

  // Initial load logic
  if (
    currentFilter !== "ALL" &&
    (!data[currentFilter] || data[currentFilter].notes.length === 0)
  ) {
    if (currentFilter === actualHost) {
      createNote();
    }
  } else {
    loadDefaultNoteForFilter();
  }
}

function deleteWorkspace(hostToDelete) {
  delete data[hostToDelete];
  save();

  // If the user deleted the workspace they were currently looking at, bounce them back to the active tab
  if (currentFilter === hostToDelete) {
    currentFilter = actualHost;
  }

  renderWorkspace();
  loadDefaultNoteForFilter();
}

function loadDefaultNoteForFilter() {
  let noteToLoad = null;

  if (currentFilter === "ALL") {
    for (let h of Object.keys(data)) {
      if (data[h].notes && data[h].notes.length > 0) {
        noteToLoad = data[h].notes[0];
        break;
      }
    }
  } else if (data[currentFilter] && data[currentFilter].notes.length > 0) {
    const savedNoteId = data[currentFilter].lastOpenNoteId;
    noteToLoad =
      data[currentFilter].notes.find((n) => n.id === savedNoteId) ||
      data[currentFilter].notes[0];
  }

  if (noteToLoad) {
    loadNote(noteToLoad.id, noteToLoad.host);
  } else {
    // If no notes exist at all, clear the editor
    titleInput.value = "";
    contentInput.value = "";
    todoList.innerHTML = "";
    currentNote = null;
    renderNotes();
  }
}

function createNote() {
  const targetHost = currentFilter === "ALL" ? actualHost : currentFilter;
  if (!data[targetHost]) data[targetHost] = { notes: [] };

  const note = {
    id: Date.now(),
    title: "New Note",
    host: targetHost,
    content: "",
    todos: [],
  };

  data[targetHost].notes.unshift(note);
  data[targetHost].lastOpenNoteId = note.id;
  save();

  currentFilter = targetHost;
  renderWorkspace();
  loadNote(note.id, targetHost);
}

function renderNotes() {
  notesList.innerHTML = "";
  let notesToRender = [];

  if (currentFilter === "ALL") {
    Object.keys(data).forEach((h) => {
      if (data[h].notes) notesToRender.push(...data[h].notes);
    });
    notesToRender.sort((a, b) => b.id - a.id);
  } else {
    notesToRender = data[currentFilter]?.notes || [];
  }

  notesToRender.forEach((n) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const subtitleHTML =
      currentFilter === "ALL"
        ? `<span style="font-size: 10px; color: var(--text-muted);">${n.host}</span>`
        : "";

    li.innerHTML = `
      <div style="display: flex; flex-direction: column; overflow: hidden; max-width: 85%;">
        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${n.title || "Untitled"}</span>
        ${subtitleHTML}
      </div>
      <button data-id="${n.id}" style="all: unset; color: var(--text-muted); padding: 2px; flex-shrink: 0;">✕</button>
    `;

    if (currentNote && currentNote.id === n.id) {
      li.style.background = "var(--bg-hover)";
      li.style.borderColor = "var(--primary)";
    }

    li.onclick = () => loadNote(n.id, n.host);
    li.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      deleteNote(n.id, n.host);
    };

    notesList.appendChild(li);
  });
}

function loadNote(id, noteHost) {
  currentNote = data[noteHost].notes.find((n) => n.id === id);
  if (!currentNote) return;

  data[noteHost].lastOpenNoteId = id;
  save();

  titleInput.value = currentNote.title;
  contentInput.value = currentNote.content;
  renderTodos();
  renderNotes();
}

function deleteNote(id, noteHost) {
  const index = data[noteHost].notes.findIndex((n) => n.id === id);
  data[noteHost].notes.splice(index, 1);
  save();

  // If we delete the last note in a workspace, delete the workspace entirely
  if (data[noteHost].notes.length === 0) {
    deleteWorkspace(noteHost);
  } else {
    loadDefaultNoteForFilter();
  }
}

function renderTodos() {
  if (!currentNote) return;
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
  if (currentNote) {
    currentNote.title = titleInput.value;
    save();
    renderNotes();
  }
};
contentInput.oninput = () => {
  if (currentNote) {
    currentNote.content = contentInput.value;
    save();
  }
};

todoInput.onkeydown = (e) => {
  if (e.key === "Enter" && currentNote) {
    const text = todoInput.value.trim();
    if (!text) return;
    currentNote.todos.push({ text, done: false });
    todoInput.value = "";
    save();
    renderTodos();
  }
};

copyBtn.onclick = () => {
  if (currentNote) navigator.clipboard.writeText(currentNote.content);
};
emailBtn.onclick = () => {
  if (currentNote) {
    const body = encodeURIComponent(currentNote.content);
    window.open(`mailto:?subject=${currentNote.title}&body=${body}`);
  }
};

init();
