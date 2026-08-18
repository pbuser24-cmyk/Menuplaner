// ---------- Konstanten ----------
const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const LS_KEYS = {
  cooked: "menuplan_cooked_v1",
  custom: "menuplan_custom_v1",
  week: "menuplan_week_v1",
};

// ---------- State ----------
let baseRecipes = [];
let state = {
  season: "alle",      // alle | sommer | herbst
  type: "alle",         // alle | vegetarisch | vegan | fleisch
  balancedOnly: false,
  cooked: loadJSON(LS_KEYS.cooked, {}),      // { recipeId: true }
  custom: loadJSON(LS_KEYS.custom, []),      // [ {..recipe-shape, custom:true} ]
  week: loadJSON(LS_KEYS.week, {}),          // { Montag: recipeId, ... }
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error("Konnte", key, "nicht laden:", e);
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Konnte", key, "nicht speichern:", e);
  }
}

function allRecipes() {
  return [...baseRecipes, ...state.custom];
}

function recipeById(id) {
  return allRecipes().find(r => r.id === id);
}

// ---------- Laden ----------
async function init() {
  try {
    const res = await fetch("recipes.json");
    baseRecipes = await res.json();
  } catch (e) {
    console.error("recipes.json konnte nicht geladen werden:", e);
    baseRecipes = [];
  }
  buildWeekBoard();
  renderAll();
  wireFilterEvents();
  wireFormEvents();
  wireShopBarEvents();
}

// ---------- Wochenplan-Board ----------
function buildWeekBoard() {
  const board = document.getElementById("weekGrid");
  board.innerHTML = "";
  DAYS.forEach(day => {
    const slot = document.createElement("div");
    slot.className = "day-slot";
    slot.dataset.day = day;
    board.appendChild(slot);
  });
  renderWeekBoard();
}

function renderWeekBoard() {
  const board = document.getElementById("weekGrid");
  [...board.children].forEach(slot => {
    const day = slot.dataset.day;
    const recipeId = state.week[day];
    const recipe = recipeId ? recipeById(recipeId) : null;
    slot.classList.toggle("filled", !!recipe);
    slot.innerHTML = `<div class="day-label">${day}</div>`;

    if (recipe) {
      const title = document.createElement("div");
      title.className = "assigned-title";
      title.textContent = recipe.title;
      slot.appendChild(title);

      const meta = document.createElement("div");
      meta.className = "assigned-meta";
      meta.textContent = `${recipe.source} · ${typeLabel(recipe.type)}`;
      slot.appendChild(meta);

      const clearBtn = document.createElement("button");
      clearBtn.className = "clear";
      clearBtn.textContent = "entfernen";
      clearBtn.onclick = () => {
        delete state.week[day];
        saveJSON(LS_KEYS.week, state.week);
        renderWeekBoard();
        renderShoppingList();
      };
      slot.appendChild(clearBtn);
    } else {
      const select = document.createElement("select");
      select.innerHTML = `<option value="">Rezept wählen …</option>` +
        allRecipes().map(r => `<option value="${r.id}">${escapeHtml(r.title)}</option>`).join("");
      select.onchange = (e) => {
        if (e.target.value) {
          state.week[day] = e.target.value;
          saveJSON(LS_KEYS.week, state.week);
          renderWeekBoard();
          renderShoppingList();
        }
      };
      slot.appendChild(select);
    }
  });
  const filled = Object.keys(state.week).filter(d => state.week[d]).length;
  document.getElementById("weekCount").textContent = `${filled} / 7 Tage geplant`;
}

function assignToNextFreeDay(recipeId) {
  const freeDay = DAYS.find(d => !state.week[d]);
  if (!freeDay) {
    alert("Alle 7 Tage sind schon geplant. Entferne zuerst ein Menü, oder wähle den Tag direkt im Wochenplan oben.");
    return;
  }
  state.week[freeDay] = recipeId;
  saveJSON(LS_KEYS.week, state.week);
  renderWeekBoard();
  renderShoppingList();
}

