// script.js
// Dynamic Quote Generator with localStorage, sessionStorage, JSON import/export
// Includes: createAddQuoteForm, populateCategories, categoryFilter, filterQuote

const STORAGE_KEY = "quotes";
const LAST_QUOTE_KEY = "lastViewedQuoteIndex";
const CATEGORY_KEY = "selectedCategory";

const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Faith is taking the first step even when you don’t see the whole staircase.", category: "Faith" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" }
];

let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// ---------- Storage helpers ----------
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      quotes = JSON.parse(saved);
      if (!Array.isArray(quotes)) throw new Error();
    } catch {
      quotes = [...defaultQuotes];
    }
  } else {
    quotes = [...defaultQuotes];
  }
}

function saveLastViewedIndex(index) {
  sessionStorage.setItem(LAST_QUOTE_KEY, String(index));
}

function getLastViewedIndex() {
  const val = sessionStorage.getItem(LAST_QUOTE_KEY);
  return val ? parseInt(val, 10) : null;
}

// ---------- Quote display ----------
function showRandomQuote(filterCategory = null) {
  let pool = quotes;
  if (filterCategory && filterCategory !== "All") {
    pool = quotes.filter(q => q.category === filterCategory);
  }

  if (pool.length === 0) {
    quoteDisplay.textContent = "No quotes available!";
    return;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const quote = pool[randomIndex];
  const globalIndex = quotes.findIndex(
    q => q.text === quote.text && q.category === quote.category
  );

  quoteDisplay.innerHTML = `
    <p>"${escapeHtml(quote.text)}"</p>
    <small><em>Category: ${escapeHtml(quote.category)}</em></small>
  `;

  if (globalIndex >= 0) saveLastViewedIndex(globalIndex);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------- Dynamic form creation ----------
function createAddQuoteForm() {
  if (document.getElementById("add-quote-container")) return;

  const container = document.createElement("div");
  container.id = "add-quote-container";
  container.style.marginTop = "20px";

  const title = document.createElement("h3");
  title.textContent = "Add a New Quote";
  container.appendChild(title);

  const inputText = document.createElement("input");
  inputText.id = "newQuoteText";
  inputText.type = "text";
  inputText.placeholder = "Enter a new quote";
  inputText.style.width = "60%";
  inputText.style.marginRight = "8px";
  container.appendChild(inputText);

  const inputCategory = document.createElement("input");
  inputCategory.id = "newQuoteCategory";
  inputCategory.type = "text";
  inputCategory.placeholder = "Enter quote category";
  inputCategory.style.marginRight = "8px";
  container.appendChild(inputCategory);

  const addButton = document.createElement("button");
  addButton.id = "addQuoteBtn";
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", () => {
    addQuote();
    populateCategories();
  });
  container.appendChild(addButton);

  const feedback = document.createElement("div");
  feedback.id = "addFeedback";
  feedback.style.marginTop = "10px";
  container.appendChild(feedback);

  const filterTitle = document.createElement("h4");
  filterTitle.textContent = "Filter by Category";
  filterTitle.style.marginTop = "18px";
  container.appendChild(filterTitle);

  const select = document.createElement("select");
  select.id = "categoryFilterSelect";
  select.style.padding = "8px";
  select.style.marginRight = "8px";
  select.addEventListener("change", filterQuote);
  container.appendChild(select);

  const filterBtn = document.createElement("button");
  filterBtn.textContent = "Show Random from Category";
  filterBtn.addEventListener("click", () => {
    const val = select.value;
    showRandomQuote(val);
  });
  container.appendChild(filterBtn);

  const ioTitle = document.createElement("h4");
  ioTitle.textContent = "Import / Export Quotes (JSON)";
  ioTitle.style.marginTop = "18px";
  container.appendChild(ioTitle);

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.style.marginRight = "8px";
  exportBtn.addEventListener("click", exportToJson);
  container.appendChild(exportBtn);

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.id = "importFile";
  importInput.accept = ".json,application/json";
  importInput.addEventListener("change", importFromJsonFile);
  container.appendChild(importInput);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Stored Quotes";
  clearBtn.style.marginLeft = "12px";
  clearBtn.addEventListener("click", () => {
    if (confirm("This will remove all saved quotes from localStorage. Continue?")) {
      localStorage.removeItem(STORAGE_KEY);
      loadQuotes();
      populateCategories();
      showRandomQuote();
    }
  });
  container.appendChild(clearBtn);

  document.body.appendChild(container);

  populateCategories();
}

// ---------- Add new quote ----------
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");

  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category!");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  textEl.value = "";
  catEl.value = "";
  document.getElementById("addFeedback").textContent = "✅ Quote added!";
}

// ---------- JSON export/import ----------
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        quotes.push(...imported);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch {
      alert("Failed to read file.");
    }
  };
  reader.readAsText(file);
}

