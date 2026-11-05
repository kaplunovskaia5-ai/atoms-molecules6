
"use strict";

(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* Theory tabs */
  const tabs = $("#theoryTabs");
  if (tabs) {
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-tab]");
      if (!b) return;
      $$("#theoryTabs button").forEach((x) => x.classList.toggle("on", x === b));
      ["t1", "t2", "t3", "t4"].forEach((id) => {
        const pan = $("#" + id);
        if (pan) pan.hidden = id !== b.dataset.tab;
      });
    });
  }

  /* Sorting */
  const AM_ITEMS = [
    { id: "fe", label: "Fe (одна частица)", kind: "atom" },
    { id: "h2o", label: "H₂O", kind: "molecule" },
    { id: "o1", label: "Один кубик O", kind: "atom" },
    { id: "oo", label: "O—O", kind: "molecule" },
    { id: "n2", label: "N₂", kind: "molecule" },
    { id: "h1", label: "Атом H", kind: "atom" }
  ];
  const SC_ITEMS = [
    { id: "O2", label: "O₂", kind: "simple" },
    { id: "Fe", label: "Fe", kind: "simple" },
    { id: "H2O", label: "H₂O", kind: "complex" },
    { id: "CO2", label: "CO₂", kind: "complex" },
    { id: "N2", label: "N₂", kind: "simple" },
    { id: "S", label: "S", kind: "simple" },
    { id: "NaCl", label: "NaCl", kind: "complex" },
    { id: "H2", label: "H₂", kind: "simple" }
  ];

  let mode = "am";
  let items = AM_ITEMS.slice();
  const place = Object.create(null);
  const pool = $("#sortPool");
  const z1 = $("#zone1");
  const z2 = $("#zone2");

  function currentItems() {
    return mode === "am" ? AM_ITEMS : SC_ITEMS;
  }

  function setMode(m) {
    mode = m;
    items = currentItems().slice();
    Object.keys(place).forEach((k) => { delete place[k]; });
    if (mode === "am") {
      $("#z1title").textContent = "Атом";
      $("#z2title").textContent = "Молекула";
      z1.dataset.accept = "atom";
      z2.dataset.accept = "molecule";
    } else {
      $("#z1title").textContent = "Простое вещество";
      $("#z2title").textContent = "Сложное вещество";
      z1.dataset.accept = "simple";
      z2.dataset.accept = "complex";
    }
    clearZones();
    renderPool();
    $("#sortFb").textContent = "";
  }

  function makeChip(it) {
    const el = document.createElement("span");
    el.className = "chip";
    el.draggable = true;
    el.textContent = it.label;
    el.dataset.id = it.id;
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", it.id);
      e.dataTransfer.effectAllowed = "move";
    });
    return el;
  }

  function clearZones() {
    [z1, z2].forEach((z) => {
      $$(".chip", z).forEach((n) => n.remove());
    });
  }

  function renderPool() {
    pool.innerHTML = "";
    currentItems().forEach((it) => {
      if (!place[it.id]) pool.appendChild(makeChip(it));
    });
  }

  function placeIn(id, zone) {
    const it = currentItems().find((x) => x.id === id);
    if (!it || place[id]) return;
    place[id] = zone.dataset.accept;
    const chip = makeChip(it);
    chip.draggable = false;
    chip.classList.add("locked");
    zone.appendChild(chip);
    renderPool();
  }

  [z1, z2].forEach((z) => {
    z.addEventListener("dragover", (e) => { e.preventDefault(); z.classList.add("over"); });
    z.addEventListener("dragleave", () => z.classList.remove("over"));
    z.addEventListener("drop", (e) => {
      e.preventDefault();
      z.classList.remove("over");
      placeIn(e.dataTransfer.getData("text/plain"), z);
    });
  });

  $("#sortMode").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-mode]");
    if (!b) return;
    $$("#sortMode button").forEach((x) => x.classList.toggle("on", x === b));
    setMode(b.dataset.mode);
  });

  $("#sortReset").onclick = () => setMode(mode);
  $("#sortCheck").onclick = () => {
    let ok = 0;
    const all = currentItems();
    all.forEach((it) => {
      if (place[it.id] === it.kind) ok += 1;
    });
    const fb = $("#sortFb");
    fb.textContent = "Верно: " + ok + " из " + all.length;
    fb.className = "feedback " + (ok === all.length ? "ok" : "bad");
  };

  setMode("am");

  /* Molecule builder */
  const ATOMS = [
    { sym: "H", cls: "H" },
    { sym: "O", cls: "O" },
    { sym: "C", cls: "C" },
    { sym: "N", cls: "N" }
  ];
  const TARGETS = [
    { name: "Кислород (простое)", need: { O: 2 }, formula: "O₂" },
    { name: "Вода (сложное)", need: { H: 2, O: 1 }, formula: "H₂O" },
    { name: "Азот (простое)", need: { N: 2 }, formula: "N₂" },
    { name: "Углекислый газ (сложное)", need: { C: 1, O: 2 }, formula: "CO₂" },
    { name: "Водород (простое)", need: { H: 2 }, formula: "H₂" }
  ];
  let built = [];
  let tIndex = 0;
  let bScore = 0;
  const canvas = $("#builderCanvas");
  const palette = $("#palette");

  ATOMS.forEach((a) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "atom " + a.cls;
    b.textContent = a.sym;
    b.title = "Добавить " + a.sym;
    b.onclick = () => {
      built.push(a.sym);
      drawBuilt();
    };
    palette.appendChild(b);
  });

  function drawBuilt() {
    canvas.innerHTML = "";
    built.forEach((sym, i) => {
      if (i) {
        const bond = document.createElement("span");
        bond.className = "bond";
        canvas.appendChild(bond);
      }
      const el = document.createElement("span");
      const meta = ATOMS.find((x) => x.sym === sym);
      el.className = "atom " + (meta ? meta.cls : "");
      el.textContent = sym;
      canvas.appendChild(el);
    });
    if (!built.length) canvas.textContent = "Кубики появятся здесь…";
  }

  function showTarget() {
    const t = TARGETS[tIndex];
    $("#bTarget").innerHTML = "Собери: <b>" + t.name + "</b> · формула <b>" + t.formula + "</b>";
    $("#bFb").textContent = "";
  }

  function counts() {
    const c = Object.create(null);
    built.forEach((s) => { c[s] = (c[s] || 0) + 1; });
    return c;
  }

  function matchNeed(need) {
    const c = counts();
    const keys = Object.keys(need);
    if (Object.keys(c).length !== keys.length) return false;
    return keys.every((k) => c[k] === need[k]);
  }

  $("#bUndo").onclick = () => { built.pop(); drawBuilt(); };
  $("#bClear").onclick = () => { built = []; drawBuilt(); };
  $("#bCheck").onclick = () => {
    const t = TARGETS[tIndex];
    const fb = $("#bFb");
    if (matchNeed(t.need)) {
      bScore += 1;
      $("#bScore").textContent = String(bScore);
      fb.textContent = "Отлично! Это " + t.formula + ".";
      fb.className = "feedback ok";
    } else {
      fb.textContent = "Пока не совпало. Смотри число и виды кубиков.";
      fb.className = "feedback bad";
    }
  };
  $("#bNext").onclick = () => {
    tIndex = (tIndex + 1) % TARGETS.length;
    built = [];
    drawBuilt();
    showTarget();
  };
  drawBuilt();
  showTarget();

  /* Quiz */
  const QUIZ = [
    { q: "Молекула воды состоит из…", opts: ["только H", "H и O", "только O", "Fe"], a: 1 },
    { q: "O₂ — это…", opts: ["атом", "сложное вещество", "простое вещество", "смесь"], a: 2 },
    { q: "Наименьшая частица элемента — …", opts: ["молекула", "атом", "тело", "раствор"], a: 1 },
    { q: "Почему NaCl сложное?", opts: ["твёрдое", "атомы разных элементов", "белое", "растворимо"], a: 1 },
    { q: "Два одинаковых кубика вместе — модель…", opts: ["атома", "молекулы простого вещества", "сложного вещества", "смеси"], a: 1 },
    { q: "CO₂ — …", opts: ["простое вещество", "сложное вещество", "атом", "элемент"], a: 1 }
  ];
  let qi = 0;
  let qs = 0;
  const box = $("#quizBox");

  function renderQuiz() {
    if (qi >= QUIZ.length) {
      box.innerHTML = "<p><b>Итог:</b> " + qs + " / " + QUIZ.length + "</p>" +
        "<p>Дескриптор D: ≥80% → 2 б; 50–79% → 1 б.</p>" +
        "<button type='button' class='btn' id='qAgain'>Ещё раз</button>";
      const again = $("#qAgain");
      if (again) again.onclick = () => { qi = 0; qs = 0; renderQuiz(); };
      return;
    }
    const item = QUIZ[qi];
    let h = "<p>Вопрос " + (qi + 1) + " / " + QUIZ.length + " · счёт " + qs + "</p>";
    h += "<h3>" + item.q + "</h3>";
    item.opts.forEach((o, i) => {
      h += "<button type='button' class='qopt' data-i='" + i + "'>" + String.fromCharCode(1072 + i) + ") " + o + "</button>";
    });
    h += "<div class='feedback' id='qfb'></div>";
    box.innerHTML = h;
    $$(".qopt", box).forEach((btn) => {
      btn.onclick = () => {
        const choice = Number(btn.dataset.i);
        $$(".qopt", box).forEach((b) => {
          b.disabled = true;
          const bi = Number(b.dataset.i);
          if (bi === item.a) b.classList.add("ok");
          else if (bi === choice) b.classList.add("bad");
        });
        const fb = $("#qfb");
        if (choice === item.a) {
          qs += 1;
          fb.textContent = "Верно!";
          fb.className = "feedback ok";
        } else {
          fb.textContent = "Неверно. Правильный ответ подсвечен.";
          fb.className = "feedback bad";
        }
        setTimeout(() => { qi += 1; renderQuiz(); }, 700);
      };
    });
  }
  renderQuiz();
})();
