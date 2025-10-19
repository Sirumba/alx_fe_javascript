// script.js
// Dynamic Quote Generator with localStorage, sessionStorage, import/export JSON
// Includes populateCategories() and categoryFilter()

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
function showRandomQuote(filterCategory = null) {
  if (!quotes || quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available!";
    return;
  }

  let pool = quotes;
  if (filterCategory && filterCategory !== "All") {
    pool = quotes.filter(q => q.category === filterCategory);
  }

  if (pool.length === 0) {
    quoteDisplay.textContent = `No quotes available for category "${filterCategory}"`;
    return;
  }

  const randomIndexInPool = Math.floor(Math.random() * pool.length);
  const quote = pool[randomIndexInPool];

  // Find index in original quotes array to store as last viewed
  const origIndex = quotes.findIndex(q => q.text === quote.text && q.category === quote.category);
  quoteDisplay.innerHTML = `
    <p>"${escapeHtml(quote.text)}"</p>
    <small><em>Category: ${escapeHtml(quote.category)}</em></small>
  `;
  if (origIndex >= 0) saveLastViewedIndex(origIndex);
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
  // If form already exists, don't create again
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
    populateCategories(); // keep categories up-to-date
  });
  container.appendChild(addButton);

  const feedback = document.createElement("div");
  feedback.id = "addFeedback";
  feedback.style.marginTop = "10px";
  container.appendChild(feedback);

  // Category filter controls
  const filterTitle = document.createElement("h4");
  filterTitle.textContent = "Filter by Category";
  filterTitle.style.marginTop = "18px";
  container.appendChild(filterTitle);

  const select = document.createElement("select");
  select.id = "categoryFilterSelect";
  select.style.padding = "8px";
  select.style.marginRight = "8px";
  select.addEventListener("change", () => {
    // call global categoryFilter when selection changes
    categoryFilter();
  });
  container.appendChild(select);

  const filterBtn = document.createElement("button");
  filterBtn.textContent = "Show Random from Category";
  filterBtn.addEventListener("click", () => {
    const sel = document.getElementById("categoryFilterSelect");
    const val = sel ? sel.value : null;
    showRandomQuote(val);
  });
  container.appendChild(filterBtn);

  // ---- import/export controls ----
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
  importInput.style.display = "inline-block";
  importInput.style.marginLeft = "8px";
  importInput.addEventListener("change", (e) => {
    importFromJsonFile(e);
    // after import, update categories
    // importFromJsonFile will call saveQuotes(); we'll call populateCategories after a brief timeout to ensure file read is complete
    setTimeout(populateCategories, 300);
  });
  container.appendChild(importInput);

  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Stored Quotes";
  clearBtn.style.marginLeft = "12px";
  clearBtn.addEventListener("click", () => {
    if (!confirm("This will remove all saved quotes from localStorage. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    loadQuotes();
    populateCategories();
    showRandomQuote();
    document.getElementById("addFeedback").textContent = "Stored quotes cleared (defaults restored).";
  });
  container.appendChild(clearBtn);

  // Append container after quoteDisplay
  const anchor = document.getElementById("quoteDisplay");
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(container, anchor.nextSibling);
  } else {
    document.body.appendChild(container);
  }

  // populate categories into the new select
  populateCategories();
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
  if (textEl) textEl.value = "";
  if (catEl) catEl.value = "";

  // update categories
  populateCategories();
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
      const validated = parsed.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      if (validated.length === 0) {
        alert("No valid quote objects found in file. Each object must have 'text' and 'category' strings.");
        return;
      }

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

      // reset file input so same file can be re-uploaded
      if (event.target) event.target.value = "";
      // update categories now that we changed quotes
      populateCategories();
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

// ---------- New required functions for test ----------

// Build a category dropdown based on current quotes.
// Will create or update <select id="categoryFilterSelect"> with "All" + sorted categories.
function populateCategories() {
  // gather unique categories
  const categories = Array.from(new Set(quotes.map(q => q.category))).filter(Boolean).sort();
  // ensure the select exists (create if not)
  let select = document.getElementById("categoryFilterSelect");
  if (!select) {
    // create a select in the DOM (append into add-quote-container if present)
    select = document.createElement("select");
    select.id = "categoryFilterSelect";
    select.style.padding = "8px";
    select.addEventListener("change", categoryFilter);
    const container = document.getElementById("add-quote-container");
    if (container) {
      // insert at top of container's filter area
      container.appendChild(select);
    } else {
      // fallback: append at end of body
      document.body.appendChild(select);
    }
  }

  // clear existing options
  select.innerHTML = "";

  // "All" option
  const allOpt = document.createElement("option");
  allOpt.value = "All";
  allOpt.textContent = "All";
  select.appendChild(allOpt);

  // add each category
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// When called, reads selected category and shows either a random quote from that category
// or lists how many quotes exist for that category (we'll show a random quote).
function categoryFilter() {
  const sel = document.getElementById("categoryFilterSelect");
  if (!sel) {
    // nothing to filter; just show random
    showRandomQuote();
    return;
  }
  const val = sel.value;
  if (!val || val === "All") {
    // Show random from all quotes
    showRandomQuote(null);
    return;
  }
  // Show random quote from selected category
  showRandomQuote(val);
}

// ---------- Initialize app ----------
function init() {
  loadQuotes();
  createAddQuoteForm();
  newQuoteBtn.addEventListener("click", () => {
    // if a category is selected, use it
    const sel = document.getElementById("categoryFilterSelect");
    const val = sel ? sel.value : null;
    showRandomQuote(val && val !== "All" ? val : null);
  });

  // populate categories from loaded quotes
  populateCategories();

  // If there was a last viewed quote in session, show it
  const lastIdx = getLastViewedIndex();
  if (lastIdx !== null && quotes[lastIdx]) {
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
