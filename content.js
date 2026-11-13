// Shorts Scroll Counter — counts every time you move to a new YouTube Short.
(() => {
  const KEY = "shortsScrollCounter";

  let state = { date: todayStr(), today: 0, total: 0, pos: null, collapsed: false };
  let session = 0;
  let lastId = null;
  let box = null;

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function currentShortId() {
    const m = location.pathname.match(/^\/shorts\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  // ---------- storage ----------
  function save() {
    try {
      chrome.storage.local.set({ [KEY]: state });
    } catch (_) {
      // Extension was reloaded; this old script can no longer save. Ignore.
    }
  }

  function load(cb) {
    try {
      chrome.storage.local.get(KEY, (res) => {
        if (res && res[KEY]) state = Object.assign(state, res[KEY]);
        rollOverDay();
        cb();
      });
    } catch (_) {
      cb();
    }
  }

  function rollOverDay() {
    const t = todayStr();
    if (state.date !== t) {
      state.date = t;
      state.today = 0;
    }
  }

  // Keep several open YouTube tabs in sync.
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[KEY] && changes[KEY].newValue) {
        state = Object.assign(state, changes[KEY].newValue);
        render();
      }
    });
  } catch (_) {}

  // ---------- UI ----------
  function build() {
    box = document.createElement("div");
    box.id = "ssc-box";
    box.innerHTML = `
      <div class="ssc-head">
        <span class="ssc-title">Shorts scrolled</span>
        <span class="ssc-btns">
          <button class="ssc-btn" data-act="reset" title="Reset today's count">&#8634;</button>
          <button class="ssc-btn" data-act="collapse" title="Minimise">&#8211;</button>
        </span>
      </div>
      <div class="ssc-num">0</div>
      <div class="ssc-sub">
        <span>session <b class="ssc-session">0</b></span>
        <span>all-time <b class="ssc-total">0</b></span>
      </div>`;
    document.documentElement.appendChild(box);

    box.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "reset") {
        if (confirm("Reset today's Shorts count to 0?")) {
          state.today = 0;
          session = 0;
          save();
          render();
        }
      } else if (act === "collapse") {
        state.collapsed = !state.collapsed;
        save();
        render();
      }
    });

    makeDraggable(box);
    render();
  }

  function makeDraggable(el) {
    let startX, startY, startLeft, startTop, dragging = false;

    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      dragging = true;
      const r = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = r.left;
      startTop = r.top;
      el.setPointerCapture(e.pointerId);
      el.classList.add("ssc-dragging");
    });

    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const left = clamp(startLeft + e.clientX - startX, 0, window.innerWidth - el.offsetWidth);
      const top = clamp(startTop + e.clientY - startY, 0, window.innerHeight - el.offsetHeight);
      el.style.left = left + "px";
      el.style.top = top + "px";
      el.style.right = "auto";
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("ssc-dragging");
      state.pos = { left: parseFloat(el.style.left), top: parseFloat(el.style.top) };
      save();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function render() {
    if (!box) return;
    box.querySelector(".ssc-num").textContent = state.today.toLocaleString();
    box.querySelector(".ssc-session").textContent = session.toLocaleString();
    box.querySelector(".ssc-total").textContent = state.total.toLocaleString();
    box.classList.toggle("ssc-collapsed", !!state.collapsed);
    box.querySelector('[data-act="collapse"]').innerHTML = state.collapsed ? "&#43;" : "&#8211;";
    if (state.pos) {
      box.style.left = clamp(state.pos.left, 0, Math.max(0, window.innerWidth - box.offsetWidth)) + "px";
      box.style.top = clamp(state.pos.top, 0, Math.max(0, window.innerHeight - box.offsetHeight)) + "px";
      box.style.right = "auto";
    }
  }

  function bump() {
    const n = box.querySelector(".ssc-num");
    n.classList.remove("ssc-bump");
    void n.offsetWidth; // restart the animation
    n.classList.add("ssc-bump");
  }

  // ---------- counting ----------
  function onScroll() {
    rollOverDay();
    state.today += 1;
    state.total += 1;
    session += 1;
    save();
    render();
    bump();
  }

  function tick() {
    const id = currentShortId();
    if (!id) {
      // Left Shorts: hide the box and start fresh next time.
      lastId = null;
      if (box) box.style.display = "none";
      return;
    }
    if (!box) build();
    box.style.display = "";
    if (id !== lastId) {
      // The first Short you open isn't a scroll; every change after that is.
      if (lastId !== null) onScroll();
      lastId = id;
    }
  }

  load(() => {
    tick();
    // YouTube is a single-page app, so watch the URL instead of page loads.
    setInterval(tick, 250);
    window.addEventListener("resize", render);
  });
})();
