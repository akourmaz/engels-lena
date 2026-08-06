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

    /* Ширина шага измеряется один раз и пересчитывается только при ресайзе:
       чтение геометрии на каждый скролл вызывало forced reflow (видно в Lighthouse). */
    var stepCache = 0;
    function measure() {
      stepCache = slides.length < 2
        ? track.clientWidth
        : (slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left) || track.clientWidth;
    }
    function step() {
      if (!stepCache) measure();
      return stepCache;
    }
    function current() {
      var s = step();
      return s ? Math.round(track.scrollLeft / s) : 0;
    }
    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () { measure(); });
      ro.observe(track);
    } else {
      window.addEventListener("resize", measure, { passive: true });
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
    { max: 3, band: "A1 — Beginner", desc: "We build the foundation — from first words to first sentences.", course: "business", courseName: "Business English, 1-on-1" },
    { max: 6, band: "A2 — Elementary", desc: "You have the basics; we turn them into speaking confidence.", course: "business", courseName: "Business English, 1-on-1" },
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
        ? "All " + cards.length + " courses & services"
        : "Showing " + shown + " of " + cards.length;
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
  var FINDER_GOAL_TAG = { english: "en", dutch: "nl", slavic: "other", translation: "other" };
  var FINDER_GOAL_LABEL = {
    english: "English", dutch: "Dutch",
    slavic: "Ukrainian or Russian", translation: "translation work"
  };
  var FINDER_FORMAT_LABEL = {
    online: "online 1-on-1", borger: "at my place in Borger", workplace: "a group at your workplace"
  };
  var FINDER_LEVEL_LABEL = { beginner: "A1–A2", intermediate: "B1", advanced: "B2–C1" };
  document.querySelectorAll("[data-finder]").forEach(function (form) {
    var out = form.querySelector("[data-finder-note]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var goal = readGroup(form, "goal");
      var format = readGroup(form, "format");
      var level = readGroup(form, "level");
      var tag = format === "workplace" ? "incompany" : (FINDER_GOAL_TAG[goal] || "all");
      if (out) {
        out.hidden = false;
        out.textContent = "Filtered for " + (FINDER_GOAL_LABEL[goal] || "your goal") +
          ", " + (FINDER_FORMAT_LABEL[format] || "online") +
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

  /* ---- Booking dialog (conversion flow without Calendly) ----------------
     Любая кнопка [data-book] открывает модалку с формой заявки.
     Значение атрибута = метка источника (уходит в поле `source` → в письмо
     и в Google-таблицу, чтобы видеть, какой CTA работает).
     Необязательные подсказки на кнопке: data-book-goal / data-book-plan.

     Форма спрашивает минимум: имя, один контакт (e-mail ИЛИ телефон) и
     согласие. Всё остальное берётся из контекста без вопросов:
       — тексты модалки подбираются по смыслу кнопки (пробный / команда / тариф);
       — цель и уровень подставляются из калькулятора [data-calc] и квиза;
       — канал ответа определяется по тому, что человек ввёл в контакт.
     Модуль не активируется, если [data-book-dialog] на странице нет. */
  (function () {
    var dlg = document.querySelector("[data-book-dialog]");
    if (!dlg) return;
    var form = dlg.querySelector("[data-book-form]");
    var successPane = dlg.querySelector("[data-book-success]");
    var errorBox = dlg.querySelector("[data-book-error]");
    var submitBtn = form ? form.querySelector("[data-book-submit]") : null;
    var sourceOut = dlg.querySelector("[data-book-source-label]");
    var contactInput = form ? form.querySelector("[data-book-contact]") : null;
    var lastFocus = null;
    var supportsModal = typeof dlg.showModal === "function";

    var GOAL_FROM_FOCUS = {
      speaking: "speaking", correspondence: "correspondence",
      interview: "interview", incompany: "incompany", team: "incompany"
    };
    var LEVEL_FROM_BAND = { A: "beginner", B1: "intermediate", B2: "advanced", C: "advanced" };

    var WA = "https://wa.me/31618404015?text=";
    var PLAN_NAME = { single: "a single lesson", pack5: "the package of 5 lessons", pack10: "the package of 10 lessons" };

    /* Тексты модалки по смыслу кнопки. Ключ выбирается в pickCopy().
       Пробных уроков нет — вход в воронку везде один: бесплатный интейк-разговор. */
    var COPY = {
      intake: {
        kicker: "Free intake call · 15 minutes · online",
        title: "Book your free intake call",
        lead: "Leave your name and one contact — an e-mail address or a phone number. I reply within 24 hours with two or three times that fit. Fifteen minutes, no payment, nothing to prepare.",
        msgLabel: "Anything I should know?",
        msgHint: "Your job, what you struggle with, when you are usually free…",
        done: "I read every message myself and reply within 24 hours with two or three possible times. If it is urgent, WhatsApp is the fastest way to reach me.",
        submit: "Book my intake call",
        wa: "Hi Lena! I'd like a free intake call about English lessons."
      },
      plan: {
        kicker: "Intake call first · then we set the course",
        title: "Start with a free intake call",
        lead: "Nothing is fixed yet: at the intake we agree the goal, the rate, how long the course runs and how often we meet. Leave your name and one contact — an e-mail address or a phone number — and I reply within 24 hours with times that fit.",
        msgLabel: "Anything I should know?",
        msgHint: "Your job, what you struggle with, when you are usually free…",
        done: "I read every message myself and reply within 24 hours with two or three possible times. If it is urgent, WhatsApp is the fastest way to reach me.",
        submit: "Book my intake call",
        wa: "Hi Lena! I'd like a free intake call about English lessons."
      },
      incompany: {
        kicker: "In-company training · Drenthe &amp; Groningen",
        title: "Get a proposal for your team",
        lead: "Leave your name and one contact — an e-mail address or a phone number — and a line about your team. I reply within 24 hours with a proposal: format, dates and price.",
        msgLabel: "About your team",
        msgOptional: false,        /* здесь строчка о команде и правда нужна */
        msgHint: "How many people, what they need English for, where you are based…",
        done: "I read every message myself and reply within 24 hours with a proposal for your team — format, dates and price. If it is urgent, WhatsApp is the fastest way to reach me.",
        submit: "Ask for a proposal",
        wa: "Hi Lena! We'd like a proposal for in-company English training."
      },
      level: {
        kicker: "Free intake call · 15 minutes · online",
        title: "Let&rsquo;s confirm your level",
        lead: "The self-check gives a rough band — we confirm it properly at the free 15-minute intake call. Leave your name and one contact, an e-mail address or a phone number, and I reply within 24 hours.",
        msgLabel: "Anything I should know?",
        msgHint: "Your job, what you struggle with, when you are usually free…",
        done: "I read every message myself and reply within 24 hours with two or three possible times. If it is urgent, WhatsApp is the fastest way to reach me.",
        submit: "Book my intake call",
        wa: "Hi Lena! I did the level check on your site and I'd like an intake call."
      }
    };

    function pickCopy(trigger) {
      if (!trigger) return "intake";
      if (trigger.getAttribute("data-book-goal") === "incompany") return "incompany";
      if (trigger.getAttribute("data-book-plan")) return "plan";
      if ((trigger.getAttribute("data-book") || "").indexOf("level") === 0) return "level";
      return "intake";
    }

    function setText(sel, html) {
      var el = dlg.querySelector(sel);
      if (el) el.innerHTML = html;
    }

    /* Кнопка → тексты модалки. Единственное, что человек видит как «выбор». */
    function applyCopy(trigger) {
      var copy = COPY[pickCopy(trigger)] || COPY.intake;
      setText("[data-book-kicker]", copy.kicker);
      setText("[data-book-heading]", copy.title);
      setText("[data-book-lead]", copy.lead);
      setText("[data-book-msg-label]", copy.msgLabel +
        (copy.msgOptional === false ? "" : ' <span class="field__opt">optional</span>'));
      setText("[data-book-submit-label]", copy.submit);
      setText("[data-book-done]", copy.done);
      var msg = dlg.querySelector("[data-book-msg]");
      if (msg) msg.setAttribute("placeholder", copy.msgHint);
      var wa = dlg.querySelector("[data-book-wa]");
      if (wa) wa.setAttribute("href", WA + encodeURIComponent(copy.wa));
    }

    /* Один контакт вместо двух полей: решаем, что это, по форме записи. */
    function looksLikeEmail(v) { return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v); }
    function looksLikePhone(v) { return /^\+?[\d][\d\s().\-]{6,}$/.test(v) && (v.replace(/\D/g, "").length >= 7); }

    function validateContact() {
      if (!contactInput) return;
      var v = contactInput.value.trim();
      var ok = v === "" || looksLikeEmail(v) || looksLikePhone(v);
      contactInput.setCustomValidity(ok ? "" : "Please enter an e-mail address or a phone number so I can reply.");
    }

    function setField(name, value) {
      if (!form || !value) return;
      var el = form.elements[name];
      if (!el) return;
      /* Не перетираем то, что человек уже ввёл руками. */
      if (el.dataset && el.dataset.touched === "1") return;
      var ok = Array.prototype.some.call(el.options || [], function (o) { return o.value === value; });
      if (el.options && !ok) return;
      el.value = value;
    }

    /* Контекст страницы → предзаполнение формы. */
    function prefillFromPage(trigger) {
      var calc = document.querySelector("[data-calc]");
      if (calc) {
        var focus = readGroup(calc, "focus");
        var level = readGroup(calc, "level");
        if (focus) setField("goal", GOAL_FROM_FOCUS[focus] || "");
        if (level) setField("level", level);
      }
      var band = document.querySelector("[data-quiz-band]");
      var quizResult = document.querySelector("[data-quiz-result]");
      if (band && quizResult && !quizResult.hidden) {
        var text = (band.textContent || "").trim();
        var key = text.indexOf("A") === 0 ? "A" : text.indexOf("B2") === 0 ? "B2" : text.indexOf("B1") === 0 ? "B1" : text.indexOf("C") === 0 ? "C" : "";
        if (LEVEL_FROM_BAND[key]) setField("level", LEVEL_FROM_BAND[key]);
      }
      if (trigger) {
        setField("goal", trigger.getAttribute("data-book-goal"));
        var plan = trigger.getAttribute("data-book-plan");
        if (plan && form.elements.plan) form.elements.plan.value = plan;
      }
    }

    function open(trigger) {
      lastFocus = trigger || document.activeElement;
      applyCopy(trigger);
      if (form) {
        var src = (trigger && trigger.getAttribute("data-book")) || "unknown";
        if (form.elements.source) form.elements.source.value = src;
        if (form.elements.page) form.elements.page.value = location.pathname;
        if (form.elements.started) form.elements.started.value = String(Date.now());
        /* Подпись показываем только когда человек пришёл из конкретного блока
           (тариф, in-company, результат теста) — иначе это шум. */
        /* Модалка одна на страницу: чистим контекст прошлого открытия,
           иначе к заявке из hero прилипнет тариф, выбранный до этого. */
        ["goal", "level", "plan"].forEach(function (n) {
          if (form.elements[n]) form.elements[n].value = "";
        });
        var label = trigger && trigger.getAttribute("data-book-label");
        var plan = trigger && trigger.getAttribute("data-book-plan");
        if (sourceOut) sourceOut.textContent = label ? "About: " + (PLAN_NAME[plan] || label) : "";
        prefillFromPage(trigger);
      }
      if (supportsModal) dlg.showModal();
      else dlg.setAttribute("open", "");
      document.documentElement.classList.add("has-modal");
      var first = dlg.querySelector("[data-book-autofocus]") || (form && form.elements.name);
      if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 30);
    }

    function close() {
      if (supportsModal && dlg.open) dlg.close();
      else dlg.removeAttribute("open");
      document.documentElement.classList.remove("has-modal");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-book]") : null;
      if (trigger) { e.preventDefault(); open(trigger); return; }
      if (e.target.closest && e.target.closest("[data-book-close]")) { e.preventDefault(); close(); }
    });

    /* Клик по подложке закрывает модалку (нативный dialog отдаёт клик самому dialog). */
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener("close", function () { document.documentElement.classList.remove("has-modal"); });
    if (!supportsModal) {
      dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    }

    if (!form) return;
    Array.prototype.forEach.call(form.elements, function (el) {
      el.addEventListener("input", function () { if (el.dataset) el.dataset.touched = "1"; });
    });

    if (contactInput) {
      contactInput.addEventListener("input", validateContact);
      contactInput.addEventListener("blur", validateContact);
    }

    /* Контакт → скрытые email / whatsapp / reply_channel: схема письма и
       таблицы не меняется, а человеку не нужно выбирать канал ответа. */
    function splitContact() {
      if (!contactInput) return;
      var v = contactInput.value.trim();
      var mail = looksLikeEmail(v);
      if (form.elements.email) form.elements.email.value = mail ? v : "";
      if (form.elements.whatsapp) form.elements.whatsapp.value = mail ? "" : v;
      if (form.elements.reply_channel) form.elements.reply_channel.value = mail ? "email" : "whatsapp";
    }

    function state(name) {
      form.setAttribute("data-state", name);
      if (submitBtn) {
        submitBtn.disabled = name === "sending";
        submitBtn.setAttribute("aria-busy", name === "sending" ? "true" : "false");
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      validateContact();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      splitContact();
      if (errorBox) errorBox.hidden = true;

      var endpoint = form.getAttribute("action");
      var demo = !endpoint || endpoint === "#" || form.hasAttribute("data-demo");
      state("sending");

      var done = function () {
        state("sent");
        if (successPane) {
          successPane.hidden = false;
          successPane.setAttribute("tabindex", "-1");
          successPane.focus();
        }
        form.hidden = true;
      };
      var fail = function () {
        state("idle");
        if (errorBox) { errorBox.hidden = false; errorBox.focus(); }
      };

      if (demo) { setTimeout(done, 500); return; }

      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } })
        .then(function (r) { return r.ok ? r.json().catch(function () { return { ok: true }; }) : Promise.reject(r); })
        .then(function (data) { if (data && data.ok === false) fail(); else done(); })
        .catch(fail);
    });
  })();
})();