// ---------- Filter ----------
function wireFilterEvents() {
  document.querySelectorAll("[data-season]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.season = btn.dataset.season;
      document.querySelectorAll("[data-season]").forEach(b => b.classList.toggle("active", b === btn));
      renderRecipeGrid();
    });
  });
  document.querySelectorAll("[data-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.type = btn.dataset.type;
      document.querySelectorAll("[data-type]").forEach(b => b.classList.toggle("active", b === btn));
      renderRecipeGrid();
    });
  });
  document.getElementById("balancedToggle").addEventListener("click", (e) => {
    state.balancedOnly = !state.balancedOnly;
    e.target.classList.toggle("active", state.balancedOnly);
    renderRecipeGrid();
  });
}

function typeLabel(type) {
  return { vegetarisch: "Vegetarisch", vegan: "Vegan", fleisch: "Mit Fleisch" }[type] || type;
}
function seasonLabel(season) {
  return { sommer: "Sommer", herbst: "Herbst", winter: "Winter", fruehling: "Frühling" }[season] || season;
}

function filteredRecipes() {
  return allRecipes().filter(r => {
    if (state.season !== "alle" && !(r.season || []).includes(state.season)) return false;
    if (state.type !== "alle" && r.type !== state.type) return false;
    if (state.balancedOnly && !r.balanced) return false;
    return true;
  });
}

// ---------- Rezept-Grid ----------
function renderRecipeGrid() {
  const grid = document.getElementById("recipeGrid");
  const list = filteredRecipes();
  document.getElementById("recipeTally").textContent = `${list.length} Rezept${list.length === 1 ? "" : "e"}`;
  grid.innerHTML = "";
  if (list.length === 0) {
    grid.innerHTML = `<p class="shoplist-empty">Keine Rezepte für diese Filterkombination. Andere Filter wählen oder unten ein eigenes Rezept hinzufügen.</p>`;
    return;
  }
  list.forEach(r => grid.appendChild(buildRecipeCard(r)));
}