// ---------- Required test functions ----------
function populateCategories() {
  const categories = Array.from(new Set(quotes.map(q => q.category))).sort();
  let select = document.getElementById("categoryFilterSelect");

  if (!select) {
    select = document.createElement("select");
    select.id = "categoryFilterSelect";
    select.addEventListener("change", filterQuote);
    document.body.appendChild(select);
  }

  select.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "All";
  allOpt.textContent = "All";
  select.appendChild(allOpt);

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  const saved = localStorage.getItem(CATEGORY_KEY);
  if (saved && [...select.options].some(o => o.value === saved)) {
    select.value = saved;
  } else {
    select.value = "All";
  }
}

// Main filter logic
function filterQuote() {
  const select = document.getElementById("categoryFilterSelect");
  if (!select) return;
  const category = select.value;
  localStorage.setItem(CATEGORY_KEY, category);

  if (category === "All") showRandomQuote();
  else showRandomQuote(category);
}

// Backward-compatible alias
function categoryFilter() {
  filterQuote();
}

// ---------- Initialize ----------
function init() {
  loadQuotes();
  createAddQuoteForm();
  populateCategories();

  newQuoteBtn.addEventListener("click", () => {
    const sel = document.getElementById("categoryFilterSelect");
    const val = sel ? sel.value : null;
    showRandomQuote(val && val !== "All" ? val : null);
  });

  const lastIdx = getLastViewedIndex();
  if (lastIdx !== null && quotes[lastIdx]) {
    const q = quotes[lastIdx];
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(q.text)}"</p>
      <small><em>Category: ${escapeHtml(q.category)}</em></small>
    `;
  } else {
    quoteDisplay.textContent = 'Click "Show New Quote" to begin';
  }

  // Restore saved category filter
  const savedCategory = localStorage.getItem(CATEGORY_KEY);
  if (savedCategory) {
    const select = document.getElementById("categoryFilterSelect");
    if (select && [...select.options].some(o => o.value === savedCategory)) {
      select.value = savedCategory;
    }
  }
}
// ==========================
// 🔄 SERVER SYNC SIMULATION
// ==========================

// Mock API endpoints (you can change these if needed)
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Function to simulate fetching new data from the server
async function fetchServerQuotes() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();

    // Simulate quotes from server (convert post titles to quote objects)
    const serverQuotes = data.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    handleServerSync(serverQuotes);
  } catch (err) {
    console.error("❌ Failed to fetch from server:", err);
  }
}

// Merge local + server data
function handleServerSync(serverQuotes) {
  let localQuotes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const merged = resolveConflicts(localQuotes, serverQuotes);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  quotes = merged;
  populateCategories();
  showNotification("🔄 Synced with server successfully.");
}

// Simple conflict resolution (server overwrites duplicates)
function resolveConflicts(localQuotes, serverQuotes) {
  const localTexts = new Set(localQuotes.map(q => q.text.toLowerCase()));
  const newServerQuotes = serverQuotes.filter(
    q => !localTexts.has(q.text.toLowerCase())
  );

  const merged = [...localQuotes, ...newServerQuotes];

  // In case of conflict (same text, different category), server wins
  const uniqueByText = {};
  merged.forEach(q => {
    uniqueByText[q.text.toLowerCase()] = q;
  });

  return Object.values(uniqueByText);
}

// Periodically sync every 30 seconds
function startAutoSync() {
  fetchServerQuotes(); // Initial sync on load
  setInterval(fetchServerQuotes, 30000);
}

// UI notification for sync updates
function showNotification(message) {
  let note = document.getElementById("syncNotification");
  if (!note) {
    note = document.createElement("div");
    note.id = "syncNotification";
    note.style.position = "fixed";
    note.style.bottom = "20px";
    note.style.right = "20px";
    note.style.background = "#333";
    note.style.color = "#fff";
    note.style.padding = "10px 15px";
    note.style.borderRadius = "8px";
    note.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    document.body.appendChild(note);
  }

  note.textContent = message;
  note.style.opacity = "1";

  setTimeout(() => {
    note.style.transition = "opacity 1s ease";
    note.style.opacity = "0";
  }, 3000);
}

// Add manual sync button to UI
function addSyncButton() {
  const container = document.getElementById("add-quote-container");
  if (!container) return;

  const syncBtn = document.createElement("button");
  syncBtn.textContent = "🔁 Manual Sync with Server";
  syncBtn.style.marginTop = "15px";
  syncBtn.addEventListener("click", fetchServerQuotes);

  container.appendChild(syncBtn);
}

// Modify init() to start auto sync after everything loads
const originalInit = init;
init = function () {
  originalInit();
  addSyncButton();
  startAutoSync();
};


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
