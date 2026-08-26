/* Adventure Trip 2026 - shared chart helpers */

(function () {
  "use strict";

  // ---------- tooltip ----------

  var tooltip = null;

  function ensureTooltip() {
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "viz-tooltip";
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function showTooltip(html, x, y) {
    var t = ensureTooltip();
    t.innerHTML = html;
    t.classList.add("show");
    var pad = 12;
    var rect = t.getBoundingClientRect();
    var left = x + pad;
    var top = y - rect.height - pad;
    if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
    if (top < 8) top = y + pad;
    t.style.left = left + "px";
    t.style.top = top + "px";
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove("show");
  }

  function attachHover(el, html) {
    el.addEventListener("mousemove", function (e) { showTooltip(html, e.clientX, e.clientY); });
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("touchstart", function (e) {
      var t0 = e.touches[0];
      showTooltip(html, t0.clientX, t0.clientY);
    }, { passive: true });
    el.addEventListener("touchend", function () { setTimeout(hideTooltip, 1500); }, { passive: true });
  }

  var SVG_NS = "http://www.w3.org/2000/svg";

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // ---------- temperature range chart ----------
  // rows: [{label, low, high, color, note}], band: {from, to, label}

  window.renderRangeChart = function (containerId, rows, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    opts = opts || {};
    var min = opts.min, max = opts.max, band = opts.band;
    var labelWidth = 130;
    var rowHeight = 40;
    var topPad = 26;
    var width = 640;
    var plotWidth = width - labelWidth - 20;
    var height = topPad + rows.length * rowHeight + 26;

    var svg = svgEl("svg", { viewBox: "0 0 " + width + " " + height, role: "img",
      "aria-label": opts.ariaLabel || "Range chart" });

    function x(v) { return labelWidth + ((v - min) / (max - min)) * plotWidth; }

    // comfort band
    if (band) {
      svg.appendChild(svgEl("rect", {
        x: x(band.from), y: topPad - 8,
        width: x(band.to) - x(band.from), height: rows.length * rowHeight + 8,
        fill: "var(--accent-soft)", opacity: "0.45", rx: 4
      }));
      var bandLabel = svgEl("text", {
        x: (x(band.from) + x(band.to)) / 2, y: 14, "text-anchor": "middle",
        "font-size": "11", fill: "var(--ink-muted)"
      });
      bandLabel.textContent = band.label;
      svg.appendChild(bandLabel);
    }

    // gridlines and axis labels
    for (var v = Math.ceil(min / 5) * 5; v <= max; v += 5) {
      svg.appendChild(svgEl("line", {
        x1: x(v), y1: topPad - 8, x2: x(v), y2: topPad + rows.length * rowHeight,
        stroke: "var(--hairline)", "stroke-width": "1"
      }));
      var tick = svgEl("text", {
        x: x(v), y: topPad + rows.length * rowHeight + 16,
        "text-anchor": "middle", "font-size": "11", fill: "var(--ink-muted)"
      });
      tick.textContent = v + "°";
      svg.appendChild(tick);
    }

    rows.forEach(function (row, i) {
      var cy = topPad + i * rowHeight + rowHeight / 2 - 4;

      var name = svgEl("text", {
        x: labelWidth - 10, y: cy + 4, "text-anchor": "end",
        "font-size": "12.5", "font-weight": "600", fill: "var(--ink)"
      });
      name.textContent = row.label;
      svg.appendChild(name);

      var g = svgEl("g", { cursor: "default" });
      g.appendChild(svgEl("line", {
        x1: x(row.low), y1: cy, x2: x(row.high), y2: cy,
        stroke: row.color, "stroke-width": "5", "stroke-linecap": "round"
      }));
      g.appendChild(svgEl("circle", { cx: x(row.low), cy: cy, r: 7, fill: row.color,
        stroke: "var(--surface)", "stroke-width": "2" }));
      g.appendChild(svgEl("circle", { cx: x(row.high), cy: cy, r: 7, fill: row.color,
        stroke: "var(--surface)", "stroke-width": "2" }));

      var lowLabel = svgEl("text", {
        x: x(row.low) - 12, y: cy + 4, "text-anchor": "end",
        "font-size": "11.5", fill: "var(--ink-secondary)"
      });
      lowLabel.textContent = row.low + "°";
      g.appendChild(lowLabel);

      var highLabel = svgEl("text", {
        x: x(row.high) + 12, y: cy + 4, "text-anchor": "start",
        "font-size": "11.5", fill: "var(--ink-secondary)"
      });
      highLabel.textContent = row.high + "°";
      g.appendChild(highLabel);

      // invisible wide hit target
      var hit = svgEl("rect", {
        x: labelWidth, y: cy - rowHeight / 2 + 4, width: plotWidth, height: rowHeight - 8,
        fill: "transparent"
      });
      g.appendChild(hit);
      attachHover(g, "<strong>" + row.label + "</strong><br>" + row.note);
      svg.appendChild(g);
    });

    container.appendChild(svg);
  };

  // ---------- horizontal bar chart (single series) ----------
  // rows: [{label, value, display, note, color}]

  window.renderBarChart = function (containerId, rows, opts) {
    var container = document.getElementById(containerId);
    if (!container) return;
    opts = opts || {};
    var max = opts.max || Math.max.apply(null, rows.map(function (r) { return r.value; }));
    var labelWidth = 150;
    var rowHeight = 36;
    var topPad = 8;
    var width = 640;
    var plotWidth = width - labelWidth - 90;
    var height = topPad + rows.length * rowHeight + 8;

    var svg = svgEl("svg", { viewBox: "0 0 " + width + " " + height, role: "img",
      "aria-label": opts.ariaLabel || "Bar chart" });

    rows.forEach(function (row, i) {
      var cy = topPad + i * rowHeight;
      var barHeight = 20;
      var barWidth = Math.max(4, (row.value / max) * plotWidth);

      var name = svgEl("text", {
        x: labelWidth - 10, y: cy + barHeight / 2 + 4.5, "text-anchor": "end",
        "font-size": "12.5", "font-weight": "600", fill: "var(--ink)"
      });
      name.textContent = row.label;
      svg.appendChild(name);

      var g = svgEl("g", {});
      g.appendChild(svgEl("rect", {
        x: labelWidth, y: cy, width: barWidth, height: barHeight,
        fill: row.color || "var(--accent)", rx: 4
      }));

      var val = svgEl("text", {
        x: labelWidth + barWidth + 8, y: cy + barHeight / 2 + 4.5,
        "font-size": "12", "font-weight": "600", fill: "var(--ink-secondary)"
      });
      val.textContent = row.display;
      g.appendChild(val);

      var hit = svgEl("rect", {
        x: labelWidth, y: cy - 4, width: plotWidth + 80, height: barHeight + 8,
        fill: "transparent"
      });
      g.appendChild(hit);
      attachHover(g, "<strong>" + row.label + "</strong><br>" + row.note);
      svg.appendChild(g);
    });

    container.appendChild(svg);
  };

  // ---------- site search ----------
  // Client-side, no build step: the page list comes from the nav links, and the
  // index is built by fetching those pages on first use, so it can never drift
  // from the published content.

  var search = { index: null, building: null, results: [], active: 0, els: null };

  // One folded char per original code point, so folded indices map 1:1 back to
  // the original text for snippets and text fragments.
  function foldChars(s) {
    var chars = Array.from(s);
    var out = [];
    for (var i = 0; i < chars.length; i++) {
      out.push(chars[i].toLowerCase().normalize("NFD").charAt(0));
    }
    return out;
  }

  function pageList() {
    var links = document.querySelectorAll(".site-nav a.nav-link");
    var pages = [];
    links.forEach(function (a) {
      pages.push({ href: a.getAttribute("href"), name: a.textContent.trim() });
    });
    return pages;
  }

  function sectionise(doc, page, pageName) {
    var main = doc.querySelector("main");
    if (!main) return [];
    var entries = [];
    var current = { heading: pageName, text: "" };
    function flush() {
      var text = current.text.replace(/\s+/g, " ").trim();
      var heading = current.heading;
      if (!text && !heading) return;
      var entry = { page: page, pageName: pageName, heading: heading, text: text };
      entry.chars = Array.from(text);
      entry.folded = foldChars(text).join("");
      entry.foldedHeading = foldChars(heading).join("");
      entries.push(entry);
    }
    function walk(node) {
      for (var child = node.firstChild; child; child = child.nextSibling) {
        if (child.nodeType === 3) { current.text += child.nodeValue + " "; continue; }
        if (child.nodeType !== 1) continue;
        var tag = child.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "svg" || tag === "SVG") continue;
        if (tag === "H1" || tag === "H2" || tag === "H3") {
          flush();
          current = { heading: child.textContent.replace(/\s+/g, " ").trim(), text: "" };
        } else {
          walk(child);
        }
      }
    }
    walk(main);
    flush();
    return entries;
  }

  function buildIndex() {
    if (search.building) return search.building;
    var currentPage = window.location.pathname.split("/").pop() || "index.html";
    search.building = Promise.all(pageList().map(function (p) {
      if (p.href === currentPage) {
        return Promise.resolve(sectionise(document, p.href, p.name));
      }
      return fetch(p.href)
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var doc = new DOMParser().parseFromString(html, "text/html");
          return sectionise(doc, p.href, p.name);
        })
        .catch(function () { return []; });
    })).then(function (lists) {
      search.index = [].concat.apply([], lists);
      return search.index;
    });
    return search.building;
  }

  function scoreEntry(entry, terms) {
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var inHeading = entry.foldedHeading.indexOf(t) !== -1;
      var count = 0;
      var pos = entry.folded.indexOf(t);
      while (pos !== -1 && count < 5) { count++; pos = entry.folded.indexOf(t, pos + t.length); }
      if (!inHeading && count === 0) return 0;
      score += (inHeading ? 6 : 0) + count;
    }
    return score;
  }

  function firstMatch(entry, terms) {
    var best = null;
    for (var i = 0; i < terms.length; i++) {
      var pos = entry.folded.indexOf(terms[i]);
      if (pos !== -1 && (best === null || pos < best.pos)) best = { pos: pos, len: terms[i].length };
    }
    return best;
  }

  function matchRanges(folded, terms, from, to) {
    var ranges = [];
    terms.forEach(function (t) {
      var pos = folded.indexOf(t, from);
      while (pos !== -1 && pos < to) {
        ranges.push([pos, Math.min(pos + t.length, to)]);
        pos = folded.indexOf(t, pos + t.length);
      }
    });
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    ranges.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push(r.slice());
    });
    return merged;
  }

  function buildResult(entry, terms) {
    var m = firstMatch(entry, terms);
    var chars = entry.chars;
    var start = 0;
    var end = Math.min(chars.length, 160);
    if (m) {
      start = Math.max(0, m.pos - 55);
      end = Math.min(chars.length, m.pos + 105);
      // trim to word boundaries where cheap
      if (start > 0) {
        var sp = entry.folded.indexOf(" ", start);
        if (sp !== -1 && sp < m.pos) start = sp + 1;
      }
      if (end < chars.length) {
        var spEnd = entry.folded.lastIndexOf(" ", end);
        if (spEnd > m.pos + m.len) end = spEnd;
      }
    }
    var fragmentSource = m ? entry.text : entry.heading;
    var fragStart = m ? m.pos : 0;
    var fragEnd = m ? Math.min(chars.length, m.pos + 40) : Math.min(Array.from(entry.heading).length, 40);
    var fragChars = Array.from(fragmentSource).slice(fragStart, fragEnd);
    var fragSpace = fragChars.join("").lastIndexOf(" ");
    var phrase = fragChars.join("");
    if (m && fragEnd < chars.length && fragSpace > m.len) phrase = phrase.slice(0, fragSpace);
    phrase = phrase.trim();
    return {
      entry: entry,
      snippet: {
        start: start,
        prefix: start > 0,
        suffix: end < chars.length,
        text: chars.slice(start, end).join(""),
        ranges: matchRanges(entry.folded, terms, start, end)
      },
      fragment: phrase ? encodeURIComponent(phrase).replace(/-/g, "%2D") : ""
    };
  }

  function runSearch(query) {
    var terms = query.trim().split(/\s+/).map(function (t) {
      return foldChars(t).join("");
    }).filter(function (t) { return t.length > 0; });
    if (!terms.length || terms.join("").length < 2 || !search.index) return [];
    var scored = [];
    search.index.forEach(function (entry, i) {
      var score = scoreEntry(entry, terms);
      if (score > 0) scored.push({ entry: entry, score: score, order: i });
    });
    scored.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
    return scored.slice(0, 20).map(function (s) { return buildResult(s.entry, terms); });
  }

  function renderResults(query) {
    var els = search.els;
    els.list.textContent = "";
    search.active = 0;
    var showEmpty = query.trim().length >= 2 && search.results.length === 0 && search.index;
    els.empty.hidden = !showEmpty;
    search.results.forEach(function (r, i) {
      var li = document.createElement("li");
      if (i === 0) li.className = "active";
      var button = document.createElement("button");
      button.type = "button";
      var where = document.createElement("span");
      where.className = "search-result-where";
      where.textContent = r.entry.pageName + " › " + r.entry.heading;
      button.appendChild(where);
      var snippet = document.createElement("span");
      snippet.className = "search-result-snippet";
      var cursor = r.snippet.start;
      var snippetChars = Array.from(r.snippet.text);
      if (r.snippet.prefix) snippet.appendChild(document.createTextNode("…"));
      r.snippet.ranges.forEach(function (range) {
        if (range[0] > cursor) {
          snippet.appendChild(document.createTextNode(snippetChars.slice(cursor - r.snippet.start, range[0] - r.snippet.start).join("")));
        }
        var mark = document.createElement("mark");
        mark.textContent = snippetChars.slice(range[0] - r.snippet.start, range[1] - r.snippet.start).join("");
        snippet.appendChild(mark);
        cursor = range[1];
      });
      snippet.appendChild(document.createTextNode(snippetChars.slice(cursor - r.snippet.start).join("")));
      if (r.snippet.suffix) snippet.appendChild(document.createTextNode("…"));
      button.appendChild(snippet);
      button.addEventListener("click", function () { gotoResult(r); });
      li.appendChild(button);
      els.list.appendChild(li);
    });
  }

  function gotoResult(r) {
    var url = r.entry.page;
    if (r.fragment) url += "#:~:text=" + r.fragment;
    closeSearch();
    window.location.href = url;
    // same-page results need an explicit reload for the text fragment to apply
    if (r.entry.page === (window.location.pathname.split("/").pop() || "index.html")) {
      window.location.reload();
    }
  }

  function setActive(delta) {
    if (!search.results.length) return;
    var items = search.els.list.children;
    items[search.active].classList.remove("active");
    search.active = (search.active + delta + items.length) % items.length;
    items[search.active].classList.add("active");
    items[search.active].scrollIntoView({ block: "nearest" });
  }

  function ensureOverlay() {
    if (search.els) return;
    var overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Search");
    overlay.hidden = true;

    var panel = document.createElement("div");
    panel.className = "search-panel";
    var input = document.createElement("input");
    input.className = "search-input";
    input.type = "search";
    input.placeholder = "Search the site";
    input.setAttribute("aria-label", "Search the site");
    var list = document.createElement("ul");
    list.className = "search-results";
    var empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "No matches";
    empty.hidden = true;

    panel.appendChild(input);
    panel.appendChild(list);
    panel.appendChild(empty);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    search.els = { overlay: overlay, input: input, list: list, empty: empty };

    overlay.addEventListener("mousedown", function (e) {
      if (e.target === overlay) closeSearch();
    });
    input.addEventListener("input", function () {
      var q = input.value;
      buildIndex().then(function () {
        if (input.value !== q) return;
        search.results = runSearch(q);
        renderResults(q);
      });
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(-1); }
      else if (e.key === "Enter" && search.results.length) {
        e.preventDefault();
        gotoResult(search.results[search.active]);
      }
    });
  }

  function openSearch() {
    ensureOverlay();
    buildIndex();
    search.els.overlay.hidden = false;
    document.body.style.overflow = "hidden";
    search.els.input.focus();
    search.els.input.select();
  }

  function closeSearch() {
    if (!search.els || search.els.overlay.hidden) return;
    search.els.overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function isTypingTarget(el) {
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  }

  var navInner = document.querySelector(".site-nav .nav-inner");
  if (navInner) {
    var searchButton = document.createElement("button");
    searchButton.className = "nav-search";
    searchButton.type = "button";
    searchButton.textContent = "Search";
    searchButton.addEventListener("click", openSearch);
    navInner.appendChild(searchButton);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeSearch(); return; }
      var openCombo = (e.key === "/" && !isTypingTarget(e.target)) ||
        (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey));
      if (openCombo) { e.preventDefault(); openSearch(); }
    });
  }
})();
