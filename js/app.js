"use strict";

/*
 * love-constellation — page logic.
 *
 * Every memory is a star. Stars are placed on a slow spiral (deterministic per
 * star) and joined in the order they happened, so the sky grows into a shape
 * that is only ours. Positions are stored, so nothing ever moves.
 */

(function () {
  var STORE = "mena-constellation";

  var state = {
    stars: [],
    selectedId: null
  };

  var canvas = null;
  var ctx = null;

  /* ---------------- storage ---------------- */

  function load() {
    state.stars = [];
    var raw = null;
    try { raw = localStorage.getItem(STORE); } catch (e) { raw = null; }
    var s = null;
    if (raw) { try { s = JSON.parse(raw); } catch (e) { s = null; } }
    if (s && Array.isArray(s.stars)) {
      s.stars.forEach(function (m) {
        if (m && typeof m.id === "string" && typeof m.title === "string") {
          state.stars.push({
            id: m.id,
            title: m.title.slice(0, 120),
            note: typeof m.note === "string" ? m.note.slice(0, 900) : "",
            date: typeof m.date === "string" ? m.date.slice(0, 10) : "",
            x: isFinite(m.x) ? clamp01(m.x) : 0.5,
            y: isFinite(m.y) ? clamp01(m.y) : 0.5
          });
        }
      });
    }
    state.stars.sort(function (a, b) {
      return (a.date || "") < (b.date || "") ? -1 : ((a.date || "") > (b.date || "") ? 1 : 0);
    });
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify({ stars: state.stars })); } catch (e) { /* ignore */ }
  }

  /* ---------------- helpers ---------------- */

  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = String(value);
  }

  function note(msg) { setText("save-note", msg); }

  function dayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function pretty(iso) {
    var parts = String(iso).split("-");
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var months = ["January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"];
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
  }

  function nextId() {
    var max = 0;
    state.stars.forEach(function (s) {
      var n = parseInt(String(s.id).replace(/\D/g, ""), 10);
      if (n > max) max = n;
    });
    return "s" + (max + 1);
  }

  function placeStar(index) {
    var angle = index * 2.39996323;
    var r = Math.min(0.43, 0.09 + 0.34 * Math.sqrt(index / 50));
    return {
      x: clamp01(0.5 + Math.cos(angle) * r),
      y: clamp01(0.5 + Math.sin(angle) * r * 0.62)
    };
  }

  function findStar(id) {
    for (var i = 0; i < state.stars.length; i += 1) {
      if (state.stars[i].id === id) return state.stars[i];
    }
    return null;
  }

  /* ---------------- actions ---------------- */

  function addStar(title, noteText) {
    title = String(title || "").trim();
    if (!title) return false;
    var pos = placeStar(state.stars.length);
    var star = {
      id: nextId(),
      title: title.slice(0, 120),
      note: String(noteText || "").trim().slice(0, 900),
      date: dayISO(),
      x: pos.x,
      y: pos.y
    };
    state.stars.push(star);
    state.stars.sort(function (a, b) {
      return (a.date || "") < (b.date || "") ? -1 : ((a.date || "") > (b.date || "") ? 1 : 0);
    });
    save();
    state.selectedId = star.id;
    render();
    return true;
  }

  function removeStar(id) {
    for (var i = 0; i < state.stars.length; i += 1) {
      if (state.stars[i].id === id) {
        state.stars.splice(i, 1);
        save();
        if (state.selectedId === id) state.selectedId = null;
        render();
        note("That star is gone.");
        return true;
      }
    }
    return false;
  }

  function resetSky() {
    state.stars = [];
    state.selectedId = null;
    save();
    render();
    note("The sky is clear \u2014 ready for new stars.");
  }

  /* ---------------- drawing ---------------- */

  function redraw() {
    if (!ctx || !canvas) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (state.stars.length > 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,159,207,0.28)";
      ctx.lineWidth = Math.max(1, w / 900);
      ctx.beginPath();
      ctx.moveTo(state.stars[0].x * w, state.stars[0].y * h);
      for (var i = 1; i < state.stars.length; i += 1) {
        ctx.lineTo(state.stars[i].x * w, state.stars[i].y * h);
      }
      ctx.stroke();
      ctx.restore();
    }

    state.stars.forEach(function (s) {
      var px = s.x * w;
      var py = s.y * h;
      var selected = s.id === state.selectedId;
      var core = w / 110 * (selected ? 2.1 : 1.3);
      ctx.save();
      ctx.fillStyle = selected ? "rgba(255,159,207,0.35)" : "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(px, py, core * 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = selected ? "#ff9fcf" : "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, core, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function selectAt(nx, ny) {
    var w = canvas.width;
    var h = canvas.height;
    var best = null;
    var bestD = (w / 28) * (w / 28);
    state.stars.forEach(function (s) {
      var dx = s.x * w - nx * w;
      var dy = s.y * h - ny * h;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = s; }
    });
    if (best) {
      state.selectedId = best.id;
      render();
      return true;
    }
    return false;
  }

  /* ---------------- rendering ---------------- */

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function renderSelected() {
    var panel = document.getElementById("selected-panel");
    var star = state.selectedId ? findStar(state.selectedId) : null;
    if (panel) panel.hidden = !star;
    if (!star) return;
    setText("selected-title", star.title);
    setText("selected-date", star.date ? pretty(star.date) : "");
    setText("selected-note", star.note || "");
  }

  function renderList() {
    var list = document.getElementById("star-list");
    if (list) {
      list.textContent = "";
      if (!state.stars.length) {
        var empty = el("p", "star-empty");
        empty.textContent = "No stars yet \u2014 the sky is waiting for us.";
        list.appendChild(empty);
      } else {
        state.stars.slice().reverse().forEach(function (s) {
          var item = el("div", "star-item");
          item.setAttribute("data-id", s.id);
          item.appendChild(el("span", "star-dot")).textContent = "\u2726";
          item.appendChild(el("span", "star-item-title")).textContent = s.title;
          if (s.date) item.appendChild(el("span", "star-item-date")).textContent = pretty(s.date);
          item.addEventListener("click", function () {
            state.selectedId = s.id;
            render();
          });
          list.appendChild(item);
        });
      }
    }
    setText("star-count", state.stars.length);
  }

  function render() {
    var hint = document.getElementById("sky-hint");
    if (hint) hint.hidden = state.stars.length > 0;
    renderSelected();
    renderList();
    redraw();
  }

  /* ---------------- wiring ---------------- */

  function pointFrom(ev) {
    var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width, height: canvas.height };
    var w = rect.width || canvas.width;
    var h = rect.height || canvas.height;
    return {
      x: (ev.clientX - rect.left) / w,
      y: (ev.clientY - rect.top) / h
    };
  }

  function wire() {
    var add = document.getElementById("add-star");
    if (add) add.addEventListener("click", function () {
      var t = document.getElementById("star-title");
      var n = document.getElementById("star-note");
      if (!t || !String(t.value).trim()) {
        note("Write the memory first \u2665");
        return;
      }
      addStar(t.value, n ? n.value : "");
      if (t) t.value = "";
      if (n) n.value = "";
      note("Added to the sky \u2665");
    });

    var rm = document.getElementById("remove-star");
    if (rm) rm.addEventListener("click", function () {
      if (state.selectedId) removeStar(state.selectedId);
    });

    var reset = document.getElementById("reset-sky");
    if (reset) reset.addEventListener("click", resetSky);

    var share = document.getElementById("share-button");
    if (share) share.addEventListener("click", function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { note("Link copied \u2665"); })
          .catch(function () { note(url); });
        return;
      }
      note(url);
    });

    if (canvas && canvas.addEventListener) {
      canvas.addEventListener("pointerdown", function (ev) {
        var p = pointFrom(ev);
        selectAt(p.x, p.y);
      });
    }
  }

  /* ---------------- boot ---------------- */

  document.addEventListener("DOMContentLoaded", function () {
    canvas = document.getElementById("sky-canvas");
    if (canvas && canvas.getContext) ctx = canvas.getContext("2d");
    load();
    render();
    wire();

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  });
})();