function buildRecipeCard(r) {
  const card = document.createElement("div");
  card.className = "card";

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  if (r.image) thumb.style.backgroundImage = `url("${r.image}")`;
  const cookedBadge = state.cooked[r.id] ? `<span class="badge cooked">Gekocht</span>` : "";
  const seasonBadges = (r.season || []).map(s => `<span class="badge">${seasonLabel(s)}</span>`).join("");
  thumb.innerHTML = `<div class="badges">${cookedBadge}${seasonBadges}</div>`;
  card.appendChild(thumb);

  const body = document.createElement("div");
  body.className = "body";

  const h3 = document.createElement("h3");
  h3.textContent = r.title;
  body.appendChild(h3);

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <span>${escapeHtml(r.source)}</span>
    <span>· ${typeLabel(r.type)}</span>
    ${r.time ? `<span>· ${r.time} Min.</span>` : ""}
    ${r.balanced ? `<span>· ausgewogen</span>` : ""}
  `;
  body.appendChild(meta);

  if (r.note) {
    const note = document.createElement("div");
    note.className = "hint";
    note.textContent = r.note;
    body.appendChild(note);
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  if (r.url) {
    const link = document.createElement("a");
    link.className = "recipe-link";
    link.href = r.url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = `Zum Rezept (${r.source}) ↗`;
    actions.appendChild(link);
  }

  const planBtn = document.createElement("button");
  planBtn.className = "icon-btn";
  planBtn.textContent = "+ Woche";
  planBtn.title = "Nächsten freien Tag im Wochenplan belegen";
  planBtn.onclick = () => assignToNextFreeDay(r.id);
  actions.appendChild(planBtn);

  const cookedBtn = document.createElement("button");
  cookedBtn.className = "icon-btn" + (state.cooked[r.id] ? " on" : "");
  cookedBtn.textContent = state.cooked[r.id] ? "✓ Gekocht" : "Gekocht?";
  cookedBtn.onclick = () => {
    if (state.cooked[r.id]) {
      delete state.cooked[r.id];
    } else {
      state.cooked[r.id] = new Date().toISOString().slice(0, 10);
    }
    saveJSON(LS_KEYS.cooked, state.cooked);
    renderRecipeGrid();
  };
  actions.appendChild(cookedBtn);

  if (r.custom) {
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn danger";
    delBtn.textContent = "Löschen";
    delBtn.onclick = () => {
      if (!confirm(`"${r.title}" wirklich löschen?`)) return;
      state.custom = state.custom.filter(x => x.id !== r.id);
      saveJSON(LS_KEYS.custom, state.custom);
      Object.keys(state.week).forEach(day => {
        if (state.week[day] === r.id) delete state.week[day];
      });
      saveJSON(LS_KEYS.week, state.week);
      renderAll();
    };
    actions.appendChild(delBtn);
  }

  body.appendChild(actions);
  card.appendChild(body);
  return card;
}

// ---------- Eigenes Rezept hinzufügen ----------
function wireFormEvents() {
  document.getElementById("addRecipeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const title = f.title.value.trim();
    if (!title) return;
    const seasons = [...f.querySelectorAll('input[name="season"]:checked')].map(cb => cb.value);
    const ingredients = f.ingredients.value.split("\n").map(s => s.trim()).filter(Boolean);
    const newRecipe = {
      id: "custom-" + Date.now().toString(36),
      title,
      url: f.url.value.trim(),
      source: "Eigenes Rezept",
      image: "",
      season: seasons.length ? seasons : ["sommer", "herbst"],
      type: f.type.value,
      balanced: f.balanced.checked,
      time: f.time.value ? Number(f.time.value) : null,
      servings: null,
      ingredients,
      custom: true,
    };
    state.custom.push(newRecipe);
    saveJSON(LS_KEYS.custom, state.custom);
    f.reset();
    renderAll();
    document.getElementById("recipeGrid").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// ---------- Einkaufsliste ----------
function collectShoppingIngredients() {
  const items = [];
  DAYS.forEach(day => {
    const id = state.week[day];
    if (!id) return;
    const r = recipeById(id);
    if (!r) return;
    (r.ingredients || []).forEach(ing => items.push(ing));
  });
  return items;
}

function renderShoppingList() {
  const items = collectShoppingIngredients();
  const panel = document.getElementById("shopList");
  document.getElementById("shopCount").textContent = `${items.length} Zutaten aus dem Wochenplan`;
  if (items.length === 0) {
    panel.innerHTML = `<p class="shoplist-empty">Noch keine Menüs im Wochenplan eingeplant. Trag oben Rezepte in die Tage ein, dann erscheint hier die Einkaufsliste.</p>`;
    document.getElementById("copyListBtn").disabled = true;
    document.getElementById("shareListBtn").disabled = true;
    return;
  }
  document.getElementById("copyListBtn").disabled = false;
  document.getElementById("shareListBtn").disabled = !navigator.share;
  panel.innerHTML = `<ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function shoppingListAsText() {
  const items = collectShoppingIngredients();
  return "Einkaufsliste (Menuplan)\n" + items.map(i => "- " + i).join("\n");
}

function wireShopBarEvents() {
  document.getElementById("copyListBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shoppingListAsText());
      flashButton("copyListBtn", "Kopiert ✓");
    } catch (e) {
      const ta = document.getElementById("sharePreview");
      ta.style.display = "block";
      ta.value = shoppingListAsText();
      ta.select();
    }
  });

  document.getElementById("shareListBtn").addEventListener("click", async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: "Einkaufsliste", text: shoppingListAsText() });
    } catch (e) {
      // Nutzer hat abgebrochen — kein Fehler nötig
    }
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      cooked: state.cooked,
      custom: state.custom,
      week: state.week,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "menuplan-fortschritt.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.cooked) state.cooked = { ...state.cooked, ...data.cooked };
        if (data.custom) {
          const existingIds = new Set(state.custom.map(r => r.id));
          data.custom.forEach(r => { if (!existingIds.has(r.id)) state.custom.push(r); });
        }
        if (data.week) state.week = { ...state.week, ...data.week };
        saveJSON(LS_KEYS.cooked, state.cooked);
        saveJSON(LS_KEYS.custom, state.custom);
        saveJSON(LS_KEYS.week, state.week);
        renderAll();
        alert("Fortschritt importiert.");
      } catch (err) {
        alert("Diese Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
}

function flashButton(id, text) {
  const btn = document.getElementById(id);
  const original = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = original; }, 1500);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Gesamt-Render ----------
function renderAll() {
  renderRecipeGrid();
  renderWeekBoard();
  renderShoppingList();
}

init();
