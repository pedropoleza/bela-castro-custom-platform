/* ============================================================
   VIDA BELA — interaction layer
   parallax · reveal · tilt · theme · particles
   ============================================================ */
(function () {
  "use strict";

  const root = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- THEME ---------- */
  const toggle = document.getElementById("themeToggle");
  const stored = localStorage.getItem("vb-theme");
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  }
  toggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    localStorage.setItem("vb-theme", next);
  });

  /* ---------- SCROLL REVEAL ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  if (prefersReduced) return; // skip motion-heavy work

  /* ---------- PARTICLES (atmospheric) ---------- */
  const pBox = document.getElementById("particles");
  if (pBox) {
    const count = window.innerWidth < 600 ? 14 : 30;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      const size = Math.random() * 2.5 + 1;
      s.style.left = Math.random() * 100 + "%";
      s.style.bottom = Math.random() * 40 + "%";
      s.style.width = s.style.height = size + "px";
      s.style.animationDuration = (Math.random() * 18 + 16) + "s";
      s.style.animationDelay = (Math.random() * -30) + "s";
      frag.appendChild(s);
    }
    pBox.appendChild(frag);
  }

  /* ---------- PARALLAX (scroll) ---------- */
  const layers = Array.from(document.querySelectorAll("[data-speed]"));
  const glow = document.querySelector(".scene__glow");
  let scrollY = window.scrollY;
  let mouseX = 0, mouseY = 0;
  let ticking = false;

  function render() {
    layers.forEach((layer) => {
      const speed = parseFloat(layer.dataset.speed) || 0;
      const y = -scrollY * speed;
      const mx = mouseX * speed * 22;
      const my = mouseY * speed * 14;
      layer.style.transform = `translate3d(${mx}px, ${y + my}px, 0)`;
    });
    if (glow) {
      glow.style.transform = `translate3d(calc(-50% + ${mouseX * 26}px), ${scrollY * 0.06 + mouseY * 18}px, 0)`;
    }
    ticking = false;
  }
  function requestRender() {
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }

  window.addEventListener("scroll", () => { scrollY = window.scrollY; requestRender(); }, { passive: true });
  window.addEventListener("resize", requestRender);

  /* ---------- MOUSE DEPTH (desktop only) ---------- */
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (fine) {
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      requestRender();
    }, { passive: true });
  }
  render();

  /* ---------- CARD TILT (3D) ---------- */
  if (fine) {
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      const card = el.querySelector(".day__card") || el;
      let raf = null;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg) translateZ(18px)`;
        });
      });
      el.addEventListener("mouseleave", () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateZ(0)";
      });
    });
  }
})();
