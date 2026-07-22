/* ============================================================
   Shared prototype behaviours — used by proto-a/b/c.
   All features are opt-in via data-* hooks so each variant
   supplies its own markup/layout. Progressive enhancement.
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Reveal on scroll ---- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Sliders ---- */
  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector("[data-slider-track]");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    var prev = root.querySelector("[data-slider-prev]");
    var next = root.querySelector("[data-slider-next]");
    var dotsWrap = root.querySelector("[data-slider-dots]");
    var dots = [];

    function step() {
      if (slides.length < 2) return track.clientWidth;
      return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left || track.clientWidth;
    }
    function current() {
      var s = step();
      return s ? Math.round(track.scrollLeft / s) : 0;
    }
    function go(i) {
      var max = slides.length - 1;
      i = Math.max(0, Math.min(max, i));
      track.scrollTo({ left: i * step(), behavior: "smooth" });
    }
    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        b.addEventListener("click", function () { go(i); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }
    function sync() {
      var c = current();
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === c); d.setAttribute("aria-current", i === c ? "true" : "false"); });
      if (prev) prev.disabled = c <= 0;
      if (next) next.disabled = c >= slides.length - 1;
    }
    if (prev) prev.addEventListener("click", function () { go(current() - 1); });
    if (next) next.addEventListener("click", function () { go(current() + 1); });
    var raf;
    track.addEventListener("scroll", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(current() - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(current() + 1); e.preventDefault(); }
    });
    sync();
  });

  /* ---- Pricing toggle ---- */
  document.querySelectorAll("[data-pricing]").forEach(function (root) {
    var btns = Array.prototype.slice.call(root.querySelectorAll("[data-plan]"));
    var panels = Array.prototype.slice.call(root.querySelectorAll("[data-plan-panel]"));
    function set(plan) {
      btns.forEach(function (b) {
        var on = b.getAttribute("data-plan") === plan;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-plan-panel") !== plan;
      });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { set(b.getAttribute("data-plan")); }); });
    var initial = (btns.filter(function (b) { return b.classList.contains("is-active"); })[0] || btns[0]);
    if (initial) set(initial.getAttribute("data-plan"));
  });

  /* ---- Plan calculator ---- */
  var PRICES = { pack5: { per: 43, name: "5-lesson package" }, pack10: { per: 40, name: "10-lesson package" } };
  var FIRST = {
    beginner: "You'd see first confident sentences in around four lessons.",
    intermediate: "Expect noticeably smoother meetings within about ten lessons.",
    advanced: "We'd polish precision and tone from the very first lesson."
  };
  var FOCUS_LABEL = {
    speaking: "speaking & meetings", correspondence: "business correspondence",
    interview: "interview prep", incompany: "in-company team training"
  };
  var LEVEL_LABEL = { beginner: "beginner (A1–A2)", intermediate: "intermediate (B1)", advanced: "advanced (B2–C1)" };
  var FREQ_WEEK = { once: 1, twice: 2, intensive: 3 };

  function readGroup(root, name) {
    var el = root.querySelector("[name='" + name + "']:checked") || root.querySelector("select[name='" + name + "']");
    return el ? el.value : null;
  }
  document.querySelectorAll("[data-calc]").forEach(function (root) {
    var out = root.querySelector("[data-calc-result]");
    var incompany = root.querySelector("[data-calc-incompany]");
    var standard = root.querySelector("[data-calc-standard]");
    function update() {
      var focus = readGroup(root, "focus");
      var level = readGroup(root, "level");
      var freq = readGroup(root, "frequency");
      if (!focus || !level || !freq) return;
      var isIn = focus === "incompany";
      if (incompany) incompany.hidden = !isIn;
      if (standard) standard.hidden = isIn;
      if (isIn) { if (out) out.setAttribute("data-state", "incompany"); return; }
      var pack = (freq === "intensive" || freq === "twice") ? PRICES.pack10 : PRICES.pack5;
      var perWeek = pack.per * FREQ_WEEK[freq];
      var txt = "We'd start with the " + pack.name + " at €" + pack.per + "/lesson (about €" +
        perWeek + "/week), focused on " + FOCUS_LABEL[focus] + " at " + LEVEL_LABEL[level] + ". " + FIRST[level];
      var target = root.querySelector("[data-calc-text]") || out;
      if (target) target.textContent = txt;
      if (out) out.setAttribute("data-state", "ready");
    }
    root.addEventListener("change", update);
    root.addEventListener("input", update);
    update();
  });

  /* ---- CEFR quiz ---- */
  var BANDS = [
    { max: 3, band: "A1 — Beginner", desc: "We build the foundation — from first words to first sentences.", course: "intensive", courseName: "Speaking intensive" },
    { max: 6, band: "A2 — Elementary", desc: "You have the basics; we turn them into speaking confidence.", course: "intensive", courseName: "Speaking intensive" },
    { max: 9, band: "B1 — Intermediate", desc: "Solid base — we push you into fluent, professional English.", course: "business", courseName: "Business English, 1-on-1" },
    { max: 12, band: "B2 — Upper-Intermediate", desc: "Strong already — we refine precision, tone and correspondence.", course: "correspondence", courseName: "Business correspondence" },
    { max: 15, band: "C1 — Advanced", desc: "Near-native — we polish nuance, style and high-stakes writing.", course: "correspondence", courseName: "Business correspondence" }
  ];
  /* Highlight a catalogue card (Skeleton 4); no-op on other skeletons. */
  function recommendCourse(key, name) {
    var cards = document.querySelectorAll("[data-rec-course]");
    if (!cards.length) return;
    cards.forEach(function (el) { el.classList.toggle("is-recommended", el.getAttribute("data-rec-course") === key); });
    document.querySelectorAll("[data-quiz-course]").forEach(function (el) { el.textContent = name; });
  }
  document.querySelectorAll("[data-quiz]").forEach(function (root) {
    var qs = Array.prototype.slice.call(root.querySelectorAll("[data-quiz-q]"));
    var progress = root.querySelector("[data-quiz-progress]");
    var resultBox = root.querySelector("[data-quiz-result]");
    var bandEl = root.querySelector("[data-quiz-band]");
    var descEl = root.querySelector("[data-quiz-desc]");
    var restart = root.querySelector("[data-quiz-restart]");
    var quizBody = root.querySelector("[data-quiz-body]");
    var answers = {};
    var idx = 0;

    function showQ(i) {
      qs.forEach(function (q, n) { q.hidden = n !== i; });
      if (progress) progress.textContent = String(Math.min(i + 1, qs.length)).padStart(2, "0") + " / " + String(qs.length).padStart(2, "0");
    }
    function finish() {
      var total = 0;
      Object.keys(answers).forEach(function (k) { total += answers[k]; });
      var b = BANDS.find(function (x) { return total <= x.max; }) || BANDS[BANDS.length - 1];
      if (bandEl) bandEl.textContent = b.band;
      if (descEl) descEl.textContent = b.desc;
      if (b.course) recommendCourse(b.course, b.courseName);
      if (quizBody) quizBody.hidden = true;
      if (resultBox) { resultBox.hidden = false; resultBox.setAttribute("tabindex", "-1"); resultBox.focus(); }
    }
    qs.forEach(function (q, qi) {
      q.querySelectorAll("[data-score]").forEach(function (opt) {
        opt.addEventListener("click", function () {
          answers[qi] = parseInt(opt.getAttribute("data-score"), 10) || 0;
          q.querySelectorAll("[data-score]").forEach(function (o) { o.classList.remove("is-picked"); o.setAttribute("aria-pressed", "false"); });
          opt.classList.add("is-picked"); opt.setAttribute("aria-pressed", "true");
          if (qi + 1 < qs.length) { idx = qi + 1; setTimeout(function () { showQ(idx); }, 180); }
          else { setTimeout(finish, 180); }
        });
      });
    });
    if (restart) restart.addEventListener("click", function () {
      answers = {}; idx = 0;
      if (resultBox) resultBox.hidden = true;
      if (quizBody) quizBody.hidden = false;
      root.querySelectorAll("[data-score]").forEach(function (o) { o.classList.remove("is-picked"); o.setAttribute("aria-pressed", "false"); });
      showQ(0);
    });
    if (qs.length) showQ(0);
  });

  /* ---- Sticky mobile CTA ---- */
  var sticky = document.querySelector("[data-sticky-cta]");
  var hero = document.querySelector(".hero");
  if (sticky && hero && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { sticky.classList.toggle("is-shown", !en.isIntersecting); });
    }, { rootMargin: "-40% 0px 0px 0px" });
    so.observe(hero);
  }

  /* ---- Persona router (Skeleton 2) ---- */
  (function () {
    var root = document.documentElement;
    var setters = Array.prototype.slice.call(document.querySelectorAll("[data-persona-set]"));
    if (!setters.length) return;
    function apply(p) {
      root.setAttribute("data-persona-active", p);
      document.querySelectorAll("[data-persona-set]").forEach(function (b) {
        var on = b.getAttribute("data-persona-set") === p;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      document.querySelectorAll("[data-persona]").forEach(function (el) {
        el.hidden = el.getAttribute("data-persona") !== p;
      });
    }
    setters.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-persona-set")); });
    });
    apply(root.getAttribute("data-persona-active") || setters[0].getAttribute("data-persona-set") || "pro");
  })();

  /* ---- Goal personalisation helpers (Skeleton 3) ---- */
  function revealGoal(goal) {
    document.querySelectorAll("[data-goal]").forEach(function (el) { el.hidden = el.getAttribute("data-goal") !== goal; });
    document.documentElement.setAttribute("data-goal-active", goal);
  }
  function recommendPlan(planKey) {
    document.querySelectorAll("[data-rec-plan]").forEach(function (el) {
      el.classList.toggle("is-recommended", el.getAttribute("data-rec-plan") === planKey);
    });
  }

  /* ---- Wizard (tool-led hero, Skeleton 3) ---- */
  document.querySelectorAll("[data-wizard]").forEach(function (root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll("[data-wizard-step]"));
    var progress = root.querySelector("[data-wizard-progress]");
    var resultBox = root.querySelector("[data-wizard-result]");
    var textEl = root.querySelector("[data-wizard-text]") || resultBox;
    var restart = root.querySelector("[data-wizard-restart]");
    var body = root.querySelector("[data-wizard-body]");
    var answers = {};
    function show(n) {
      steps.forEach(function (s, k) { s.hidden = k !== n; });
      if (progress) progress.textContent = String(Math.min(n + 1, steps.length)).padStart(2, "0") + " / " + String(steps.length).padStart(2, "0");
    }
    function finish() {
      var focus = answers.focus, level = answers.level, freq = answers.frequency;
      var pack, planKey;
      if (freq === "intensive" || freq === "twice") { pack = PRICES.pack10; planKey = "pack10"; }
      else { pack = PRICES.pack5; planKey = "pack5"; }
      var perWeek = pack.per * FREQ_WEEK[freq];
      var txt = "We'd start with the " + pack.name + " at €" + pack.per + "/lesson (about €" + perWeek +
        "/week), focused on " + (FOCUS_LABEL[focus] || focus) + " at " + (LEVEL_LABEL[level] || level) + ". " + (FIRST[level] || "");
      if (textEl) textEl.textContent = txt;
      if (body) body.hidden = true;
      if (resultBox) { resultBox.hidden = false; resultBox.setAttribute("tabindex", "-1"); resultBox.focus(); }
      revealGoal(focus);
      recommendPlan(planKey);
    }
    steps.forEach(function (step, si) {
      step.querySelectorAll("[data-wizard-opt]").forEach(function (opt) {
        opt.addEventListener("click", function () {
          var field = opt.getAttribute("data-field");
          answers[field] = opt.getAttribute("data-value");
          step.querySelectorAll("[data-wizard-opt]").forEach(function (o) { o.classList.remove("is-picked"); o.setAttribute("aria-pressed", "false"); });
          opt.classList.add("is-picked"); opt.setAttribute("aria-pressed", "true");
          if (si + 1 < steps.length) { setTimeout(function () { show(si + 1); }, 160); }
          else { setTimeout(finish, 160); }
        });
      });
    });
    if (restart) restart.addEventListener("click", function () {
      answers = {};
      if (resultBox) resultBox.hidden = true;
      if (body) body.hidden = false;
      root.querySelectorAll("[data-wizard-opt]").forEach(function (o) { o.classList.remove("is-picked"); o.setAttribute("aria-pressed", "false"); });
      show(0);
    });
    if (steps.length) show(0);
  });

  /* ---- Catalogue filter (Skeleton 4) ----
     [data-catalog] wraps the grid; each card carries [data-tags="online writing"].
     Chips are [data-filter="writing"], counter is [data-catalog-count],
     empty-state is [data-catalog-empty]. Any element with [data-filter-jump]
     (segments block, hero finder) can apply a filter from elsewhere on the page. */
  var catalogs = [];
  document.querySelectorAll("[data-catalog]").forEach(function (root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-tags]"));
    var chips = Array.prototype.slice.call(root.querySelectorAll("[data-filter]"));
    var empty = root.querySelector("[data-catalog-empty]");
    var count = root.querySelector("[data-catalog-count]");

    function apply(tag) {
      tag = tag || "all";
      var shown = 0;
      cards.forEach(function (card) {
        var tags = " " + (card.getAttribute("data-tags") || "") + " ";
        var on = tag === "all" || tags.indexOf(" " + tag + " ") > -1;
        card.hidden = !on;
        if (on) shown++;
      });
      chips.forEach(function (c) {
        var on = c.getAttribute("data-filter") === tag;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = shown === cards.length
        ? "All " + cards.length + " courses"
        : "Showing " + shown + " of " + cards.length + " courses";
      root.setAttribute("data-active-filter", tag);
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); });
    });
    apply(root.getAttribute("data-catalog") || "all");
    catalogs.push({ root: root, apply: apply });
  });

  function filterCatalogs(tag, scroll) {
    catalogs.forEach(function (c) { c.apply(tag); });
    if (scroll && catalogs.length) {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      catalogs[0].root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  document.querySelectorAll("[data-filter-jump]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      filterCatalogs(el.getAttribute("data-filter-jump"), true);
    });
  });

  /* ---- Hero course finder (Skeleton 4) ---- */
  var FINDER_GOAL_TAG = { speaking: "speaking", correspondence: "writing", interview: "exam", team: "incompany" };
  var FINDER_GOAL_LABEL = {
    speaking: "speaking & meetings", correspondence: "business correspondence",
    interview: "interview or exam prep", team: "training for a team"
  };
  var FINDER_LEVEL_LABEL = { beginner: "A1–A2", intermediate: "B1", advanced: "B2–C1" };
  document.querySelectorAll("[data-finder]").forEach(function (form) {
    var out = form.querySelector("[data-finder-note]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var goal = readGroup(form, "goal");
      var format = readGroup(form, "format");
      var level = readGroup(form, "level");
      var tag = format === "group" ? "incompany" : (FINDER_GOAL_TAG[goal] || "all");
      if (out) {
        out.hidden = false;
        out.textContent = "Filtered for " + (FINDER_GOAL_LABEL[goal] || "your goal") +
          (format === "group" ? ", in-company" : ", online 1-on-1") +
          ", level " + (FINDER_LEVEL_LABEL[level] || "—") + ".";
      }
      filterCatalogs(tag, true);
    });
  });

  /* Default goal state so Skeleton 3 downstream blocks are coherent pre-interaction */
  if (document.querySelector("[data-goal]") && !document.documentElement.getAttribute("data-goal-active")) {
    revealGoal("speaking");
    recommendPlan("pack10");
  }
})();
