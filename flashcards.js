/* Adventure Trip 2026 - Slovenian flashcard deck */
/* The phrase tables in slovenian.html are the source of truth; this script
   reads them into a deck so the page still works as a plain reference
   without JavaScript, and site search can index every phrase. */

(function () {
  "use strict";

  var deck = document.getElementById("deck");
  if (!deck) return;

  var STORE_KEY = "slovenian-flashcards-v1";

  // ---------- data ----------

  function readCards() {
    var cards = [];
    document.querySelectorAll(".phrase-group").forEach(function (group) {
      var category = group.getAttribute("data-category") || "";
      group.querySelectorAll("tbody tr").forEach(function (tr) {
        var cells = tr.querySelectorAll("td");
        if (cells.length < 3) return;
        var sl = cells[0].textContent.trim();
        cards.push({
          id: category + "|" + sl,
          category: category,
          sl: sl,
          say: cells[1].textContent.trim(),
          en: cells[2].textContent.trim(),
          note: cells[3] ? cells[3].textContent.trim() : ""
        });
      });
    });
    return cards;
  }

  var all = readCards();
  if (!all.length) return;

  var categories = [];
  all.forEach(function (c) { if (categories.indexOf(c.category) < 0) categories.push(c.category); });

  // ---------- persisted state ----------

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* private mode or storage disabled */ }
    return {};
  }

  function saveState() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { /* ignore */ }
  }

  var state = loadState();
  state.known = state.known || {};
  state.category = state.category || "All";
  state.englishFirst = !!state.englishFirst;
  state.learningOnly = !!state.learningOnly;

  // ---------- deck view ----------

  var order = [];     // indices into `all` for the current filter
  var pos = 0;
  var flipped = false;

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function rebuild(shuffle) {
    order = [];
    all.forEach(function (c, i) {
      if (state.category !== "All" && c.category !== state.category) return;
      if (state.learningOnly && state.known[c.id]) return;
      order.push(i);
    });
    if (shuffle) shuffleArray(order);
    pos = 0;
    flipped = false;
    render();
  }

  var els = {
    card: document.getElementById("flashcard"),
    frontCat: document.getElementById("card-front-category"),
    frontMain: document.getElementById("card-front-main"),
    frontSub: document.getElementById("card-front-sub"),
    backCat: document.getElementById("card-back-category"),
    backMain: document.getElementById("card-back-main"),
    backSub: document.getElementById("card-back-sub"),
    backNote: document.getElementById("card-back-note"),
    empty: document.getElementById("deck-empty"),
    fill: document.getElementById("deck-progress-fill"),
    progress: document.getElementById("deck-progress-text"),
    chips: document.getElementById("deck-categories"),
    direction: document.getElementById("deck-direction"),
    learningOnly: document.getElementById("deck-learning-only"),
    shuffle: document.getElementById("deck-shuffle"),
    prev: document.getElementById("deck-prev"),
    next: document.getElementById("deck-next"),
    again: document.getElementById("deck-again"),
    got: document.getElementById("deck-got"),
    speak: document.getElementById("deck-speak"),
    reset: document.getElementById("deck-reset")
  };

  function current() { return order.length ? all[order[pos]] : null; }

  function render() {
    var c = current();
    var hasCards = !!c;
    els.card.hidden = !hasCards;
    els.empty.hidden = hasCards;
    [els.prev, els.next, els.again, els.got, els.speak].forEach(function (b) { b.disabled = !hasCards; });

    // progress for the visible category (ignoring the learning-only filter)
    var inScope = all.filter(function (x) { return state.category === "All" || x.category === state.category; });
    var known = inScope.filter(function (x) { return state.known[x.id]; }).length;
    els.fill.style.width = inScope.length ? (100 * known / inScope.length) + "%" : "0%";
    els.progress.textContent = known + " of " + inScope.length + " known" +
      (hasCards ? " · card " + (pos + 1) + " of " + order.length : "");

    if (!hasCards) return;

    var slSide = { cat: c.category, main: c.sl, sub: c.say };
    var enSide = { cat: c.category, main: c.en, sub: "" };
    var front = state.englishFirst ? enSide : slSide;
    var back = state.englishFirst ? slSide : enSide;

    els.frontCat.textContent = front.cat;
    els.frontMain.textContent = front.main;
    els.frontSub.textContent = front.sub;
    els.backCat.textContent = back.cat;
    els.backMain.textContent = back.main;
    els.backSub.textContent = back.sub;
    els.backNote.textContent = c.note;

    els.card.classList.toggle("is-flipped", flipped);
    els.card.classList.toggle("is-known", !!state.known[c.id]);
    els.card.classList.remove("swap");
    els.got.textContent = state.known[c.id] ? "Got it ✓" : "Got it";
  }

  function move(delta) {
    if (!order.length) return;
    pos = (pos + delta + order.length) % order.length;
    flipped = false;
    render();
    els.card.classList.add("swap");
  }

  function flip() {
    if (!order.length) return;
    flipped = !flipped;
    els.card.classList.toggle("is-flipped", flipped);
  }

  function mark(isKnown) {
    var c = current();
    if (!c) return;
    if (isKnown) state.known[c.id] = true; else delete state.known[c.id];
    saveState();
    if (state.learningOnly && isKnown) {
      order.splice(pos, 1);
      if (pos >= order.length) pos = 0;
      flipped = false;
      render();
    } else {
      move(1);
    }
  }

  // ---------- category chips ----------

  function renderChips() {
    els.chips.innerHTML = "";
    ["All"].concat(categories).forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "deck-chip" + (state.category === name ? " is-active" : "");
      b.textContent = name;
      b.setAttribute("aria-pressed", state.category === name ? "true" : "false");
      b.addEventListener("click", function () {
        state.category = name;
        saveState();
        renderChips();
        rebuild(false);
      });
      els.chips.appendChild(b);
    });
  }

  // ---------- speech (only when a Slovenian voice exists) ----------

  var voice = null;

  function findVoice() {
    if (!("speechSynthesis" in window)) return;
    var voices = window.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
      if (/^sl(-|_|$)/i.test(voices[i].lang)) { voice = voices[i]; break; }
    }
    els.speak.hidden = !voice;
  }

  function speak() {
    var c = current();
    if (!c || !voice) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(c.sl);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  if ("speechSynthesis" in window) {
    findVoice();
    window.speechSynthesis.addEventListener("voiceschanged", findVoice);
  }

  // ---------- wiring ----------

  els.card.addEventListener("click", flip);
  els.prev.addEventListener("click", function () { move(-1); });
  els.next.addEventListener("click", function () { move(1); });
  els.again.addEventListener("click", function () { mark(false); });
  els.got.addEventListener("click", function () { mark(true); });
  els.shuffle.addEventListener("click", function () { rebuild(true); });
  els.speak.addEventListener("click", function (e) { e.stopPropagation(); speak(); });

  els.direction.checked = state.englishFirst;
  els.direction.addEventListener("change", function () {
    state.englishFirst = els.direction.checked;
    saveState();
    flipped = false;
    render();
  });

  els.learningOnly.checked = state.learningOnly;
  els.learningOnly.addEventListener("change", function () {
    state.learningOnly = els.learningOnly.checked;
    saveState();
    rebuild(false);
  });

  els.reset.addEventListener("click", function () {
    if (!window.confirm("Forget which cards you've marked as known?")) return;
    state.known = {};
    saveState();
    rebuild(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (document.querySelector(".search-overlay")) return;
    switch (e.key) {
      case "ArrowLeft": move(-1); break;
      case "ArrowRight": move(1); break;
      case " ": case "Enter":
        if (e.target === els.card || tag !== "BUTTON") { e.preventDefault(); flip(); }
        break;
      case "1": mark(false); break;
      case "2": mark(true); break;
      default: return;
    }
  });

  // swipe left / right on touch
  var touchX = null;
  els.card.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  els.card.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 60) { e.preventDefault(); move(dx < 0 ? 1 : -1); }
  });

  renderChips();
  rebuild(false);
})();
