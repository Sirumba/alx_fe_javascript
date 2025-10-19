// script.js
// Dynamic Quote Generator with localStorage, sessionStorage, import/export JSON
// Key names
const STORAGE_KEY = "quotes";
const LAST_QUOTE_KEY = "lastViewedQuoteIndex";

// Default quotes (used only if nothing in localStorage)
const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Faith is taking the first step even when you don’t see the whole staircase.", category: "Faith" },
  { text: "In the middle of every difficulty lies opportunity.", category: "Inspiration" }
];

let quotes = [];

// DOM roots (assumes index.html has #quoteDisplay and #newQuote button)
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");

// ---------- Storage helpers ----------
function saveQuotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      quotes = [...defaultQuotes];
      saveQuotes();
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // basic validation: ensure objects have text & category
      quotes = parsed.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      if (quotes.length === 0) quotes = [...defaultQuotes];
    } else {
      quotes = [...defaultQuotes];
    }
  } catch (err) {
    console.error("Failed to load quotes from localStorage; using defaults.", err);
    quotes = [...defaultQuotes];
  }
}

// Save last viewed quote index to sessionStorage (session-specific)
function saveLastViewedIndex(idx) {
  try {
    sessionStorage.setItem(LAST_QUOTE_KEY, String(idx));
  } catch (err) {
    console.error("Failed to save session data:", err);
  }
}

function getLastViewedIndex() {
  const raw = sessionStorage.getItem(LAST_QUOTE_KEY);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : null;
}

// ---------- UI behavior ----------
function showRandomQuote() {
  if (!quotes || quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available!";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  quoteDisplay.innerHTML = `
    <p>"${escapeHtml(quote.text)}"</p>
    <small><em>Category: ${escapeHtml(quote.category)}</em></small>
  `;
  saveLastViewedIndex(randomIndex);
}

// Basic HTML escaping
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------- Dynamic form creation (required) ----------
function createAddQuoteForm() {
  // container
  const container = document.createElement("div");
  container.id = "add-quote-container";
  container.style.marginTop = "20px";

  // Title
  const title = document.createElement("h3");
  title.textContent = "Add a New Quote";
  container.appendChild(title);

  // quote text input
  const inputText = document.createElement("input");
  inputText.id = "newQuoteText";
  inputText.type = "text";
  inputText.placeholder = "Enter a new quote";
  inputText.style.width = "60%";
  inputText.style.marginRight = "8px";
  container.appendChild(inputText);

  // category input
  const inputCategory = document.createElement("input");
  inputCategory.id = "newQuoteCategory";
  inputCategory.type = "text";
  inputCategory.placeholder = "Enter quote category";
  inputCategory.style.marginRight = "8px";
  container.appendChild(inputCategory);

  // add button
  const addButton = document.createElement("button");
  addButton.id = "addQuoteBtn";
  addButton.textContent = "Add Quote";
  addButton.addEventListener("click", addQuote);
  container.appendChild(addButton);

  // small feedback area
  const feedback = document.createElement("div");
  feedback.id = "addFeedback";
  feedback.style.marginTop = "10px";
  container.appendChild(feedback);

  // ---- import/export controls ----
  const ioTitle = document.createElement("h4");
  ioTitle.textContent = "Import / Export Quotes (JSON)";
  ioTitle.style.marginTop = "18px";
  container.appendChild(ioTitle);

  // export button
  const exportBtn = document.createElement("button");
  exportBtn.textContent = "Export Quotes (JSON)";
  exportBtn.style.marginRight = "8px";
  exportBtn.addEventListener("click", exportToJson);
  container.appendChild(exportBtn);

  // import file input
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.id = "importFile";
  importInput.accept = ".json,application/json";
  importInput.style.display = "inline-block";
  importInput.style.marginLeft = "8px";
  importInput.addEventListener("change", importFromJsonFile);
  container.appendChild(importInput);

  // optional: clear storage button
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Stored Quotes";
  clearBtn.style.marginLeft = "12px";
  clearBtn.addEventListener("click", () => {
    if (!confirm("This will remove all saved quotes from localStorage. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    loadQuotes();
    showRandomQuote();
    document.getElementById("addFeedback").textContent = "Stored quotes cleared (defaults restored).";
  });
  container.appendChild(clearBtn);

  // Append to body (or better: after quoteDisplay)
  // insert after quoteDisplay if exists
  const anchor = document.getElementById("quoteDisplay");
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(container, anchor.nextSibling);
  } else {
    document.body.appendChild(container);
  }
}

// ---------- Adding quotes ----------
function addQuote() {
  const textEl = document.getElementById("newQuoteText");
  const catEl = document.getElementById("newQuoteCategory");
  const feedback = document.getElementById("addFeedback");

  const text = textEl ? textEl.value.trim() : "";
  const category = catEl ? catEl.value.trim() : "";

  if (!text || !category) {
    alert("Please enter both quote and category!");
    return;
  }

  const newQ = { text, category };
  quotes.push(newQ);
  saveQuotes();

  feedback.textContent = `✅ New quote added: "${text}" (${category})`;
  // clear inputs
  if (textEl) textEl.value = "";
  if (catEl) catEl.value = "";
}

// ---------- Export to JSON ----------
function exportToJson() {
  try {
    const json = JSON.stringify(quotes, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    a.download = `quotes-export-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export quotes. See console for details.");
  }
}

// ---------- Import from JSON file ----------
function importFromJsonFile(event) {
  const file = event.target && event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(loadEvent) {
    try {
      const parsed = JSON.parse(loadEvent.target.result);
      if (!Array.isArray(parsed)) {
        alert("Imported JSON must be an array of quote objects.");
        return;
      }
      // Validate objects
      const validated = parsed.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      if (validated.length === 0) {
        alert("No valid quote objects found in file. Each object must have 'text' and 'category' strings.");
        return;
      }

      // Merge while avoiding duplicates (simple check)
      const existingSet = new Set(quotes.map(q => q.text + "||" + q.category));
      let added = 0;
      validated.forEach(q => {
        const key = q.text + "||" + q.category;
        if (!existingSet.has(key)) {
          quotes.push({ text: q.text, category: q.category });
          existingSet.add(key);
          added++;
        }
      });

      saveQuotes();
      alert(`Imported ${validated.length} items; ${added} new quotes added (duplicates skipped).`);
      // reset file input so same file can be uploaded again if needed
      event.target.value = "";
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import JSON file. Ensure it is valid JSON and an array of quote objects.");
    }
  };

  reader.onerror = function() {
    alert("Failed to read file.");
  };

  reader.readAsText(file);
}

// ---------- Initialize app ----------
function init() {
  loadQuotes();
  createAddQuoteForm();
  newQuoteBtn.addEventListener("click", showRandomQuote);

  // If there was a last viewed quote in session, show it
  const lastIdx = getLastViewedIndex();
  if (lastIdx !== null && quotes[lastIdx]) {
    // show the same quote (but don't overwrite session key)
    quoteDisplay.innerHTML = `
      <p>"${escapeHtml(quotes[lastIdx].text)}"</p>
      <small><em>Category: ${escapeHtml(quotes[lastIdx].category)}</em></small>
    `;
  } else {
    quoteDisplay.textContent = 'Click "Show New Quote" to begin';
  }
}

// Run init when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
