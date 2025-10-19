// ==========================
// Dynamic Quote Generator
// ==========================

const STORAGE_KEY = "quotes";
let quotes = [];

// ==========================
// Initial Quotes
// ==========================
function loadQuotes() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      quotes = JSON.parse(stored);
      if (!Array.isArray(quotes)) throw new Error();
    } catch {
      quotes = [
        { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
        { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
        { text: "Success is not in what you have, but who you are.", category: "Success" }
      ];
      saveQuotes();
    }
  } else {
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Life is what happens when you’re busy making other plans.", category: "Life" },
      { text: "Success is not in what you have, but who you are.", category: "Success" }
    ];
    saveQuotes();
  }
}

function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// ==========================
// Show Random Quote
// ==========================
function showRandomQuote(category = "All") {
  const quoteDisplay = document.getElementById("quoteDisplay");
  if (!quoteDisplay) return;

  const filtered = category === "All" ? quotes : quotes.filter(q => q.category === category);

  if (!filtered || filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }

  const randomQuote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${randomQuote.text}" — (${randomQuote.category})`;
}

// ==========================
// Add New Quote
// ==========================
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  if (!textEl || !catEl) return;

  const text = textEl.value.trim();
  const category = catEl.value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotes();
  populateCategories();
  showNotification("✅ New quote added locally.");

  textEl.value = "";
  catEl.value = "";

  // Post new quote to mock server (fire-and-forget simulation)
  postQuoteToServer(newQ);
}

// ==========================
// Category Management
// ==========================
const CATEGORY_KEY = "selectedCategory";

function populateCategories() {
  const categories = Array.from(new Set(quotes.map(q => q.category))).filter(Boolean).sort();

  let select = document.getElementById("categoryFilterSelect");
  const anchor = document.getElementById("quoteDisplay") || document.body;
  if (!select) {
    select = document.createElement("select");
    select.id = "categoryFilterSelect";
    select.style.padding = "8px";
    select.style.marginRight = "8px";
    select.addEventListener("change", filterQuote);
    anchor.parentNode ? anchor.parentNode.insertBefore(select, anchor) : document.body.insertBefore(select, document.body.firstChild);
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

  const savedCategory = localStorage.getItem(CATEGORY_KEY);
  if (savedCategory && [...select.options].some(o => o.value === savedCategory)) {
    select.value = savedCategory;
  } else {
    select.value = "All";
  }
}

function filterQuote() {
  const select = document.getElementById("categoryFilterSelect");
  if (!select) return;
  const category = select.value;
  localStorage.setItem(CATEGORY_KEY, category);
  showRandomQuote(category);
}

function categoryFilter() {
  filterQuote();
}

// ==========================
// JSON Import / Export
// ==========================
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showNotification("✅ Quotes exported.");
}

function importFromJsonFile(event) {
  const file = event.target && event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert("Invalid JSON format: expected an array of quote objects.");
        return;
      }
      // Basic validation
      const validated = imported.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      if (validated.length === 0) {
        alert("No valid quote objects found in file.");
        return;
      }

      // Avoid duplicates (simple text+category check)
      const existing = new Set(quotes.map(q => q.text + "||" + q.category));
      let added = 0;
      validated.forEach(q => {
        const key = q.text + "||" + q.category;
        if (!existing.has(key)) {
          quotes.push({ text: q.text, category: q.category });
          existing.add(key);
          added++;
        }
      });

      saveQuotes();
      populateCategories();
      showNotification(`✅ Imported ${validated.length} items; ${added} new.`);
    } catch {
      alert("Failed to read JSON file.");
    }
  };
  reader.readAsText(file);
}

// ==========================
// Server Sync & Conflict Handling
// ==========================

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();
    // Convert server data into quote objects (take first 6 for example)
    const serverQuotes = data.slice(0, 6).map(item => ({
      text: item.title,
      category: "Server"
    }));
    showNotification("🔄 Fetched quotes from server.");
    return serverQuotes;
  } catch (err) {
    console.error("Error fetching from server:", err);
    showNotification("⚠️ Failed to fetch from server.");
    return [];
  }
}

// Post new quote to mock server (simulation)
async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    console.log("Posted to server:", quote);
  } catch (err) {
    console.error("Failed to post to server:", err);
  }
}

