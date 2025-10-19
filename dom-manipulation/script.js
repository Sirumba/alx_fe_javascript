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
    quotes = JSON.parse(stored);
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
  let filtered = category === "All" ? quotes : quotes.filter(q => q.category === category);

  if (filtered.length === 0) {
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
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote text and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  showNotification("✅ New quote added locally.");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  // Post new quote to mock server
  postQuoteToServer({ text, category });
}

// ==========================
// Category Management
// ==========================
const CATEGORY_KEY = "selectedCategory";

function populateCategories() {
  const categories = Array.from(new Set(quotes.map(q => q.category))).filter(Boolean).sort();

  let select = document.getElementById("categoryFilterSelect");
  if (!select) {
    select = document.createElement("select");
    select.id = "categoryFilterSelect";
    select.style.padding = "8px";
    select.addEventListener("change", filterQuote);
    document.body.insertBefore(select, document.getElementById("quoteDisplay"));
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
  a.click();

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    showNotification("✅ Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// ==========================
// 🔄 Server Sync & Conflict Handling
// ==========================

const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Fetch quotes from mock server
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_URL);
    const data = await res.json();

    // Convert server data into quote objects
    const serverQuotes = data.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    showNotification("🔄 Fetched quotes from server.");
    return serverQuotes;
  } catch (err) {
    console.error("❌ Error fetching from server:", err);
    showNotification("⚠️ Failed to fetch quotes from server.");
    return [];
  }
}

// Post new quotes to server (simulated)
async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    console.log("✅ Posted to server:", quote);
  } catch (err) {
    console.error("❌ Failed to post to server:", err);
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
  showNotification("✅ Quotes synced with server.");
}

// Conflict resolution (server overwrites duplicates)
function resolveConflicts(localQuotes, serverQuotes) {
  const localTexts = new Set(localQuotes.map(q => q.text.toLowerCase()));
  const newServerQuotes = serverQuotes.filter(
    q => !localTexts.has(q.text.toLowerCase())
  );

  const merged = [...localQuotes, ...newServerQuotes];

  // Server wins if duplicate text with different category
  const uniqueByText = {};
  merged.forEach(q => {
    uniqueByText[q.text.toLowerCase()] = q;
  });

  return Object.values(uniqueByText);
}

// Automatically sync every 30 seconds
function startPeriodicSync() {
  syncQuotes(); // initial
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
    note.style.transition = "opacity 1s ease";
    document.body.appendChild(note);
  }

  note.textContent = message;
  note.style.opacity = "1";

  setTimeout(() => {
    note.style.opacity = "0";
  }, 3000);
}

// ==========================
// Initialize App
// ==========================
function init() {
  loadQuotes();
  populateCategories();

  document.getElementById("newQuote").addEventListener("click", filterQuote);
  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);

  startPeriodicSync();
}

document.addEventListener("DOMContentLoaded", init);
