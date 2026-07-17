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
})();