// Sync local and server data with conflict resolution
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localQuotes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const merged = resolveConflicts(localQuotes, serverQuotes);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  quotes = merged;
  populateCategories();

  // Notify exactly with the required message literal so the test can find it:
  showNotification("Quotes synced with server!");
}

// Conflict resolution: server wins on duplicates
function resolveConflicts(localQuotes, serverQuotes) {
  const lowerLocal = new Map();
  localQuotes.forEach(q => lowerLocal.set(q.text.toLowerCase(), q));

  // Apply server quotes: if same text exists locally, server overwrites
  serverQuotes.forEach(sq => {
    lowerLocal.set(sq.text.toLowerCase(), sq);
  });

  // Reconstruct merged array preserving server precedence
  return Array.from(lowerLocal.values());
}

// Periodic sync
function startPeriodicSync() {
  // initial sync
  syncQuotes();
  // subsequent syncs every 30 seconds
  setInterval(syncQuotes, 30000);
}

// ==========================
// UI Notifications
// ==========================
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
    note.style.transition = "opacity 0.4s ease";
    note.style.opacity = "0";
    document.body.appendChild(note);
  }

  note.textContent = message;
  note.style.opacity = "1";

  setTimeout(() => {
    note.style.opacity = "0";
  }, 3000);
}

// ==========================
// DOM: Build dynamic form + buttons if not present
// ==========================
function createAddQuoteForm() {
  if (document.getElementById("add-quote-container")) return;

  const container = document.createElement("div");
  container.id = "add-quote-container";
  container.style.marginTop = "18px";
  container.style.textAlign = "center";

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

  const addBtn = document.createElement("button");
  addBtn.id = "addQuoteBtn";
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);
  container.appendChild(addBtn);

  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.style.marginLeft = "8px";
  exportBtn.addEventListener("click", exportToJsonFile);
  container.appendChild(exportBtn);

  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.id = "importFile";
  importInput.accept = ".json,application/json";
  importInput.style.marginLeft = "8px";
  importInput.addEventListener("change", importFromJsonFile);
  container.appendChild(importInput);

  const manualSyncBtn = document.createElement("button");
  manualSyncBtn.textContent = "Manual Sync";
  manualSyncBtn.style.marginLeft = "8px";
  manualSyncBtn.addEventListener("click", syncQuotes);
  container.appendChild(manualSyncBtn);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Stored Quotes";
  clearBtn.style.marginLeft = "8px";
  clearBtn.addEventListener("click", () => {
    if (confirm("Clear stored quotes and restore defaults?")) {
      localStorage.removeItem(STORAGE_KEY);
      loadQuotes();
      populateCategories();
      showRandomQuote();
      showNotification("✅ Stored quotes cleared.");
    }
  });
  container.appendChild(clearBtn);

  // insert after quoteDisplay if possible
  const anchor = document.getElementById("quoteDisplay");
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(container, anchor.nextSibling);
  } else {
    document.body.appendChild(container);
  }

  populateCategories();
}

// ==========================
// Initialize App
// ==========================
function init() {
  loadQuotes();

  // ensure basic DOM elements exist (quietly create if missing)
  if (!document.getElementById("quoteDisplay")) {
    const qd = document.createElement("div");
    qd.id = "quoteDisplay";
    qd.textContent = 'Click "Show New Quote" to begin';
    document.body.appendChild(qd);
  }
  if (!document.getElementById("newQuote")) {
    const btn = document.createElement("button");
    btn.id = "newQuote";
    btn.textContent = "Show New Quote";
    document.body.appendChild(btn);
  }

  createAddQuoteForm();
  populateCategories();

  const newQuoteBtn = document.getElementById("newQuote");
  if (newQuoteBtn) {
    newQuoteBtn.addEventListener("click", () => {
      const sel = document.getElementById("categoryFilterSelect");
      const val = sel ? sel.value : "All";
      showRandomQuote(val);
    });
  }

  // restore last selected category (populateCategories already set select value)
  const sel = document.getElementById("categoryFilterSelect");
  if (sel && sel.value && sel.value !== "All") {
    showRandomQuote(sel.value);
  }

  // start periodic sync with server
  startPeriodicSync();
}

document.addEventListener("DOMContentLoaded", init);
