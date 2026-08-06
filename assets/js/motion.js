/* Motion layer helpers — TEST page only. Progressive enhancement:
   without this file the page behaves exactly like the base site. */
(function () {
  "use strict";

  /* Stagger indexes for reveal children and facts bar */
  document.querySelectorAll(".reveal").forEach(function (root) {
    Array.prototype.forEach.call(root.children, function (child, i) {
      child.style.setProperty("--i", String(Math.min(i, 6)));
    });
  });
  document.querySelectorAll(".facts__list li").forEach(function (li, i) {
    li.style.setProperty("--i", String(i));
  });

  /* Header compresses after the page starts scrolling.

     Два порога, а не один. Шапка sticky и остаётся в потоке: сжимаясь, она
     становится на ~22px короче, страница на столько же уезжает вверх, и
     браузерный scroll anchoring подправляет scrollY на ту же величину. С одним
     порогом это замыкается в петлю (класс → высота → scrollY → класс) и у
     верхнего края страницы шапка дрожит. Расстояние между порогами больше
     разницы высот, поэтому после переключения scrollY не может допрыгнуть
     обратно за противоположный порог. */
  var header = document.querySelector(".site-header");
  if (header) {
    var SCROLLED_ON = 72;    /* > максимальной разницы высот (78 → 56) */
    var SCROLLED_OFF = 24;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var on = header.classList.contains("is-scrolled");
        if (!on && y > SCROLLED_ON) header.classList.add("is-scrolled");
        else if (on && y < SCROLLED_OFF) header.classList.remove("is-scrolled");
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Rotating word in the hero H1: gentle crossfade, width eased along */
  var swap = document.querySelector(".swap-word");
  if (swap && !reduced && swap.children.length > 1) {
    var words = Array.prototype.slice.call(swap.children);
    var idx = 0;
    function setWidth(el) { swap.style.width = el.offsetWidth + "px"; }
    setWidth(words[0]);
    setInterval(function () {
      var cur = words[idx];
      var next = words[(idx + 1) % words.length];
      cur.classList.remove("is-active");
      cur.classList.add("is-leaving");
      next.classList.add("is-entering");
      void next.offsetWidth; /* commit entering start state */
      next.classList.add("is-active");
      next.classList.remove("is-entering");
      setWidth(next);
      setTimeout(function () { cur.classList.remove("is-leaving"); }, 650);
      idx = (idx + 1) % words.length;
    }, 3200);
  }

  /* Confetti burst when the level-test result appears */
  var CONFETTI_COLORS = ["#70001f", "#e9da63", "#c79be2", "#7d6407", "#ffffff"];
  function burstConfetti(host) {
    if (reduced) return;
    var zone = host.querySelector(".m-confetti");
    if (!zone) {
      zone = document.createElement("div");
      zone.className = "m-confetti";
      zone.setAttribute("aria-hidden", "true");
      host.prepend(zone);
    }
    zone.innerHTML = "";
    for (var k = 0; k < 18; k++) {
      var i = document.createElement("i");
      if (k % 3 === 0) i.className = "round";
      var ang = (Math.PI * 2 * k) / 18 + Math.random() * 0.4;
      var dist = 70 + Math.random() * 90;
      i.style.setProperty("--c", CONFETTI_COLORS[k % CONFETTI_COLORS.length]);
      i.style.setProperty("--tx", Math.cos(ang) * dist + "px");
      i.style.setProperty("--ty", Math.sin(ang) * dist * 0.8 - 30 + "px");
      i.style.setProperty("--rot", (Math.random() * 540 - 270) + "deg");
      i.style.setProperty("--cd", (Math.random() * 0.12) + "s");
      zone.appendChild(i);
    }
  }
  document.querySelectorAll("[data-quiz-result]").forEach(function (box) {
    new MutationObserver(function () {
      if (!box.hidden) burstConfetti(box);
    }).observe(box, { attributes: true, attributeFilter: ["hidden"] });
  });
})();
